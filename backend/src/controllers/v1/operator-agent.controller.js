const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { notify } = require('../../utils/notify');
const { resolveAgentTerms, applyAgentTerms } = require('../../utils/agent-pricing');

/**
 * Agent partnerships.
 *
 * Payouts are settled directly between an operator and their guesthouse
 * partners — the platform records the agreed commission and discount, and
 * deliberately holds no payout ledger or balance of its own.
 *
 * Admin's only levers here are the ceilings on what an operator may grant, and
 * suspending an agent outright.
 */

const CEILING_KEYS = {
  commission: 'AGENT_MAX_COMMISSION_PERCENT',
  discount: 'AGENT_MAX_DISCOUNT_PERCENT',
};

/**
 * Ceilings an operator may not exceed when granting terms.
 * Falls back to 25 if the setting is missing or unreadable, so a deleted row
 * cannot silently remove the cap.
 */
const loadCeilings = async () => {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: Object.values(CEILING_KEYS) } },
    select: { keyName: true, value: true },
  });
  const read = (key) => {
    const raw = rows.find((r) => r.keyName === key)?.value;
    const n = Number(raw);
    return raw !== undefined && raw !== null && String(raw).trim() !== '' && Number.isFinite(n)
      ? n
      : 25;
  };
  return {
    maxCommission: read(CEILING_KEYS.commission),
    maxDiscount: read(CEILING_KEYS.discount),
  };
};

/**
 * @returns {string|null} an error message when the terms breach a ceiling
 */
const checkCeilings = ({ commissionPercent, discountPercent }, ceilings) => {
  if (commissionPercent !== undefined && commissionPercent > ceilings.maxCommission) {
    return `Commission cannot exceed ${ceilings.maxCommission}% (platform limit)`;
  }
  if (discountPercent !== undefined && discountPercent > ceilings.maxDiscount) {
    return `Discount cannot exceed ${ceilings.maxDiscount}% (platform limit)`;
  }
  return null;
};

const inviteAgentSchema = z.object({
  email: z.string().email(),
  agentType: z.enum(['AGENT', 'GUESTHOUSE', 'HOTEL']).default('AGENT'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  commissionPercent: z.coerce.number().min(0).max(100).default(0),
});

const updateAgentSchema = z.object({
  agentType: z.enum(['AGENT', 'GUESTHOUSE', 'HOTEL']).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
});

// Helper: resolve current vendor row for the auth'd user
const resolveVendor = async (userId) => {
  return prisma.vendor.findFirst({ where: { userId } });
};

const agentInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      mobile: true,
    },
  },
};

// GET /operator-agents
const getMyAgents = async (req, res) => {
  try {
    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const { status } = req.query;
    const where = { vendorId: vendor.id };
    if (status) where.status = status;

    const agents = await prisma.operatorAgent.findMany({
      where,
      include: agentInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      message: 'Agents retrieved successfully',
      data: agents,
    });
  } catch (error) {
    console.error('getMyAgents error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving agents',
    });
  }
};

// POST /operator-agents
const inviteAgent = async (req, res) => {
  try {
    const data = inviteAgentSchema.parse(req.body);

    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Ask them to register first.',
      });
    }

    try {
      const agent = await prisma.operatorAgent.create({
        data: {
          vendorId: vendor.id,
          userId: user.id,
          agentType: data.agentType,
          discountPercent: data.discountPercent,
          commissionPercent: data.commissionPercent,
          status: 'PENDING',
        },
        include: agentInclude,
      });

      return res.status(201).json({
        success: true,
        message: 'Agent invited successfully',
        data: agent,
      });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Agent already invited',
        });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('inviteAgent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error inviting agent',
    });
  }
};

// PATCH /operator-agents/:id
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateAgentSchema.parse(req.body);

    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const existing = await prisma.operatorAgent.findUnique({ where: { id } });
    if (!existing || existing.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Same ceilings as approval — otherwise an operator could approve within
    // the cap and immediately edit past it.
    const breach = checkCeilings(data, await loadCeilings());
    if (breach) {
      return res.status(400).json({ success: false, message: breach });
    }

    const agent = await prisma.operatorAgent.update({
      where: { id },
      data,
      include: agentInclude,
    });

    return res.json({
      success: true,
      message: 'Agent updated successfully',
      data: agent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('updateAgent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating agent',
    });
  }
};

// DELETE /operator-agents/:id
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const existing = await prisma.operatorAgent.findUnique({ where: { id } });
    if (!existing || existing.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    await prisma.operatorAgent.delete({ where: { id } });
    return res.json({ success: true, message: 'Agent removed' });
  } catch (error) {
    console.error('deleteAgent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error removing agent',
    });
  }
};

// GET /operator-agents/all - admin oversight (all agents across all operators)
const getAllAgents = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const { status, vendorId, agentType } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (agentType) where.agentType = agentType;

    const agents = await prisma.operatorAgent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, businessName: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
      },
    });
    return res.json({ success: true, data: agents });
  } catch (error) {
    console.error('getAllAgents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/*  Agent-initiated partnership requests                                       */
/* -------------------------------------------------------------------------- */

const applySchema = z.object({
  operatorId: z.string().min(1, 'Operator is required'),
  agentType: z.enum(['AGENT', 'GUESTHOUSE', 'HOTEL']).default('GUESTHOUSE'),
});

// POST /operator-agents/apply - an AGENT applies to work with an operator.
// Terms are deliberately not accepted here: the operator sets them on approval.
const applyToOperator = async (req, res) => {
  try {
    const data = applySchema.parse(req.body);

    const vendor = await prisma.vendor.findUnique({
      where: { id: data.operatorId },
      select: { id: true, businessName: true, userId: true, status: true },
    });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }
    if (vendor.status !== 'ACTIVE') {
      return res
        .status(400)
        .json({ success: false, message: 'This operator is not accepting partners right now' });
    }

    const existing = await prisma.operatorAgent.findUnique({
      where: { vendorId_userId: { vendorId: vendor.id, userId: req.user.id } },
    });
    if (existing) {
      // Re-applying after a rejection is reasonable; duplicating a live
      // partnership is not.
      if (existing.status === 'REJECTED') {
        const reopened = await prisma.operatorAgent.update({
          where: { id: existing.id },
          data: { status: 'PENDING', agentType: data.agentType },
          include: agentInclude,
        });
        return res.json({ success: true, message: 'Application resubmitted', data: reopened });
      }
      return res.status(409).json({
        success: false,
        message: 'You already have a ' + String(existing.status).toLowerCase() +
                 ' partnership with this operator',
      });
    }

    const created = await prisma.operatorAgent.create({
      data: {
        vendorId: vendor.id,
        userId: req.user.id,
        agentType: data.agentType,
        status: 'PENDING',
        // Terms stay at zero until the operator approves and sets them.
        commissionPercent: 0,
        discountPercent: 0,
      },
      include: agentInclude,
    });

    if (vendor.userId) {
      const name =
        [req.user.firstName, req.user.lastName].filter(Boolean).join(' ') || req.user.email;
      await notify(prisma, {
        userId: vendor.userId,
        type: 'REQUEST_RECEIVED',
        title: 'Partnership request from ' + name,
        body: 'Approve it to set their commission and discount.',
        link: '/admin/agents',
        entityType: 'OPERATOR_AGENT',
        entityId: created.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Partnership request sent',
      data: created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error('applyToOperator error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error applying' });
  }
};

// GET /operator-agents/my-partnerships - the agent's own applications
const getMyPartnerships = async (req, res) => {
  try {
    const rows = await prisma.operatorAgent.findMany({
      where: { userId: req.user.id },
      include: {
        vendor: {
          select: { id: true, businessName: true, businessLogo: true, baseIsland: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, message: 'Partnerships retrieved', data: rows });
  } catch (error) {
    console.error('getMyPartnerships error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving partnerships' });
  }
};

/* -------------------------------------------------------------------------- */
/*  Operator approval                                                          */
/* -------------------------------------------------------------------------- */

const approveSchema = z.object({
  commissionPercent: z.coerce.number().min(0).max(100),
  discountPercent: z.coerce.number().min(0).max(100),
});

// GET /operator-agents/requests - this operator's pending applications
const getPendingRequests = async (req, res) => {
  try {
    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }
    const rows = await prisma.operatorAgent.findMany({
      where: { vendorId: vendor.id, status: 'PENDING' },
      include: agentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return res.json({
      success: true,
      message: 'Pending partnership requests retrieved',
      data: rows,
      // The UI needs the caps to bound its inputs.
      meta: await loadCeilings(),
    });
  } catch (error) {
    console.error('getPendingRequests error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving requests' });
  }
};

// POST /operator-agents/:id/approve - operator sets the terms and activates
const approveAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = approveSchema.parse(req.body);

    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const existing = await prisma.operatorAgent.findUnique({
      where: { id },
      include: { user: { select: { id: true, active: true } } },
    });
    if (!existing || existing.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: 'Partnership request not found' });
    }
    // An operator must not be able to reactivate someone Myboat has frozen.
    if (existing.status === 'SUSPENDED' || existing.user?.active === false) {
      return res.status(400).json({
        success: false,
        message: 'This agent is suspended by Myboat and cannot be approved',
      });
    }

    const breach = checkCeilings(data, await loadCeilings());
    if (breach) {
      return res.status(400).json({ success: false, message: breach });
    }

    const agent = await prisma.operatorAgent.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        commissionPercent: data.commissionPercent,
        discountPercent: data.discountPercent,
      },
      include: agentInclude,
    });

    await notify(prisma, {
      userId: existing.userId,
      type: 'GENERAL',
      title: (vendor.businessName || 'An operator') + ' approved your partnership',
      body:
        'You earn ' + data.commissionPercent + '% commission, with ' +
        data.discountPercent + '% off their fares.',
      link: '/users/my-requests',
      entityType: 'OPERATOR_AGENT',
      entityId: agent.id,
    });

    return res.json({ success: true, message: 'Partnership approved', data: agent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error('approveAgent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error approving' });
  }
};

// POST /operator-agents/:id/reject
const rejectAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }
    const existing = await prisma.operatorAgent.findUnique({ where: { id } });
    if (!existing || existing.vendorId !== vendor.id) {
      return res.status(404).json({ success: false, message: 'Partnership request not found' });
    }
    const agent = await prisma.operatorAgent.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: agentInclude,
    });
    return res.json({ success: true, message: 'Partnership rejected', data: agent });
  } catch (error) {
    console.error('rejectAgent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error rejecting' });
  }
};

/* -------------------------------------------------------------------------- */
/*  Admin safeguards                                                           */
/* -------------------------------------------------------------------------- */

// POST /operator-agents/admin/:userId/suspend - platform-wide freeze.
// Deactivates the account so auth rejects it everywhere, and marks every
// partnership SUSPENDED so operators can see why their partner went quiet.
const suspendAgentGlobally = async (req, res) => {
  try {
    const { userId } = req.params;
    const reason = String(req.body?.reason || '').slice(0, 300) || null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, active: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [, partnerships] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { active: false } }),
      prisma.operatorAgent.updateMany({ where: { userId }, data: { status: 'SUSPENDED' } }),
    ]);

    await notify(prisma, {
      userId,
      type: 'GENERAL',
      title: 'Your account has been suspended',
      body: reason || 'Contact Myboat support for details.',
    });

    return res.json({
      success: true,
      message: 'Agent suspended platform-wide',
      data: {
        userId,
        email: user.email,
        active: false,
        partnershipsSuspended: partnerships.count,
      },
    });
  } catch (error) {
    console.error('suspendAgentGlobally error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error suspending' });
  }
};

// POST /operator-agents/admin/:userId/reinstate - undo a freeze.
// Partnerships return to PENDING rather than ACTIVE: whether to take the agent
// back is the operator's call, not the platform's.
const reinstateAgentGlobally = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [, partnerships] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { active: true } }),
      prisma.operatorAgent.updateMany({
        where: { userId, status: 'SUSPENDED' },
        data: { status: 'PENDING' },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Agent reinstated',
      data: {
        userId,
        email: user.email,
        active: true,
        partnershipsReturnedToPending: partnerships.count,
      },
    });
  } catch (error) {
    console.error('reinstateAgentGlobally error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error reinstating' });
  }
};

// GET /operator-agents/terms?vendorId=<User.id>&amount=<gross>
// What this agent's net price would be with this operator. Uses the same
// resolver the booking endpoint uses, so the quoted figure and the charged
// figure cannot drift apart.
const getMyTermsForOperator = async (req, res) => {
  try {
    const { vendorId } = req.query;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }
    const terms = await resolveAgentTerms(prisma, { actor: req.user, vendorId });
    const gross = Number(req.query.amount);
    const money = Number.isFinite(gross) ? applyAgentTerms(gross, terms) : null;

    return res.json({
      success: true,
      message: 'Agent terms retrieved',
      data: {
        hasPartnership: !!terms.agentId,
        discountPercent: terms.discountPercent,
        commissionPercent: terms.commissionPercent,
        ...(money || {}),
      },
    });
  } catch (error) {
    console.error('getMyTermsForOperator error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving terms' });
  }
};

module.exports = {
  getMyAgents,
  inviteAgent,
  updateAgent,
  deleteAgent,
  getAllAgents,
  applyToOperator,
  getMyPartnerships,
  getMyTermsForOperator,
  getPendingRequests,
  approveAgent,
  rejectAgent,
  suspendAgentGlobally,
  reinstateAgentGlobally,
};
