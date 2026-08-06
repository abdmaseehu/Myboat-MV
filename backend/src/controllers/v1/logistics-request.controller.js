const { PrismaClient } = require('@prisma/client');
const { notify, getVendorUserId, notifyAdmins } = require('../../utils/notify');
const { redactForViewer, redactListForViewer } = require('../../utils/redact');
const { getPlatformPaymentDetails } = require('../../utils/platform-bank');
const { loadLogisticsConfig, applyLogisticsPricing } = require('../../utils/fare-engine');
const { raiseInvoiceForOrder } = require('../../utils/platform-invoice');
const { signedUrl, removeObject } = require('../../utils/storage');
const prisma = new PrismaClient();

const getVendorForUser = async (userId) => {
  return prisma.vendor.findUnique({ where: { userId } });
};

/**
 * Price an operator's logistics quote, and record how it divides.
 *
 * The customer pays the operator's figure plus Myboat's markup, straight into
 * the operator's own account. The commission comes out of the operator's share.
 * Neither is deducted anywhere at the time — the operator holds the whole
 * amount, so `platformCutAmount` is what they will owe once the order is done.
 *
 * A quote Myboat sends itself, on the admin-direct requests where there is no
 * operator to source from, is final: there is nobody to invoice.
 */
const priceLogistics = async (operatorAmount, currency, { platformIsOperator = false } = {}) => {
  if (platformIsOperator) {
    const amount = Number(operatorAmount);
    return {
      quotedPrice: amount,
      vendorQuotedPrice: amount,
      platformCutAmount: 0,
      vendorNetAmount: amount,
      quotedCurrency: (currency || 'MVR').toUpperCase(),
    };
  }
  const cfg = await loadLogisticsConfig(prisma);
  const priced = applyLogisticsPricing(operatorAmount, currency, cfg);
  if (!priced) return null;
  return {
    quotedPrice: priced.publicPrice,
    vendorQuotedPrice: priced.operatorPrice,
    platformCutAmount: priced.platformCut,
    vendorNetAmount: priced.vendorNet,
    quotedCurrency: priced.currency,
  };
};

// Optional decimal coercion: '' / null / undefined -> null
const toDecimal = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
};

const routeLabel = (r) => `${r.origin} → ${r.destination}`;

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
      // vendorId: null is the broadcast pool; adminDirect requests are for
      // Myboat staff and must not appear there.
      where.OR = [
        { vendorId: vendor.id },
        { vendorId: null, adminDirect: false },
      ];
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
        vessel: { select: { id: true, vehicleName: true, vehicleNumber: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });

    return res.json({
      success: true,
      data: redactListForViewer(requests, req.user),
    });
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
        vessel: { select: { id: true, vehicleName: true, vehicleNumber: true } },
        vendor: {
          // Vendor has no `phone`/`email` columns - the operator's public
          // contact lives on contact*, with business* as the fallback.
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            businessMobile: true,
            businessEmail: true,
          },
        },
      },
    });
    return res.json({
      success: true,
      data: redactListForViewer(requests, req.user),
    });
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
        vessel: { select: { id: true, vehicleName: true, vehicleNumber: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    return res.json({
      success: true,
      data: redactForViewer(request, req.user),
    });
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
    // Aimed at Myboat staff: never attach an operator.
    if (!isOperator && body.adminDirect) vendorId = null;
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
      // Customer-settable: it only decides who sees the request.
      adminDirect: !isOperator && !!body.adminDirect,
      vesselId: body.vesselId || null,
      paymentMethod: body.paymentMethod || 'CASH',
      operatorNotes: body.operatorNotes || null,
    };

    // Only an operator may name a price on creation. A customer posting
    // quotedPrice would otherwise be setting their own fare.
    if (isOperator && body.quotedPrice) {
      Object.assign(
        data,
        await priceLogistics(body.quotedPrice, body.quotedCurrency || 'MVR')
      );
      data.quotedAt = new Date();
    }

    const created = await prisma.logisticsRequest.create({ data });

    // Direct request to Myboat: tell every admin, since there is no operator
    // to route it to.
    if (created.adminDirect) {
      await notifyAdmins(prisma, {
        type: 'REQUEST_RECEIVED',
        title: `Cargo boat request: ${routeLabel(created)}`,
        body: `${created.cargoType || 'Cargo'} on ${new Date(created.tripDate).toISOString().slice(0, 10)}. No operator selected - Myboat needs to source a boat.`,
        link: '/admin/direct-requests',
        entityType: 'LOGISTICS_REQUEST',
        entityId: created.id,
      });
    }

    // A customer targeting a specific operator -> tell that operator.
    if (!isOperator && vendorId) {
      const vendorUserId = await getVendorUserId(prisma, vendorId);
      if (vendorUserId) {
        await notify(prisma, {
          userId: vendorUserId,
          type: 'REQUEST_RECEIVED',
          title: `New logistics request: ${routeLabel(created)}`,
          body: `${created.cargoType || 'Cargo'} on ${new Date(created.tripDate)
            .toISOString()
            .slice(0, 10)}. Send a quote to win this booking.`,
          link: '/admin/logistics-requests',
          entityType: 'LOGISTICS_REQUEST',
          entityId: created.id,
        });
      }
    }

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
    const {
      quotedPrice,
      quotedCurrency = 'MVR',
      operatorNotes,
      vesselId,
      pricePerTon,
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

    const priced = await priceLogistics(quotedPrice, quotedCurrency, {
      platformIsOperator: req.user.role !== 'VENDOR',
    });

    const data = {
      ...priced,
      quotedAt: new Date(),
      status: 'QUOTED',
      operatorNotes: operatorNotes || request.operatorNotes,
      pricePerTon: toDecimal(pricePerTon),
      pricePerNm: toDecimal(pricePerNm),
      estimatedDistanceNm: toDecimal(estimatedDistanceNm),
      waitingCharges: waitingCharges || null,
      priceIncludes: priceIncludes || null,
      quoteNotes: quoteNotes || null,
      quoteValidUntil: quoteValidUntil ? new Date(quoteValidUntil) : null,
    };
    if (vesselId) data.vesselId = vesselId;

    const updated = await prisma.logisticsRequest.update({ where: { id }, data });

    // Notify the customer that a quote landed.
    if (updated.userId) {
      await notify(prisma, {
        userId: updated.userId,
        type: 'QUOTE_RECEIVED',
        title: `Quote received for ${routeLabel(updated)}`,
        // The public price, matching what they will see and pay.
        body: `${quotedCurrency} ${Number(priced.quotedPrice).toLocaleString()} — review and accept in My Requests.`,
        link: '/users/my-requests',
        entityType: 'LOGISTICS_REQUEST',
        entityId: updated.id,
      });
    }

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

    // The split between the operator's figure, Myboat's cut and the operator's
    // net is the server's to make. Accepting any of it from the body would let
    // a PATCH zero the cut and keep the whole fare.
    delete data.vendorQuotedPrice;
    delete data.platformCutAmount;
    delete data.vendorNetAmount;
    delete data.paymentSlip;
    delete data.paymentSlipUploadedAt;
    if (body.quotedPrice !== undefined && body.quotedPrice !== null && body.quotedPrice !== '') {
      Object.assign(
        data,
        await priceLogistics(
          body.quotedPrice,
          body.quotedCurrency || request.quotedCurrency || 'MVR',
          { platformIsOperator: req.user.role !== 'VENDOR' }
        )
      );
    }

    if (body.tripDate) data.tripDate = new Date(body.tripDate);

    const updated = await prisma.logisticsRequest.update({ where: { id }, data });

    // The order is done: the money the operator collected on Myboat's behalf
    // becomes a debt. Raised here rather than at quote time because a quote can
    // still be revised and a payment can still fail — completion is the first
    // point at which the amount is real. Idempotent, so re-completing an order
    // cannot bill it twice.
    if (data.status === 'COMPLETED' && request.status !== 'COMPLETED') {
      try {
        await raiseInvoiceForOrder(prisma, {
          requestType: 'LOGISTICS',
          request: updated,
        });
      } catch (e) {
        // An invoice that failed to raise must not undo the completion — the
        // order really did finish. Logged for the admin to pick up.
        console.error('raiseInvoiceForOrder failed for', updated.id, e.message);
      }
    }

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
              ).toLocaleString()} logistics quote.`
            : 'The customer declined your logistics quote.',
          link: '/admin/logistics-requests',
          entityType: 'LOGISTICS_REQUEST',
          entityId: updated.id,
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /logistics-requests/:id/payment-info
// Only the owning customer, only once ACCEPTED, only the matching currency.
const getPaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({
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
    // A request Myboat sourced itself has no operator: the customer pays the
    // platform, so fall back to Myboat's own accounts rather than dead-ending.
    if (!request.vendorId) {
      const platform = await getPlatformPaymentDetails(
        prisma,
        request.quotedCurrency || 'MVR'
      );
      return res.json({
        success: true,
        data: {
          request,
          operator: platform.operator,
          bank: platform.bank,
          bankConfigured: platform.configured,
          reference: `LG-${String(request.id).slice(0, 8).toUpperCase()}`,
          cardPaymentAvailable: false,
        },
      });
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
        reference: `LG-${String(request.id).slice(0, 8).toUpperCase()}`,
        cardPaymentAvailable: false,
      },
    });
  } catch (error) {
    console.error('getPaymentInfo logistics error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /logistics-requests/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (request.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Request is not accepted yet' });
    }

    const updated = await prisma.logisticsRequest.update({
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
          ).toLocaleString()} (ref LG-${String(updated.id).slice(0, 8).toUpperCase()}). Please verify.`,
          link: '/admin/logistics-requests',
          entityType: 'LOGISTICS_REQUEST',
          entityId: updated.id,
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('markPaid logistics error', error);
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
        vessel: { select: { id: true, vehicleName: true, vehicleNumber: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    return res.json({
      success: true,
      data: redactListForViewer(requests, req.user),
    });
  } catch (error) {
    console.error('getAllRequests logistics error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /logistics-requests/:id/submit-order  (multipart, field: slip)
 *
 * The customer transferred to the operator's own account, in a banking app we
 * can see nothing of. The slip is the only evidence the order was paid, so it
 * is what submitting an order means here — a bare "I've paid" button leaves the
 * operator with nothing to check against.
 */
const submitOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Please attach your transfer slip' });
    }

    const request = await prisma.logisticsRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (request.status !== 'ACCEPTED') {
      return res
        .status(400)
        .json({ success: false, message: 'Accept the quote before submitting payment' });
    }

    const updated = await prisma.logisticsRequest.update({
      where: { id },
      data: {
        paymentSlip: req.file.filename,
        paymentSlipUploadedAt: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        // The customer says they paid; the operator has yet to agree.
        paymentStatus: 'SUBMITTED',
      },
    });

    const reference = `LG-${String(updated.id).slice(0, 8).toUpperCase()}`;
    const amount = `${updated.quotedCurrency || 'MVR'} ${Number(
      updated.quotedPrice || 0
    ).toLocaleString()}`;

    if (updated.vendorId) {
      const vendorUserId = await getVendorUserId(prisma, updated.vendorId);
      if (vendorUserId) {
        await notify(prisma, {
          userId: vendorUserId,
          type: 'PAYMENT_RECEIVED',
          title: `Payment slip uploaded: ${routeLabel(updated)}`,
          body: `${amount} (ref ${reference}). Check it against your account, then mark the order complete.`,
          link: '/admin/logistics-requests',
          entityType: 'LOGISTICS_REQUEST',
          entityId: updated.id,
        });
      }
    } else {
      // Myboat sourced this one, so Myboat is the payee.
      await notifyAdmins(prisma, {
        type: 'PAYMENT_RECEIVED',
        title: `Payment slip uploaded: ${routeLabel(updated)}`,
        body: `${amount} (ref ${reference}) for a request Myboat is handling directly.`,
        link: '/admin/all-logistics-requests',
        entityType: 'LOGISTICS_REQUEST',
        entityId: updated.id,
      });
    }

    return res.json({ success: true, data: redactForViewer(updated, req.user) });
  } catch (error) {
    console.error('submitOrder logistics error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /logistics-requests/:id/slip
 *
 * A transfer slip shows the customer's bank account, so it is not served from
 * a public URL the way a vessel photo is. This mints a short-lived signed link
 * and hands it only to the customer who uploaded it, the operator who has to
 * check it, or an administrator.
 */
const getSlipUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.logisticsRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, vendorId: true, paymentSlip: true },
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (!request.paymentSlip) {
      return res.status(404).json({ success: false, message: 'No slip has been uploaded' });
    }

    let allowed = req.user.role === 'ADMIN' || request.userId === req.user.id;
    if (!allowed && req.user.role === 'VENDOR' && request.vendorId) {
      const vendor = await getVendorForUser(req.user.id);
      allowed = !!vendor && vendor.id === request.vendorId;
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const url = await signedUrl(request.paymentSlip);
    return res.json({ success: true, data: { url } });
  } catch (error) {
    console.error('getSlipUrl logistics error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitOrder,
  getSlipUrl,
  getMyRequests,
  getRequestsIRequested,
  getRequestById,
  createRequest,
  sendQuote,
  updateRequest,
  deleteRequest,
  getAllRequests,
  getPaymentInfo,
  markPaid,
};
