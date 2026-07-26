const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: get vendor for the authenticated user (VENDOR role)
const getVendorForUser = async (userId) => {
  return prisma.vendor.findUnique({ where: { userId } });
};

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
    let status = body.status || 'PENDING';

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

    if (body.quotedPrice) {
      data.quotedPrice = body.quotedPrice;
      data.quotedCurrency = body.quotedCurrency || 'MVR';
      data.quotedAt = new Date();
    }

    const created = await prisma.charterRequest.create({ data });

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
    const { quotedPrice, quotedCurrency = 'MVR', operatorNotes } = req.body;

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

    const updated = await prisma.charterRequest.update({
      where: { id },
      data: {
        quotedPrice,
        quotedCurrency,
        quotedAt: new Date(),
        status: 'QUOTED',
        operatorNotes: operatorNotes || request.operatorNotes,
      },
    });

    // TODO: notify customer of quote
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
    return res.json({ success: true, data: updated });
  } catch (error) {
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

module.exports = {
  getMyRequests,
  getRequestById,
  createRequest,
  sendQuote,
  updateRequest,
  deleteRequest,
  getAllRequests,
};
