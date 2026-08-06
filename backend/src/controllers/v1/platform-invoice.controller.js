const { PrismaClient } = require('@prisma/client');
const { notify } = require('../../utils/notify');

const prisma = new PrismaClient();

/**
 * What operators owe Myboat.
 *
 * Logistics is collected by the operator directly, so Myboat's share arrives in
 * their account and has to be invoiced back. An administrator sees every
 * invoice and marks them received; an operator sees only their own, and cannot
 * mark anything — a debtor confirming their own payment is not a record of
 * anything.
 *
 * Totals are per currency and never summed across them. MVR and USD are settled
 * into different bank accounts, so a combined figure would be meaningless.
 */

const INVOICE_INCLUDE = {
  vendor: { select: { id: true, businessName: true, contactEmail: true, contactPhone: true } },
  markedBy: { select: { id: true, firstName: true, lastName: true } },
};

/** Per-currency totals, split by whether the money has arrived. */
const summarise = (invoices) => {
  const acc = {};
  invoices.forEach((i) => {
    const cur = i.currency || 'MVR';
    acc[cur] = acc[cur] || { currency: cur, outstanding: 0, received: 0, count: 0 };
    const amount = Number(i.amount) || 0;
    if (i.status === 'PAID') acc[cur].received += amount;
    else acc[cur].outstanding += amount;
    acc[cur].count += 1;
  });
  return Object.values(acc).map((r) => ({
    ...r,
    outstanding: Math.round(r.outstanding * 100) / 100,
    received: Math.round(r.received * 100) / 100,
  }));
};

/**
 * The order behind an invoice, fetched separately because request_id points at
 * whichever table request_type names — a relation cannot span both.
 */
const attachOrders = async (invoices) => {
  const logisticsIds = invoices
    .filter((i) => i.requestType === 'LOGISTICS')
    .map((i) => i.requestId);
  const charterIds = invoices
    .filter((i) => i.requestType === 'CHARTER')
    .map((i) => i.requestId);

  const [logistics, charter] = await Promise.all([
    logisticsIds.length
      ? prisma.logisticsRequest.findMany({
          where: { id: { in: logisticsIds } },
          select: {
            id: true,
            origin: true,
            destination: true,
            tripDate: true,
            cargoType: true,
            status: true,
          },
        })
      : [],
    charterIds.length
      ? prisma.charterRequest.findMany({
          where: { id: { in: charterIds } },
          select: { id: true, origin: true, destination: true, tripDate: true, status: true },
        })
      : [],
  ]);

  const byId = new Map([...logistics, ...charter].map((r) => [r.id, r]));
  return invoices.map((i) => ({ ...i, order: byId.get(i.requestId) || null }));
};

// GET /platform-invoices
const listInvoices = async (req, res) => {
  try {
    const { status, currency, vendorId } = req.query;
    const where = {};
    if (status) where.status = String(status).toUpperCase();
    if (currency) where.currency = String(currency).toUpperCase();

    if (req.user.role === 'ADMIN') {
      if (vendorId) where.vendorId = vendorId;
    } else if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });
      if (!vendor) {
        return res.status(400).json({ success: false, message: 'Vendor profile not found' });
      }
      where.vendorId = vendor.id;
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const invoices = await prisma.platformInvoice.findMany({
      where,
      include: INVOICE_INCLUDE,
      orderBy: [{ status: 'asc' }, { issuedAt: 'desc' }],
    });

    return res.json({
      success: true,
      message: 'Invoices retrieved',
      data: {
        invoices: await attachOrders(invoices),
        totals: summarise(invoices),
      },
    });
  } catch (error) {
    console.error('listInvoices error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /platform-invoices/:id/mark-received — administrators only
const markReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.platformInvoice.findUnique({ where: { id } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // Already settled is the same end state; say so rather than moving the date.
    if (invoice.status === 'PAID') {
      return res.json({ success: true, message: 'Already marked received', data: invoice });
    }

    const updated = await prisma.platformInvoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        markedById: req.user.id,
        notes: typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 500) : invoice.notes,
      },
      include: INVOICE_INCLUDE,
    });

    const vendor = await prisma.vendor.findUnique({
      where: { id: updated.vendorId },
      select: { userId: true },
    });
    if (vendor?.userId) {
      await notify(prisma, {
        userId: vendor.userId,
        type: 'PAYMENT_RECEIVED',
        title: `Invoice ${updated.invoiceNumber} settled`,
        body: `Myboat has received ${updated.currency} ${Number(
          updated.amount
        ).toLocaleString()}. Nothing further is due on this order.`,
        link: '/admin/platform-invoices',
        entityType: 'PLATFORM_INVOICE',
        entityId: updated.id,
      });
    }

    return res.json({ success: true, message: 'Marked received', data: updated });
  } catch (error) {
    console.error('markReceived error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listInvoices, markReceived };
