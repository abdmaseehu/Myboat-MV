/**
 * Invoices for what an operator owes Myboat.
 *
 * Ferry money passes through the platform, so the cut is taken as it goes by.
 * Logistics does not: the customer transfers to the operator's own account, so
 * Myboat's share — the markup the customer paid, plus the commission out of the
 * operator's quote — arrives in the operator's hands and has to be invoiced
 * back.
 *
 * An invoice is raised when the order completes, not when it is quoted or paid.
 * A quote can be revised, and a payment can fail; a completed order is the
 * first point at which the debt is real.
 */
const { notify } = require('./notify');

const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Stable and human-readable: the same order always yields the same number. */
const invoiceNumberFor = (requestType, requestId) =>
  `INV-${requestType === 'LOGISTICS' ? 'LG' : 'CH'}-${String(requestId).slice(0, 8).toUpperCase()}`;

/**
 * Raise the invoice for a completed order, if one is owed.
 *
 * Returns null when there is nothing to bill — no operator (Myboat sourced the
 * boat itself, so it owes itself nothing) or a zero cut. Idempotent: the unique
 * index on (requestType, requestId) means completing an order twice cannot
 * bill it twice.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} o
 * @param {'LOGISTICS'|'CHARTER'} o.requestType
 * @param {object} o.request  the completed request row
 */
async function raiseInvoiceForOrder(prisma, { requestType, request }) {
  if (!request?.vendorId) return null;

  const amount = money(request.platformCutAmount || 0);
  if (amount <= 0) return null;

  const invoiceNumber = invoiceNumberFor(requestType, request.id);

  const existing = await prisma.platformInvoice.findUnique({
    where: { requestType_requestId: { requestType, requestId: request.id } },
  });
  if (existing) return existing;

  // The split is recorded as it stood when the order completed. Changing the
  // rate later must not silently reprice a debt already issued.
  const commission = money(request.vendorQuotedPrice ? Number(request.vendorQuotedPrice) - Number(request.vendorNetAmount || 0) : 0);
  const markup = money(Math.max(0, amount - commission));

  let invoice;
  try {
    invoice = await prisma.platformInvoice.create({
      data: {
        invoiceNumber,
        vendorId: request.vendorId,
        requestType,
        requestId: request.id,
        amount,
        currency: (request.quotedCurrency || 'MVR').toUpperCase(),
        markupAmount: markup,
        commissionAmount: commission,
        orderTotal: request.quotedPrice ? money(request.quotedPrice) : null,
        status: 'PENDING',
      },
    });
  } catch (e) {
    // Two completions racing: the loser reads the winner's row.
    if (e.code === 'P2002') {
      return prisma.platformInvoice.findUnique({
        where: { requestType_requestId: { requestType, requestId: request.id } },
      });
    }
    throw e;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: request.vendorId },
    select: { userId: true },
  });
  if (vendor?.userId) {
    await notify(prisma, {
      userId: vendor.userId,
      type: 'GENERAL',
      title: `Invoice ${invoice.invoiceNumber} — ${invoice.currency} ${amount.toLocaleString()}`,
      body: `Myboat's share of ${request.origin} → ${request.destination}. Payable to Myboat; see Finance → Myboat Invoices.`,
      link: '/admin/platform-invoices',
      entityType: 'PLATFORM_INVOICE',
      entityId: invoice.id,
    });
  }

  return invoice;
}

module.exports = { raiseInvoiceForOrder, invoiceNumberFor };
