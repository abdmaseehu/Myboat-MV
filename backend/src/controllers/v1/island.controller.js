const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const ISLAND_TYPES = ['INHABITED', 'RESORT', 'AIRPORT', 'INDUSTRIAL'];

// Validation schemas
const islandSchema = z.object({
  name: z.string().min(1, 'Island name is required'),
  atollCode: z.string().min(1, 'Atoll code is required'),
  atollName: z.string().min(1, 'Atoll name is required'),
  type: z.enum(ISLAND_TYPES).optional().default('INHABITED'),
  label: z.string().min(1).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const islandUpdateSchema = islandSchema.partial();

// Build "Maafushi (Kaafu)" when the client doesn't send an explicit label
const buildLabel = (name, atollName) => `${name} (${atollName})`;

// Get all islands (public) - supports search / type / atollCode / limit
const getIslands = async (req, res) => {
  try {
    const { search, type, atollCode, limit = 500, includeInactive } = req.query;

    const where = {};

    // Only active islands by default
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && ISLAND_TYPES.includes(type)) {
      where.type = type;
    }

    if (atollCode) {
      where.atollCode = atollCode;
    }

    const parsedLimit = parseInt(limit, 10);
    const take = Number.isNaN(parsedLimit) ? 500 : Math.min(parsedLimit, 1000);

    const islands = await prisma.island.findMany({
      where,
      take,
      orderBy: [{ atollName: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      message: 'Islands retrieved successfully',
      data: { islands },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving islands',
    });
  }
};

// Get distinct atolls with island counts (public)
const getAtolls = async (req, res) => {
  try {
    const grouped = await prisma.island.groupBy({
      by: ['atollCode', 'atollName'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { atollName: 'asc' },
    });

    const atolls = grouped.map((group) => ({
      atollCode: group.atollCode,
      atollName: group.atollName,
      count: group._count._all,
    }));

    res.json({
      success: true,
      message: 'Atolls retrieved successfully',
      data: { atolls },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving atolls',
    });
  }
};

// Create island (ADMIN)
const createIsland = async (req, res) => {
  try {
    const data = islandSchema.parse(req.body);

    const island = await prisma.island.create({
      data: {
        ...data,
        label: data.label || buildLabel(data.name, data.atollName),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Island created successfully',
      data: { island },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    // Unique constraint on [name, atollCode]
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'An island with this name already exists in that atoll',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating island',
    });
  }
};

// Update island (ADMIN)
const updateIsland = async (req, res) => {
  try {
    const { id } = req.params;
    const data = islandUpdateSchema.parse(req.body);

    const existing = await prisma.island.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Island not found',
      });
    }

    // Keep the label in sync when name/atoll changes and no explicit label given
    const name = data.name ?? existing.name;
    const atollName = data.atollName ?? existing.atollName;
    const label =
      data.label ||
      (data.name || data.atollName ? buildLabel(name, atollName) : existing.label);

    const island = await prisma.island.update({
      where: { id },
      data: { ...data, label },
    });

    res.json({
      success: true,
      message: 'Island updated successfully',
      data: { island },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'An island with this name already exists in that atoll',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating island',
    });
  }
};

// Delete island (ADMIN)
const deleteIsland = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.island.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Island not found',
      });
    }

    await prisma.island.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Island deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting island',
    });
  }
};

module.exports = {
  getIslands,
  getAtolls,
  createIsland,
  updateIsland,
  deleteIsland,
};
