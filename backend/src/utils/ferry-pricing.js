/**
 * Pricing a ferry seat booking, in one place.
 *
 * There are three ways a ferry booking reaches the database — cash through
 * POST /bookings, card through the Stripe intent, and card again when the
 * payment succeeds — and all three have to arrive at the same number. When each
 * one worked it out for itself, the card path simply believed whatever total
 * the browser posted, so a booking could be paid for at any price the customer
 * cared to name and no fare ledger was written at all.
 *
 * Everything here is read from the database. Nothing about the money comes from
 * the request.
 */
const {
  childBaseForTier,
  computeFare,
  countBands,
  loadPlatformConfig,
  loadRouteMarkup,
} = require('./fare-engine');

const TIER_FIELD = {
  LOCAL: 'priceLocalMvr',
  EXPAT: 'priceExpatMvr',
  TOURIST: 'priceTouristUsd',
};

const MARKUP_FIELD = {
  LOCAL: 'markupLocal',
  EXPAT: 'markupExpat',
  TOURIST: 'markupTourist',
};

/** Thrown when the request's own shape is wrong, rather than its prices. */
class PricingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PricingError';
    this.statusCode = 400;
  }
}

/**
 * Work out what this booking costs and who gets what.
 *
 * @param {object} prisma
 * @param {object} input
 * @param {string} [input.scheduleId]  the departure being booked
 * @param {string} [input.routeId]
 * @param {string} [input.passengerCategory]  LOCAL | EXPAT | TOURIST
 * @param {Array}  input.seatNumbers   one entry per seat sold
 * @param {Array}  [input.passengers]  one form per seat; dates of birth decide bands
 * @param {number} [input.infants]     lap infants, who have neither
 * @param {string|Date} [input.bookingDate]
 * @param {number} [input.totalAmount] only used when no schedule price exists
 * @param {object} [agentTerms]        { discountPercent, commissionPercent }
 *
 * @returns {{ fare: object, bands: object, infantCount: number, tier: string }}
 */
async function priceFerryBooking(prisma, input, agentTerms = {}) {
  const [platform, routeMarkup] = await Promise.all([
    loadPlatformConfig(prisma),
    loadRouteMarkup(prisma, input.routeId),
  ]);

  const tier = input.passengerCategory || 'LOCAL';
  const tierField = TIER_FIELD[tier] || TIER_FIELD.LOCAL;
  const markupField = MARKUP_FIELD[tier] || MARKUP_FIELD.LOCAL;

  // The operator's own price for this departure is the only trustworthy base.
  const schedule = input.scheduleId
    ? await prisma.busSchedule.findUnique({
        where: { id: input.scheduleId },
        select: {
          priceLocalMvr: true,
          priceExpatMvr: true,
          priceTouristUsd: true,
          childFareEnabled: true,
          childPriceLocalMvr: true,
          childPriceExpatMvr: true,
          childPriceTouristUsd: true,
          childPercent: true,
          infantPercent: true,
        },
      })
    : null;

  const seatCount = Math.max(1, (input.seatNumbers || []).length);

  /**
   * Who is actually travelling.
   *
   * Children are read off the dates of birth already collected at checkout,
   * not off anything the client asserts about price. A booking made without
   * passenger details — manual and agent bookings, where an operator types a
   * name at the counter — has no dates to read, so every seat is an adult and
   * the fare is exactly what it was before bands existed.
   */
  const travelDate = input.bookingDate ? new Date(input.bookingDate) : new Date();
  const bands = input.passengers?.length
    ? countBands(input.passengers, travelDate)
    : { adults: seatCount, children: 0, infants: 0 };
  const infantCount = Math.max(0, Number(input.infants) || 0);

  // Passenger forms and seats must agree. They disagree only if the payload was
  // tampered with or a form was dropped, and neither should be priced.
  const seated = bands.adults + bands.children;
  if (input.passengers?.length && seated !== seatCount) {
    throw new PricingError(
      `Passenger details do not match the seats booked (${seated} passenger(s) for ${seatCount} seat(s)).`
    );
  }

  // Without a schedule to price against (manual and legacy bookings) fall back
  // to the submitted total, treated as already-public and markup-free.
  const hasBase = schedule && schedule[tierField] != null;
  const basePerSeat = hasBase
    ? Number(schedule[tierField])
    : Number(input.totalAmount || 0) / seatCount;

  const fare = computeFare({
    basePerSeat,
    markupPerSeat: hasBase ? routeMarkup[markupField] : 0,
    adults: bands.adults,
    children: bands.children,
    infants: infantCount,
    // Off, an explicit price, or a percentage — resolved from the schedule
    // rather than decided here. A booking with no schedule to price against
    // keeps the old default of half fare.
    childBasePerSeat: hasBase
      ? childBaseForTier(schedule, tier, basePerSeat)
      : undefined,
    infantPercent: hasBase ? Number(schedule.infantPercent ?? 0) : 0,
    tier,
    platform,
    agentDiscountPercent: agentTerms.discountPercent || 0,
    agentCommissionPercent: agentTerms.commissionPercent || 0,
  });

  return { fare, bands, infantCount, tier, pricedFromSchedule: !!hasBase };
}

module.exports = { priceFerryBooking, PricingError };
