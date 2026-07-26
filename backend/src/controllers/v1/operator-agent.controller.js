const { z } = require('zod');
const prisma = require('../../lib/prisma');

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

module.exports = {
  getMyAgents,
  inviteAgent,
  updateAgent,
  deleteAgent,
  getAllAgents,
};
