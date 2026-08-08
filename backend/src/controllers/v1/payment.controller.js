const getStripeInstance = require('../../config/stripe');
const prisma = require('../../lib/prisma');
const { ApiError } = require('../../utils/ApiError');
const { ApiResponse } = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { priceFerryBooking, PricingError } = require('../../utils/ferry-pricing');
const { resolveAgentTerms } = require('../../utils/agent-pricing');

/**
 * Stripe wants the smallest unit of the currency. Both currencies this platform
 * settles in — MVR and USD — have 100 of them to the unit.
 */
const minorUnits = (amount) => Math.round(Number(amount) * 100);

/**
 * The currency a booking is charged in follows the passenger tier, exactly as
 * it does everywhere else: locals and expats in rufiyaa, tourists in dollars.
 * Nothing is converted.
 */
const stripeCurrency = (fareCurrency) => (fareCurrency === 'USD' ? 'usd' : 'mvr');

/** Re-price a request from the database, or fail the way the client should see. */
const priceOrThrow = async (bookingData, user) => {
  const agentTerms = await resolveAgentTerms(prisma, {
    actor: user,
    vendorId: bookingData.vendorId,
    requestedAgentId: bookingData.agentId,
  });
  try {
    const priced = await priceFerryBooking(prisma, bookingData, agentTerms);
    return { ...priced, agentTerms };
  } catch (err) {
    if (err instanceof PricingError) throw new ApiError(err.statusCode, err.message);
    throw err;
  }
};

/**
 * Create a payment intent for a ferry booking.
 *
 * The amount charged is computed here from the operator's published fare, the
 * route markup and the platform cut — never taken from the request. It used to
 * be `bookingData.finalAmount`, which meant anyone who could edit a request
 * could name their own price and Stripe would charge it.
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const bookingData = req.body;

  if (!bookingData || !Array.isArray(bookingData.seatNumbers) || !bookingData.seatNumbers.length) {
    throw new ApiError(400, 'Invalid booking data');
  }

  const { fare } = await priceOrThrow(bookingData, req.user);

  try {
    const stripe = await getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: minorUnits(fare.customerPays),
      currency: stripeCurrency(fare.currency),
      automatic_payment_methods: { enabled: true },
      metadata: {
        // Only what identifies the booking. The prices are recomputed when the
        // payment succeeds, so nothing here is trusted as money.
        vendorId: bookingData.vendorId || '',
        scheduleId: bookingData.scheduleId || '',
        seats: String(bookingData.seatNumbers.length),
        infants: String(bookingData.infants || 0),
      },
    });

    return res.json(
      new ApiResponse(200, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        // So the button and the card sheet cannot disagree about the total.
        amount: fare.customerPays,
        currency: fare.currency,
      })
    );
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new ApiError(500, 'Failed to create payment intent');
  }
});

/**
 * Record the booking once Stripe confirms the payment.
 *
 * The fare is computed again rather than read from the request, so a card
 * booking carries the same ledger as a cash one. Without it, every card booking
 * was written with a null markup, platform fee and vendor net — the operator's
 * settlement figures were simply missing.
 */
const createBookingAfterPayment = asyncHandler(async (req, res) => {
  const bookingData = req.body;
  const { paymentIntentId } = bookingData;

  if (!paymentIntentId) {
    throw new ApiError(400, 'Payment intent ID is required');
  }

  const stripe = await getStripeInstance();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, 'Payment has not been completed');
  }

  const { fare, bands, infantCount, agentTerms } = await priceOrThrow(bookingData, req.user);

  // What Stripe actually took, against what this booking should cost. A
  // mismatch means the request changed between the intent and this call, and
  // recording it either way would put a wrong number on the operator's payout.
  const charged = paymentIntent.amount_received ?? paymentIntent.amount;
  if (charged !== minorUnits(fare.customerPays)) {
    throw new ApiError(
      409,
      'The amount paid no longer matches this booking. Nothing has been charged twice — please contact support with your payment reference.'
    );
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        vehicleId: bookingData.vehicleId,
        vendorId: bookingData.vendorId,
        routeId: bookingData.routeId,
        scheduleId: bookingData.scheduleId || null,
        userId: req.user.id,
        agentId: agentTerms.agentId ?? undefined,
        boardingPointId: bookingData.boardingPointId,
        droppingPointId: bookingData.droppingPointId,
        bookingDate: new Date(bookingData.bookingDate),
        seatNumbers: bookingData.seatNumbers,
        passengers: bookingData.passengers ?? undefined,
        contactEmail: bookingData.contactEmail || null,
        contactPhone: bookingData.contactPhone || null,
        // Server-computed, like the cash path. The client's figures are ignored.
        totalAmount: fare.gross,
        discountAmount: fare.agentDiscount,
        finalAmount: fare.customerPays,
        agentCommission: fare.agentCommission,
        markupAmount: fare.markupTotal,
        platformFeeAmount: fare.platformPercentAmount + fare.platformFlatAmount,
        vendorNetAmount: fare.vendorNet,
        childCount: bands.children,
        infantCount,
        passengerCategory: bookingData.passengerCategory || undefined,
        // Card bookings were dropping these, which broke the MVR/USD split.
        currency: fare.currency,
        paymentMethod: 'STRIPE',
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentIntentId,
      },
    });

    return res.json(
      new ApiResponse(200, { success: true, booking }, 'Booking created successfully')
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    throw new ApiError(500, 'Failed to create booking');
  }
});

module.exports = {
  createPaymentIntent,
  createBookingAfterPayment,
};
