const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const routeSchema = z.object({
  sourceCity: z.string().min(2, 'Departure location is required'),
  destinationCity: z.string().min(2, 'Destination location is required'),
  serviceType: z.enum(['SCHEDULED_FERRY', 'PRIVATE_CHARTER', 'LOGISTICS']).optional().default('SCHEDULED_FERRY'),
  distance: z.number().positive('Distance must be a positive number').optional(),
  durationMinutes: z.coerce.number().int().positive('Duration must be a positive number').optional(),
  isActive: z.boolean().optional().default(true),
  // Points are locations only - the schedule owns all timing.
  boardingPoints: z.array(z.object({
    locationName: z.string().min(2),
    sequenceNumber: z.number().int().min(1).optional(),
  })).optional(),
  droppingPoints: z.array(z.object({
    locationName: z.string().min(2),
    sequenceNumber: z.number().int().min(1).optional(),
  })).optional(),
});

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sourceCity, destinationCity, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { sourceCity: { contains: search, mode: 'insensitive' } },
        { destinationCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sourceCity) {
      where.sourceCity = { contains: sourceCity, mode: 'insensitive' };
    }

    if (destinationCity) {
      where.destinationCity = { contains: destinationCity, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // A VENDOR may only see the routes they own. ADMIN (and anonymous public
    // website traffic) continue to see everything.
    if (req.user?.role === 'VENDOR') {
      where.userId = req.user.id;
    }

    // Get total count for pagination
    const total = await prisma.route.count({ where });

    // Get routes with pagination
    const routes = await prisma.route.findMany({
      where,
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({
      success: true,
      message: 'Routes retrieved successfully',
      data: {
        routes,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving routes',
    });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Route retrieved successfully',
      data: route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving route',
    });
  }
};

// Create route
const createRoute = async (req, res) => {
  try {
    const validatedData = routeSchema.parse(req.body);
    
    // Extract boarding and dropping points data
    const { boardingPoints, droppingPoints, ...routeData } = validatedData;
    
    // Create route with nested creates for boarding and dropping points
    const route = await prisma.route.create({
      data: {
        ...routeData,
        // Stamp ownership so a vendor's routes stay scoped to them
        userId: req.user?.role === 'VENDOR' ? req.user.id : routeData.userId,
        boardingPoints: boardingPoints ? { create: boardingPoints } : undefined,
        droppingPoints: droppingPoints ? { create: droppingPoints } : undefined,
      },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    // @@unique([sourceCity, destinationCity]) - this pair already exists
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A route between these two locations already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating route',
    });
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = routeSchema.parse(req.body);

    // Extract boarding and dropping points data
    const { boardingPoints, droppingPoints, ...routeData } = validatedData;

    // A vendor may only edit their own routes
    if (req.user?.role === 'VENDOR') {
      const existing = await prisma.route.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own routes.',
        });
      }
    }
    
    // Update route with nested updates for boarding and dropping points
    const route = await prisma.route.update({
      where: { id },
      data: {
        ...routeData,
        boardingPoints: boardingPoints ? {
          deleteMany: {},  // Delete existing points
          create: boardingPoints,
        } : undefined,
        droppingPoints: droppingPoints ? {
          deleteMany: {},  // Delete existing points
          create: droppingPoints,
        } : undefined,
      },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    res.json({
      success: true,
      message: 'Route updated successfully',
      data: route,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating route',
    });
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    // A vendor may only delete their own routes
    if (req.user?.role === 'VENDOR') {
      const existing = await prisma.route.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own routes.',
        });
      }
    }

    // Delete associated boarding and dropping points first
    await prisma.$transaction([
      prisma.boardingPoint.deleteMany({ where: { routeId: id } }),
      prisma.droppingPoint.deleteMany({ where: { routeId: id } }),
      prisma.route.delete({ where: { id } }),
    ]);
    
    res.json({
      success: true,
      message: 'Route and associated points deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting route',
    });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
}; 