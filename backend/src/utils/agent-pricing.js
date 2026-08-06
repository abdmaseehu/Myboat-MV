/**
 * Agent net-billing terms, resolved from the database.
 *
 * Never take a discount or commission from the request body. The client sends
 * who is booking and what they are booking; the percentages come from the
 * operator_agents row for that exact (operator, agent) pair, and only when the
 * partnership is ACTIVE and the agent's account is live.
 *
 * Discount reduces the invoice — the agent is billed the net price.
 * Commission does not: it is recorded for the operator to settle with the agent
 * directly, since the platform holds no payout ledger.
 */

const ZERO = { agentId: null, discountPercent: 0, commissionPercent: 0 };

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object}  opts
 * @param {object}  opts.actor            the authenticated user
 * @param {string}  opts.vendorId         Booking.vendorId — this references User.id
 * @param {string} [opts.requestedAgentId] operator_agents.id, only honoured for operators
 * @returns {Promise<{agentId: string|null, discountPercent: number, commissionPercent: number}>}
 */
async function resolveAgentTerms(prisma, { actor, vendorId, requestedAgentId } = {}) {
  if (!actor || !vendorId) return { ...ZERO };

  // Booking.vendorId references User.id, so resolve the Vendor row from it.
  const vendor = await prisma.vendor.findUnique({
    where: { userId: vendorId },
    select: { id: true },
  });
  if (!vendor) return { ...ZERO };

  let partnership = null;

  if (actor.role === 'VENDOR' && requestedAgentId) {
    // An operator booking on an agent's behalf may name the partnership, but it
    // still has to be their own.
    partnership = await prisma.operatorAgent.findFirst({
      where: { id: requestedAgentId, vendorId: vendor.id },
      include: { user: { select: { active: true } } },
    });
  } else if (actor.role === 'AGENT') {
    // A booking made by an agent uses their own partnership with this operator.
    partnership = await prisma.operatorAgent.findUnique({
      where: { vendorId_userId: { vendorId: vendor.id, userId: actor.id } },
      include: { user: { select: { active: true } } },
    });
  }

  if (!partnership) return { ...ZERO };
  // Suspended by the operator or frozen by Myboat: terms no longer apply.
  if (partnership.status !== 'ACTIVE') return { ...ZERO };
  if (partnership.user?.active === false) return { ...ZERO };

  return {
    agentId: partnership.id,
    discountPercent: Number(partnership.discountPercent) || 0,
    commissionPercent: Number(partnership.commissionPercent) || 0,
  };
}

/** Round to 2dp without floating-point drift creeping into an invoice. */
const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Apply resolved terms to a gross amount.
 *
 * @returns {{discountAmount: number, finalAmount: number, commissionAmount: number}}
 */
function applyAgentTerms(grossAmount, terms) {
  const gross = Number(grossAmount) || 0;
  const discountAmount = money((gross * (terms.discountPercent || 0)) / 100);
  const finalAmount = money(Math.max(0, gross - discountAmount));
  // Commission is earned on what the customer actually pays.
  const commissionAmount = money((finalAmount * (terms.commissionPercent || 0)) / 100);
  return { discountAmount, finalAmount, commissionAmount };
}

module.exports = { resolveAgentTerms, applyAgentTerms };
