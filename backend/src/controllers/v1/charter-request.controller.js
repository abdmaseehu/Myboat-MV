const { PrismaClient } = require('@prisma/client');
const { notify, getVendorUserId } = require('../../utils/notify');
const prisma = new PrismaClient();

// Helper: get vendor for the authenticated user (VENDOR role)
const getVendorForUser = async (userId) => {
  return prisma.vendor.findUnique({ where: { userId } });
};

// Optional decimal coercion: '' / null / undefined -> null
const toDecimal = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
};

const routeLabel = (r) => `${r.origin} → ${r.destination}`;

// GET /charter-requests
// Operators see their own + broadcast (vendorId=null) PENDING requests
// Admins see everything
const getMyRequests = async (req, res) => {
  try {
    const { status, search, isManual } = req.query;
    const where = {};

    if (req.user.role === 'ADMIN') {
      // no filter
    } else if (req.user.role === 'VENDOR') {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor) {
        return res
          .status(400)
          .json({ success: false, message: 'Vendor profile not found for user' });
      }
      where.OR = [{ vendorId: vendor.id }, { vendorId: null }];
    } else {
      // USER role - only their own submissions
      where.userId = req.user.id;
    }

    if (status) where.status = status;
    if (typeof isManual !== 'undefined') where.isManual = isManual === 'true';
    if (search) {
      where.AND = [
        {
          OR: [
            { guestName: { contains: search, mode: 'insensitive' } },
            { guestEmail: { contains: search, mode: 'insensitive' } },
            { origin: { contains: search, mode: 'insensitive' } },
            { destination: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const requests = await prisma.charterRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vessel: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });

    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getMyRequests charter error', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// GET /charter-requests/requested-by-me - customer's own submitted requests
const getRequestsIRequested = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const requests = await prisma.charterRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vessel: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true, phone: true, email: true } },
      },
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getRequestsIRequested charter error', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// GET /charter-requests/:id
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.charterRequest.findUnique({
      where: { id },
      include: {
        vessel: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    return res.json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /charter-requests
// Customer or operator creates one.
const createRequest = async (req, res) => {
  try {
    const body = req.body || {};
    const isOperator = req.user.role === 'VENDOR';

    let vendorId = body.vendorId || null;
    let isManual = !!body.isManual;
    // Customers always start at PENDING; only an operator picks a status.
    let status = 'PENDING';

    if (isOperator) {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor) {
        return res
          .status(400)
          .json({ success: false, message: 'Vendor profile not found' });
      }
      vendorId = vendor.id;
      isManual = true;
      status = body.status || 'ACCEPTED';
    }

    const data = {
      userId: body.userId || (isOperator ? null : req.user.id),
      vendorId,
      origin: body.origin,
      destination: body.destination,
      tripDate: new Date(body.tripDate),
      departureTime: body.departureTime ? new Date(`1970-01-01T${body.departureTime}`) : null,
      passengers: parseInt(body.passengers, 10) || 1,
      returnTrip: !!body.returnTrip,
      returnDate: body.returnDate ? new Date(body.returnDate) : null,
      returnTime: body.returnTime ? new Date(`1970-01-01T${body.returnTime}`) : null,
      guestName: body.guestName || null,
      guestEmail: body.guestEmail || null,
      guestPhone: body.guestPhone || null,
      specialRequirements: body.specialRequirements || null,
      status,
      isManual,
      vesselId: body.vesselId || null,
      captainPhone: body.captainPhone || null,
      meetingPoint: body.meetingPoint || null,
      arrivalFlight: body.arrivalFlight || null,
      arrivalFlightTime: body.arrivalFlightTime ? new Date(body.arrivalFlightTime) : null,
      departureFlight: body.departureFlight || null,
      departureFlightTime: body.departureFlightTime ? new Date(body.departureFlightTime) : null,
      hotelName: body.hotelName || null,
      passengerNames: Array.isArray(body.passengerNames) ? body.passengerNames : null,
      paymentMethod: body.paymentMethod || 'CASH',
      paymentType: body.paymentType || 'FULL',
      operatorNotes: body.operatorNotes || null,
    };

    // Only an operator may set a price. A customer posting quotedPrice would
    // otherwise be naming their own fare, and body.status let them mark it
    // ACCEPTED at the same time.
    if (isOperator && body.quotedPrice) {
      data.quotedPrice = body.quotedPrice;
      data.quotedCurrency = body.quotedCurrency || 'MVR';
      data.quotedAt = new Date();
    }

    const created = await prisma.charterRequest.create({ data });

    // A customer targeting a specific operator -> tell that operator.
    if (!isOperator && vendorId) {
      const vendorUserId = await getVendorUserId(prisma, vendorId);
      if (vendorUserId) {
        await notify(prisma, {
          userId: vendorUserId,
          type: 'REQUEST_RECEIVED',
          title: `New charter request: ${routeLabel(created)}`,
          body: `${created.passengers} passenger(s) on ${new Date(created.tripDate)
            .toISOString()
            .slice(0, 10)}. Send a quote to win this booking.`,
          link: '/admin/charter-requests',
          entityType: 'CHARTER_REQUEST',
          entityId: created.id,
        });
      }
    }

    // TODO: send confirmation email to guest + operator inbox and generate e-ticket
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('createRequest charter error', error);
    return res
      .status(400)
      .json({ success: false, message: 'Failed to create request', error: error.message });
  }
};

// PATCH /charter-requests/:id/quote
const sendQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotedPrice,
      quotedCurrency = 'MVR',
      operatorNotes,
      vesselId,
      pricePerNm,
      estimatedDistanceNm,
      waitingCharges,
      priceIncludes,
      quoteNotes,
      quoteValidUntil,
    } = req.body;

    if (!quotedPrice) {
      return res.status(400).json({ success: false, message: 'quotedPrice required' });
    }

    const request = await prisma.charterRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (req.user.role === 'VENDOR') {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor) {
        return res.status(400).json({ success: false, message: 'Vendor not found' });
      }
      if (request.vendorId && request.vendorId !== vendor.id) {
        return res.status(403).json({ success: false, message: 'Not your request' });
      }
      // If broadcast, claim it by attaching vendorId
      if (!request.vendorId) {
        await prisma.charterRequest.update({
          where: { id },
          data: { vendorId: vendor.id },
        });
      }
    }

    const data = {
      quotedPrice,
      quotedCurrency,
      quotedAt: new Date(),
      status: 'QUOTED',
      operatorNotes: operatorNotes || request.operatorNotes,
      pricePerNm: toDecimal(pricePerNm),
      estimatedDistanceNm: toDecimal(estimatedDistanceNm),
      waitingCharges: waitingCharges || null,
      priceIncludes: priceIncludes || null,
      quoteNotes: quoteNotes || null,
      quoteValidUntil: quoteValidUntil ? new Date(quoteValidUntil) : null,
    };
    if (vesselId) data.vesselId = vesselId;

    const updated = await prisma.charterRequest.update({ where: { id }, data });

    // Notify the customer that a quote landed.
    if (updated.userId) {
      await notify(prisma, {
        userId: updated.userId,
        type: 'QUOTE_RECEIVED',
        title: `Quote received for ${routeLabel(updated)}`,
        body: `${quotedCurrency} ${Number(quotedPrice).toLocaleString()} — review and accept in My Requests.`,
        link: '/users/my-requests',
        entityType: 'CHARTER_REQUEST',
        entityId: updated.id,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('sendQuote charter error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /charter-requests/:id
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.charterRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (req.user.role === 'VENDOR') {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor || (request.vendorId && request.vendorId !== vendor.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    } else if (req.user.role === 'USER') {
      if (request.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      // Customers can only change status (accept/reject a quote) or cancel
      const allowed = ['status'];
      const filtered = {};
      for (const k of allowed) {
        if (typeof req.body?.[k] !== 'undefined') filtered[k] = req.body[k];
      }
      req.body = filtered;
      const allowedStatuses = ['ACCEPTED', 'REJECTED', 'CANCELLED'];
      if (filtered.status && !allowedStatuses.includes(filtered.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status transition' });
      }
    }

    const body = req.body || {};
    const data = { ...body };
    if (body.tripDate) data.tripDate = new Date(body.tripDate);
    if (body.returnDate) data.returnDate = new Date(body.returnDate);
    if (body.departureTime)
      data.departureTime = new Date(`1970-01-01T${body.departureTime}`);
    if (body.returnTime) data.returnTime = new Date(`1970-01-01T${body.returnTime}`);
    if (body.arrivalFlightTime) data.arrivalFlightTime = new Date(body.arrivalFlightTime);
    if (body.departureFlightTime)
      data.departureFlightTime = new Date(body.departureFlightTime);

    const updated = await prisma.charterRequest.update({ where: { id }, data });

    // Customer accepted / rejected the quote -> tell the operator.
    if (
      req.user.role === 'USER' &&
      (data.status === 'ACCEPTED' || data.status === 'REJECTED') &&
      updated.vendorId
    ) {
      const vendorUserId = await getVendorUserId(prisma, updated.vendorId);
      if (vendorUserId) {
        const accepted = data.status === 'ACCEPTED';
        await notify(prisma, {
          userId: vendorUserId,
          type: accepted ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED',
          title: `${accepted ? 'Quote accepted' : 'Quote declined'}: ${routeLabel(updated)}`,
          body: accepted
            ? `The customer accepted your ${updated.quotedCurrency || 'MVR'} ${Number(
                updated.quotedPrice || 0
              ).toLocaleString()} charter quote.`
            : 'The customer declined your charter quote.',
          link: '/admin/charter-requests',
          entityType: 'CHARTER_REQUEST',
          entityId: updated.id,
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /charter-requests/:id/payment-info
// Returns the operator's bank details for the currency the quote is in.
// Deliberately narrow: only the owning customer, only once ACCEPTED.
const getPaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.charterRequest.findUnique({
      where: { id },
      include: { vessel: { select: { id: true, vehicleName: true } } },
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (request.status !== 'ACCEPTED') {
      return res
        .status(400)
        .json({ success: false, message: 'Payment details are available once the quote is accepted' });
    }
    if (!request.vendorId) {
      return res.status(400).json({ success: false, message: 'No operator assigned' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: request.vendorId },
      select: {
        id: true,
        businessName: true,
        businessLogo: true,
        contactEmail: true,
        contactPhone: true,
        bankMvrName: true,
        bankMvrHolder: true,
        bankMvrAccount: true,
        bankUsdName: true,
        bankUsdHolder: true,
        bankUsdAccount: true,
      },
    });

    // MVR and USD are strictly independent - only ever expose the account
    // matching the quoted currency.
    const currency = (request.quotedCurrency || 'MVR').toUpperCase();
    const bank =
      currency === 'USD'
        ? {
            currency: 'USD',
            bankName: vendor?.bankUsdName || null,
            accountName: vendor?.bankUsdHolder || null,
            accountNumber: vendor?.bankUsdAccount || null,
          }
        : {
            currency: 'MVR',
            bankName: vendor?.bankMvrName || null,
            accountName: vendor?.bankMvrHolder || null,
            accountNumber: vendor?.bankMvrAccount || null,
          };

    return res.json({
      success: true,
      data: {
        request,
        operator: vendor
          ? {
              id: vendor.id,
              businessName: vendor.businessName,
              businessLogo: vendor.businessLogo,
              contactEmail: vendor.contactEmail,
              contactPhone: vendor.contactPhone,
            }
          : null,
        bank,
        reference: `CH-${String(request.id).slice(0, 8).toUpperCase()}`,
        // MVR is bank transfer only. Card (Stripe) for USD is not built yet.
        cardPaymentAvailable: false,
      },
    });
  } catch (error) {
    console.error('getPaymentInfo charter error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /charter-requests/:id/mark-paid
// Customer declares they have made the bank transfer; operator verifies.
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.charterRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (request.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Request is not accepted yet' });
    }

    const updated = await prisma.charterRequest.update({
      where: { id },
      data: { paymentMethod: 'BANK_TRANSFER' },
    });

    if (updated.vendorId) {
      const vendorUserId = await getVendorUserId(prisma, updated.vendorId);
      if (vendorUserId) {
        await notify(prisma, {
          userId: vendorUserId,
          type: 'PAYMENT_RECEIVED',
          title: `Payment declared: ${routeLabel(updated)}`,
          body: `Customer says they transferred ${updated.quotedCurrency || 'MVR'} ${Number(
            updated.quotedPrice || 0
          ).toLocaleString()} (ref CH-${String(updated.id).slice(0, 8).toUpperCase()}). Please verify.`,
          link: '/admin/charter-requests',
          entityType: 'CHARTER_REQUEST',
          entityId: updated.id,
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('markPaid charter error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /charter-requests/:id
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.charterRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    if (req.user.role === 'VENDOR') {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor || (request.vendorId && request.vendorId !== vendor.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    await prisma.charterRequest.delete({ where: { id } });
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /charter-requests/all (ADMIN ONLY) - platform-wide oversight
const getAllRequests = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const { status, vendorId, currency, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (currency) where.quotedCurrency = currency;
    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    const requests = await prisma.charterRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, businessName: true } },
        vessel: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getAllRequests charter error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /charter-requests/instant
 *
 * Books a private charter at the operator's published price. The price is
 * recomputed here from the vessel's rate table — never taken from the request
 * body, or the customer would be naming their own fare.
 *
 * Creates an ACCEPTED request rather than a separate booking type, so instant
 * bookings land in the operator's existing Charter Requests screen alongside
 * everything else.
 */
const createInstantBooking = async (req, res) => {
  try {
    const body = req.body || {};
    const { vesselId, origin, destination, tripDate } = body;

    if (!vesselId || !origin || !destination || !tripDate) {
      return res.status(400).json({
        success: false,
        message: 'Vessel, route and trip date are required',
      });
    }

    const passengers = parseInt(body.passengers, 10) || 1;

    const vessel = await prisma.vehicle.findUnique({
      where: { id: vesselId },
      select: {
        id: true,
        userId: true,
        totalSeats: true,
        serviceTypes: true,
        charterPricingMode: true,
        charterInstantBooking: true,
        vehicleStatus: true,
        charterRates: true,
      },
    });

    if (!vessel) {
      return res.status(404).json({ success: false, message: 'Vessel not found' });
    }

    const offersCharter =
      Array.isArray(vessel.serviceTypes) &&
      vessel.serviceTypes.includes('PRIVATE_CHARTER');
    if (!offersCharter || !['AVAILABLE', 'BOOKED'].includes(vessel.vehicleStatus)) {
      return res.status(400).json({
        success: false,
        message: 'This vessel is not available for private charter',
      });
    }

    if (vessel.totalSeats < passengers) {
      return res.status(400).json({
        success: false,
        message: `This vessel takes up to ${vessel.totalSeats} passengers`,
      });
    }

    const rate = vessel.charterRates.find(
      (r) => r.fromIsland === origin && r.toIsland === destination
    );
    const priced =
      vessel.charterPricingMode === 'LIVE' &&
      rate &&
      !rate.quoteOnly &&
      (rate.priceMvr != null || rate.priceUsd != null);

    if (!priced) {
      return res.status(400).json({
        success: false,
        message: 'This trip has no published price. Please request a quote instead.',
      });
    }

    // Honour the requested currency only if the operator actually published it.
    const wanted = String(body.currency || '').toUpperCase();
    let currency = null;
    if (wanted === 'MVR' && rate.priceMvr != null) currency = 'MVR';
    else if (wanted === 'USD' && rate.priceUsd != null) currency = 'USD';
    else currency = rate.priceMvr != null ? 'MVR' : 'USD';

    const price = currency === 'MVR' ? rate.priceMvr : rate.priceUsd;

    const vendor = vessel.userId
      ? await prisma.vendor.findUnique({
          where: { userId: vessel.userId },
          select: { id: true },
        })
      : null;

    const created = await prisma.charterRequest.create({
      data: {
        userId: req.user.id,
        vendorId: vendor?.id || null,
        vesselId: vessel.id,
        origin,
        destination,
        tripDate: new Date(tripDate),
        departureTime: body.departureTime
          ? new Date(`1970-01-01T${body.departureTime}`)
          : null,
        passengers,
        guestName: body.guestName || null,
        guestEmail: body.guestEmail || null,
        guestPhone: body.guestPhone || null,
        specialRequirements: body.specialRequirements || null,
        // The customer accepted a published price, so this is agreed, not pending.
        status: 'ACCEPTED',
        quotedPrice: price,
        quotedCurrency: currency,
        quotedAt: new Date(),
        paymentMethod: body.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH',
        paymentType: 'FULL',
        isManual: false,
      },
    });

    if (vendor?.id) {
      const vendorUserId = await getVendorUserId(prisma, vendor.id);
      if (vendorUserId) {
        await notify(prisma, {
          userId: vendorUserId,
          type: 'REQUEST_RECEIVED',
          title: `Charter booked: ${routeLabel(created)}`,
          body: `${created.passengers} passenger(s) on ${new Date(created.tripDate)
            .toISOString()
            .slice(0, 10)} at your published price. No quote needed.`,
          link: '/admin/charter-requests',
          entityType: 'CHARTER_REQUEST',
          entityId: created.id,
        });
      }
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('createInstantBooking error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyRequests,
  getRequestsIRequested,
  getRequestById,
  createRequest,
  createInstantBooking,
  sendQuote,
  updateRequest,
  deleteRequest,
  getAllRequests,
  getPaymentInfo,
  markPaid,
};
