const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const SERVICE_TYPES = ['FERRY', 'PRIVATE_CHARTER', 'LOGISTICS'];

/**
 * Vessel forms post multipart/form-data, so arrays and objects arrive as JSON
 * strings. Accept either and always hand back an array.
 */
const jsonArray = (itemSchema) =>
  z
    .union([
      z.array(itemSchema),
      // Parse the JSON first, then run it through the real item schema so a
      // malformed row is reported rather than silently stored.
      z
        .string()
        .transform((s) => {
          if (!s) return [];
          try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })
        .pipe(z.array(itemSchema)),
    ])
    .optional();

// Blank strings are "not set", not zero — an unpriced currency must stay null
// so the UI can tell "free" apart from "no price published".
// Order matters: z.coerce.number() turns '' into 0, so the empty case must be
// matched before it ever gets there.
const money = z
  .union([
    z.literal('').transform(() => null),
    z.null(),
    z.coerce.number().nonnegative(),
  ])
  .optional()
  .nullable();

// z.coerce.boolean() maps the STRING "false" to true, which would silently
// flip quote-only on. Match the literal strings explicitly.
const flag = z
  .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
  .optional()
  .default(false);

const charterRateSchema = z.object({
  fromIsland: z.string().min(1),
  toIsland: z.string().min(1),
  priceMvr: money,
  priceUsd: money,
  quoteOnly: flag,
});

const logisticsRateSchema = z.object({
  coverage: z.enum(['ROUTE', 'ATOLL', 'NATIONWIDE']).default('ROUTE'),
  fromIsland: z.string().optional().nullable(),
  toIsland: z.string().optional().nullable(),
  atollCode: z.string().optional().nullable(),
  basis: z.enum(['PER_TON', 'FLAT']).default('PER_TON'),
  priceMvr: money,
  priceUsd: money,
  quoteOnly: flag,
});

// Validation schema
const vehicleSchema = z.object({
  vehicleName: z.string().min(2, 'Vehicle name must be at least 2 characters'),
  vehicleNumber: z.string().min(2, 'Vehicle number must be at least 2 characters'),
  vehicleImage: z.string().optional().nullable(),
  // Filenames of gallery images the client wants to KEEP (edit flow). Newly
  // uploaded files arrive separately on req.files and are appended to these.
  keepImages: z
    .union([
      z.array(z.string()),
      z.string().transform((s) => {
        if (!s) return []
        try {
          const parsed = JSON.parse(s)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }),
    ])
    .optional(),
  vehicleStatus: z.enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
  vehicleRating: z.coerce.number().min(0).max(5).optional().nullable(),
  totalSeats: z.coerce.number().min(1, 'Total seats must be at least 1'),
  startDate: z.string()
    .transform((date) => date ? new Date(date).toISOString() : null)
    .optional()
    .nullable(),
  hasAc: z.boolean().default(false),
  driverName: z.string().optional().nullable(),
  driverMobile: z.string().optional().nullable(),
  gearSystem: z.enum(['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC']).optional().nullable(),
  amenities: z.object({
    ids: z.array(z.string())
  }).optional().nullable(),
  vehicleType: z.string(),
  vehicleBrand: z.string().optional().nullable(),
  availableCity: z.string().optional().nullable(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG']).optional().nullable(),
  routeId: z.string().optional().nullable(),
  layoutId: z.string().optional().nullable(),
  // Vessel-specific fields
  baseIsland: z.string().optional().nullable(),
  specification: z
    .union([
      z.record(z.any()),
      z
        .string()
        .transform((s) => {
          if (!s) return null;
          try { return JSON.parse(s); } catch { return null; }
        }),
    ])
    .optional()
    .nullable(),
  termsConditions: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  seatSelectionEnabled: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((s) => s === 'true')])
    .optional(),
  // Blank means "no cap" - the departure's availability is the only limit.
  maxSeatsPerBooking: z
    .union([z.coerce.number().int().positive(), z.literal('').transform(() => null)])
    .nullable()
    .optional(),

  // ---- which services this vessel is offered for -------------------------
  serviceTypes: jsonArray(z.enum(SERVICE_TYPES)),

  // ---- private charter ---------------------------------------------------
  charterPricingMode: z.enum(['LIVE', 'QUOTE']).optional().nullable(),
  charterInstantBooking: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((s) => s === 'true')])
    .optional(),

  // ---- logistics ---------------------------------------------------------
  cargoTypes: jsonArray(z.string()),
  capacityTons: money,
  logisticsCoverage: z.enum(['ROUTE', 'ATOLL', 'NATIONWIDE']).optional().nullable(),
  logisticsAtolls: jsonArray(z.string()),

  // Rate tables travel with the vessel; handled separately from the row data.
  charterRates: jsonArray(charterRateSchema),
  logisticsRates: jsonArray(logisticsRateSchema),
});

/**
 * Updates are partial: the edit dialog doesn't manage every field on the vessel.
 *
 * totalSeats isn't on that form at all, and `hasAc` must lose its `.default(false)`
 * here — a default would silently switch AC off on every edit that didn't send it.
 */
const updateVehicleSchema = vehicleSchema.extend({
  totalSeats: z.coerce.number().min(1).optional(),
  hasAc: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
    .optional(),
  vehicleStatus: z
    .enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'INACTIVE'])
    .optional(),
});

const MAX_VESSEL_IMAGES = 5;

/**
 * Routes use upload.fields(), so uploaded files land on `req.files` keyed by
 * field name (not `req.file`). Collect the gallery for a create/update.
 *
 * @param {object} req
 * @param {string[]} keep filenames the client asked to retain (edit flow)
 * @returns {string[]} up to MAX_VESSEL_IMAGES filenames
 */
function collectVesselImages(req, keep = []) {
  const uploaded = [
    ...(req.files?.vesselImages || []),
    ...(req.files?.vehicleImage || []),
  ].map((f) => f.filename);

  return [...keep, ...uploaded].filter(Boolean).slice(0, MAX_VESSEL_IMAGES);
}

// Get all vehicles with pagination and filters
const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, vehicleType } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    // Filter by user role
    if (req.user.role === 'VENDOR') {
      where.userId = req.user.id;
    }
    
    if (search) {
      where.OR = [
        { vehicleName: { contains: search, mode: 'insensitive' } },
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.vehicleStatus = status;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get total count for pagination
    const total = await prisma.vehicle.count({ where });

    // Get vehicles with pagination
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        charterRates: true,
        logisticsRates: true,
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get routes and layouts for dropdowns
    const routes = await prisma.route.findMany({
      select: {
        id: true,
        sourceCity: true,
        destinationCity: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        sourceCity: 'asc',
      },
    });

    const layouts = await prisma.busLayout.findMany({
      select: {
        id: true,
        layoutName: true,
        totalSeats: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        layoutName: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        routes,
        layouts,
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
      message: error.message || 'Error retrieving vehicles',
    });
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        charterRates: true,
        logisticsRates: true,
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to this vehicle
    if (req.user.role === 'VENDOR' && vehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving vehicle',
    });
  }
};

// Create vehicle
/**
 * Drop rows the operator left blank and collapse a row with no price at all
 * into quote-only, so the customer is never shown a bare "—" where a price
 * should be.
 */
const cleanCharterRates = (rows) =>
  rows
    .filter((r) => r.fromIsland && r.toIsland)
    .map((r) => ({
      fromIsland: r.fromIsland,
      toIsland: r.toIsland,
      priceMvr: r.priceMvr ?? null,
      priceUsd: r.priceUsd ?? null,
      quoteOnly: r.quoteOnly || (r.priceMvr == null && r.priceUsd == null),
    }));

const cleanLogisticsRates = (rows) =>
  rows
    // A ROUTE rate needs both islands; ATOLL needs an atoll. NATIONWIDE needs
    // neither, so it always survives.
    .filter((r) =>
      r.coverage === 'ROUTE'
        ? r.fromIsland && r.toIsland
        : r.coverage === 'ATOLL'
        ? r.atollCode
        : true
    )
    .map((r) => ({
      coverage: r.coverage,
      fromIsland: r.coverage === 'ROUTE' ? r.fromIsland : null,
      toIsland: r.coverage === 'ROUTE' ? r.toIsland : null,
      atollCode: r.coverage === 'ATOLL' ? r.atollCode : null,
      basis: r.basis,
      priceMvr: r.priceMvr ?? null,
      priceUsd: r.priceUsd ?? null,
      quoteOnly: r.quoteOnly || (r.priceMvr == null && r.priceUsd == null),
    }));

const createVehicle = async (req, res) => {
  try {
    // Pre-process the data before validation
    console.log(req.body);
    const dataToValidate = {
      ...req.body,
      totalSeats: Number(req.body.totalSeats),
      vehicleRating: req.body.vehicleRating ? Number(req.body.vehicleRating) : null,
      hasAc: req.body.hasAc === 'true' || req.body.hasAc === true,
      // Handle amenities array
      amenities: Array.isArray(req.body.amenities) ? 
        { ids: req.body.amenities } : 
        req.body.amenities ? 
          { ids: [req.body.amenities] } : 
          null,
      // Clean up the date format if present
      startDate: req.body.startDate || null
    };

    const validatedData = vehicleSchema.parse(dataToValidate);
    const { keepImages, charterRates, logisticsRates, ...vesselData } = validatedData;

    // Up to 5 gallery images; the first doubles as the legacy cover image so
    // existing list/detail views that read `vehicleImage` keep working.
    const images = collectVesselImages(req);

    // Create vehicle with validated data
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vesselData,
        charterRates: charterRates?.length
          ? { create: cleanCharterRates(charterRates) }
          : undefined,
        logisticsRates: logisticsRates?.length
          ? { create: cleanLogisticsRates(logisticsRates) }
          : undefined,
        userId: req.user.id,
        amenities: validatedData.amenities,
        // startDate is already properly formatted by the schema
        startDate: validatedData.startDate,
        images,
        vehicleImage: images[0] || null,
      },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Vehicle creation error:', error);
    
    if (error instanceof z.ZodError) {
      // Name the offending fields: a bare "Validation error" toast gives the
      // operator nothing to act on.
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({
        success: false,
        message: `Validation error — ${detail}`,
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vehicle',
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateVehicleSchema.parse(req.body);

    // Check if vehicle exists and user has access
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to update this vehicle
    if (req.user.role === 'VENDOR' && existingVehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    const { keepImages, charterRates, logisticsRates, ...vesselData } = validatedData;

    // Gallery = images the client kept + any newly uploaded ones. When the
    // client sends no `keepImages` at all we treat it as "leave the gallery
    // alone" rather than "delete everything", unless new files came in.
    const existingImages = Array.isArray(existingVehicle.images)
      ? existingVehicle.images
      : [];
    const hasNewUploads =
      (req.files?.vesselImages?.length || 0) + (req.files?.vehicleImage?.length || 0) > 0;

    let images = existingImages;
    if (keepImages !== undefined || hasNewUploads) {
      images = collectVesselImages(req, keepImages ?? existingImages);
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...vesselData,
        // Rate tables are replaced wholesale when the form sends them, and
        // left untouched when it doesn't (partial updates from other screens).
        charterRates: charterRates
          ? { deleteMany: {}, create: cleanCharterRates(charterRates) }
          : undefined,
        logisticsRates: logisticsRates
          ? { deleteMany: {}, create: cleanLogisticsRates(logisticsRates) }
          : undefined,
        amenities:
          typeof validatedData.amenities === 'string'
            ? JSON.parse(validatedData.amenities)
            : validatedData.amenities ?? null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        images,
        vehicleImage: images[0] || existingVehicle.vehicleImage || null,
      },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Name the offending fields: a bare "Validation error" toast gives the
      // operator nothing to act on.
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({
        success: false,
        message: `Validation error — ${detail}`,
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating vehicle',
    });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists and user has access
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to delete this vehicle
    if (req.user.role === 'VENDOR' && existingVehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    await prisma.vehicle.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vehicle',
    });
  }
};

// Get all layouts for dropdown
const getLayoutsList = async (req, res) => {
  try {
    const layouts = await prisma.busLayout.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        layoutName: true,
        totalSeats: true,
        sleeperSeats: true,
        seaterSeats: true,
        hasUpperDeck: true,
        upperDeckSeats: true,
        sleeperPrice: true,
        seaterPrice: true,
        rowCount: true,
        columnCount: true,
      },
      orderBy: {
        layoutName: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Bus layouts retrieved successfully',
      data: layouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving bus layouts',
    });
  }
};

// Get all routes for dropdown
const getRoutesList = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        sourceCity: true,
        destinationCity: true,
        distance: true,
        boardingPoints: {
          select: {
            id: true,
            locationName: true,
            sequenceNumber: true,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
        droppingPoints: {
          select: {
            id: true,
            locationName: true,
            sequenceNumber: true,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
      },
      orderBy: {
        sourceCity: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Routes retrieved successfully',
      data: routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving routes',
    });
  }
};

module.exports = {
  // exported for tests
  vehicleSchema,
  updateVehicleSchema,
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getLayoutsList,
  getRoutesList,
}; 