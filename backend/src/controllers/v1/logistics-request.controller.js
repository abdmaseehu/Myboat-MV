const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getVendorForUser = async (userId) => {
  return prisma.vendor.findUnique({ where: { userId } });
};

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
            { cargoType: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const requests = await prisma.logisticsRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vessel: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });

    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getMyRequests logistics error', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// GET /logistics-requests/requested-by-me - customer's own submitted requests
const getRequestsIRequested = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const requests = await prisma.logisticsRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vessel: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true, phone: true, email: true } },
      },
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getRequestsIRequested logistics error', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({
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
      cargoType: body.cargoType || null,
      weightKg: body.weightKg ? String(body.weightKg) : null,
      volumeM3: body.volumeM3 ? String(body.volumeM3) : null,
      cargoDescription: body.cargoDescription || null,
      guestName: body.guestName || null,
      guestEmail: body.guestEmail || null,
      guestPhone: body.guestPhone || null,
      specialRequirements: body.specialRequirements || null,
      status,
      isManual,
      vesselId: body.vesselId || null,
      paymentMethod: body.paymentMethod || 'CASH',
      operatorNotes: body.operatorNotes || null,
    };

    if (body.quotedPrice) {
      data.quotedPrice = body.quotedPrice;
      data.quotedCurrency = body.quotedCurrency || 'MVR';
      data.quotedAt = new Date();
    }

    const created = await prisma.logisticsRequest.create({ data });

    // TODO: send confirmation email to guest + operator inbox
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('createRequest logistics error', error);
    return res
      .status(400)
      .json({ success: false, message: 'Failed to create request', error: error.message });
  }
};

const sendQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotedPrice, quotedCurrency = 'MVR', operatorNotes } = req.body;

    if (!quotedPrice) {
      return res.status(400).json({ success: false, message: 'quotedPrice required' });
    }

    const request = await prisma.logisticsRequest.findUnique({ where: { id } });
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
      if (!request.vendorId) {
        await prisma.logisticsRequest.update({
          where: { id },
          data: { vendorId: vendor.id },
        });
      }
    }

    const updated = await prisma.logisticsRequest.update({
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
    console.error('sendQuote logistics error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({ where: { id } });
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

    const updated = await prisma.logisticsRequest.update({ where: { id }, data });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    if (req.user.role === 'VENDOR') {
      const vendor = await getVendorForUser(req.user.id);
      if (!vendor || (request.vendorId && request.vendorId !== vendor.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    await prisma.logisticsRequest.delete({ where: { id } });
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /logistics-requests/all - admin oversight
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
        { cargoType: { contains: search, mode: 'insensitive' } },
      ];
    }
    const requests = await prisma.logisticsRequest.findMany({
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
    console.error('getAllRequests logistics error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyRequests,
  getRequestsIRequested,
  getRequestById,
  createRequest,
  sendQuote,
  updateRequest,
  deleteRequest,
  getAllRequests,
};
