const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schema
const busScheduleSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  vehicleId: z.string().optional(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  busType: z.enum(['AC_SLEEPER', 'NON_AC_SLEEPER', 'AC_SEATER']),
  departureDate: z.string().datetime(),
  arrivalDate: z.string().datetime(),
  availableSeats: z.coerce.number().int().min(0).default(0),
  blockedSeats: z.coerce.number().int().min(0).default(0),
  priceLocalMvr: z.coerce.number().nonnegative().optional().nullable(),
  priceExpatMvr: z.coerce.number().nonnegative().optional().nullable(),
  priceTouristUsd: z.coerce.number().nonnegative().optional().nullable(),
  // The three prices above are the ADULT fare.
  //
  // A child fare is either switched off (a child pays the adult fare), named
  // outright per tier, or left to childPercent. An infant is a percentage,
  // because "free" is very nearly always the answer.
  childFareEnabled: z.coerce.boolean().optional(),
  childPriceLocalMvr: z.coerce.number().nonnegative().optional().nullable(),
  childPriceExpatMvr: z.coerce.number().nonnegative().optional().nullable(),
  childPriceTouristUsd: z.coerce.number().nonnegative().optional().nullable(),
  // Capped at 100: a child costing more than an adult is a typo every time.
  childPercent: z.coerce.number().min(0).max(100).optional(),
  infantPercent: z.coerce.number().min(0).max(100).optional(),
  isRecurring: z.boolean().default(false),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
  daySpecificTiming: z
    .record(z.object({ departure: z.string(), arrival: z.string() }))
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']).default('ACTIVE'),
  isActive: z.boolean().default(true),
});

// Split scheduler fields from the vehicles relation write
const buildScheduleData = (validatedData) => {
  const { vehicleId, ...rest } = validatedData;
  return rest;
};

// Get all bus schedules with pagination and search
const getAllBusSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, routeId, fromDate, toDate } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    // If user is VENDOR, only show their schedules
    if (req.user.role === 'VENDOR') {
      where.userId = req.user.id;
    }

    if (search) {
      where.OR = [
        { route: { sourceCity: { contains: search, mode: 'insensitive' } } },
        { route: { destinationCity: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (routeId) {
      where.routeId = routeId;
    }

    if (fromDate && toDate) {
      where.departureDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // Get total count for pagination
    const total = await prisma.busSchedule.count({ where });

    // Get bus schedules with pagination
    const busSchedules = await prisma.busSchedule.findMany({
      where,
      include: {
        route: true,
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            totalSeats: true,
            vehicleType: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        departureDate: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Bus schedules retrieved successfully',
      data: {
        busSchedules,
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
      message: error.message || 'Error retrieving bus schedules',
    });
  }
};

// Get bus schedule by ID
const getBusScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const busSchedule = await prisma.busSchedule.findUnique({
      where: { id },
      include: {
        route: true,
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            totalSeats: true,
            vehicleType: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    if (!busSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found',
      });
    }

    // Check if user has access to this schedule
    if (req.user.role === 'VENDOR' && busSchedule.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    res.json({
      success: true,
      message: 'Bus schedule retrieved successfully',
      data: busSchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving bus schedule',
    });
  }
};

// Create bus schedule
const createBusSchedule = async (req, res) => {
  try {
    const validatedData = busScheduleSchema.parse(req.body);
    
    // Create bus schedule
    const busSchedule = await prisma.busSchedule.create({
      data: {
        ...buildScheduleData(validatedData),
        userId: req.user.id,
        vehicles: validatedData.vehicleId ? {
          connect: { id: validatedData.vehicleId }
        } : undefined,
      },
      include: {
        route: true,
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            totalSeats: true,
            vehicleType: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Bus schedule created successfully',
      data: busSchedule,
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
      message: error.message || 'Error creating bus schedule',
    });
  }
};

// Update bus schedule
const updateBusSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = busScheduleSchema.parse(req.body);

    // Check if schedule exists and user has access
    const existingSchedule = await prisma.busSchedule.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found',
      });
    }

    // Check if user has access to update this schedule
    if (req.user.role === 'VENDOR' && existingSchedule.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    // Update bus schedule
    const busSchedule = await prisma.busSchedule.update({
      where: { id },
      data: {
        ...buildScheduleData(validatedData),
        vehicles: validatedData.vehicleId ? {
          set: [], // Remove existing connections
          connect: { id: validatedData.vehicleId }
        } : undefined,
      },
      include: {
        route: true,
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            totalSeats: true,
            vehicleType: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      message: 'Bus schedule updated successfully',
      data: busSchedule,
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
      message: error.message || 'Error updating bus schedule',
    });
  }
};

// Delete bus schedule
const deleteBusSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists and user has access
    const existingSchedule = await prisma.busSchedule.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found',
      });
    }

    // Check if user has access to delete this schedule
    if (req.user.role === 'VENDOR' && existingSchedule.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    await prisma.busSchedule.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Bus schedule deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting bus schedule',
    });
  }
};

module.exports = {
  getAllBusSchedules,
  getBusScheduleById,
  createBusSchedule,
  updateBusSchedule,
  deleteBusSchedule,
}; 