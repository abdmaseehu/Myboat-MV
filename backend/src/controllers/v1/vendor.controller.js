const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Validation schemas
const vendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessEmail: z.string().email('Invalid business email address'),
  businessMobile: z.string().min(10, 'Business mobile must be at least 10 characters'),
  businessAddress: z.string().min(5, 'Business address must be at least 5 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  rating: z.coerce.number().min(0).max(5).optional(),
  agentCommission: z.coerce.number().min(0).max(100).optional(),
  adminCommission: z.coerce.number().min(0).max(100).optional(),
  userId: z.string().min(1, 'User ID is required')
});

// Get all vendors with pagination and search
const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { businessEmail: { contains: search, mode: 'insensitive' } },
        { businessMobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.vendor.count({ where });

    // Get vendors with pagination
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            role: true,
            active: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: {
        vendors,
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
      message: error.message || 'Error retrieving vendors',
    });
  }
};

// Get vendor by ID
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            role: true,
            active: true,
          },
        },
      },
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Vendor retrieved successfully',
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving vendor',
    });
  }
};

// Create vendor
const createVendor = async (req, res) => {
  try {
    console.log('File upload info:', {
      file: req.file,
      logoPath: req.file ? `/uploads/${req.file.filename}` : null,
      body: req.body
    });

    // Validate input data first
    const validatedData = vendorSchema.parse(req.body);
    const { userId, ...vendorData } = validatedData;

    try {
      // Create vendor with user connection
      const vendor = await prisma.vendor.create({
        data: {
          ...vendorData,
          businessLogo: req.file ? `/uploads/${req.file.filename}` : null,
          user: {
            connect: {
              id: userId
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              role: true,
              active: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (prismaError) {
      // Clean up uploaded file if exists
      if (req.file) {
        const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      // Handle Prisma unique constraint errors
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        let message = 'This field already exists';
        
        switch (field) {
          case 'businessEmail':
            message = 'Business email already exists';
            break;
          case 'businessMobile':
            message = 'Business mobile number already exists';
            break;
          case 'userId':
            message = 'This user is already associated with a vendor';
            break;
        }
        
        return res.status(400).json({
          success: false,
          message,
        });
      }

      throw prismaError;
    }
  } catch (error) {
    console.error('Vendor creation error:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vendor',
    });
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = vendorSchema.parse(req.body);
    
    // Get existing vendor
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
      select: { businessLogo: true },
    });

    if (!existingVendor) {
      // Clean up uploaded file if exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Handle logo upload
    let logoPath = existingVendor.businessLogo;
    if (req.file) {
      // Delete old logo if exists
      if (existingVendor.businessLogo) {
        const oldPath = path.join(process.cwd(), 'public', existingVendor.businessLogo);
        await fs.unlink(oldPath).catch(console.error);
      }
      logoPath = `/uploads/${req.file.filename}`;
    }

    try {    
      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          ...validatedData,
          businessLogo: logoPath,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              role: true,
              active: true,
            },
          },
        },
      });
      
      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: vendor,
      });
    } catch (prismaError) {
      // Clean up newly uploaded file if exists
      if (req.file) {
        const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      // Handle Prisma unique constraint errors
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        let message = 'This field already exists';
        
        switch (field) {
          case 'businessEmail':
            message = 'Business email already exists';
            break;
          case 'businessMobile':
            message = 'Business mobile number already exists';
            break;
          case 'userId':
            message = 'This user is already associated with a vendor';
            break;
        }
        
        return res.status(400).json({
          success: false,
          message,
        });
      }

      throw prismaError;
    }
  } catch (error) {
    console.error('Vendor update error:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating vendor',
    });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vendor to delete logo
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { businessLogo: true },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Delete logo file if exists
    if (vendor.businessLogo) {
      const logoPath = path.join(process.cwd(), 'public', vendor.businessLogo);
      await fs.unlink(logoPath).catch(console.error);
    }

    // Delete vendor
    await prisma.vendor.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vendor',
    });
  }
};

// Zod schema for operator self-update (all optional)
const myVendorSchema = z.object({
  businessName: z.string().min(2).optional(),
  businessLogo: z.string().optional().nullable(),
  businessMobile: z.string().optional().nullable(),
  businessEmail: z.string().email().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  contactEmail: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  baseIsland: z.string().optional().nullable(),
  termsConditions: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  faqs: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).optional(),
  publicSlug: z.string().max(80).optional().nullable(),
  bankMvrName: z.string().optional().nullable(),
  bankMvrHolder: z.string().optional().nullable(),
  bankMvrAccount: z.string().optional().nullable(),
  bankUsdName: z.string().optional().nullable(),
  bankUsdHolder: z.string().optional().nullable(),
  bankUsdAccount: z.string().optional().nullable(),
});

// Normalize slug: lowercase, non-alphanumeric -> '-', collapse dashes, trim
const normalizeSlug = (raw) => {
  if (!raw) return raw;
  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
};

/**
 * Derive a unique public slug from a business name.
 * Falls back to "operator" for names that normalise to nothing (e.g. all
 * non-Latin), and appends -2, -3, ... until the slug is free.
 */
const buildUniqueSlug = async (businessName, vendorIdToIgnore) => {
  const base = normalizeSlug(businessName) || 'operator';
  let candidate = base;

  for (let n = 2; n < 100; n++) {
    const clash = await prisma.vendor.findFirst({
      where: {
        publicSlug: candidate,
        ...(vendorIdToIgnore ? { NOT: { id: vendorIdToIgnore } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  // Practically unreachable; keeps the caller from looping forever.
  return `${base}-${Date.now().toString(36)}`;
};

// GET /vendors/me - current operator's vendor record
const getMyVendor = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            role: true,
            active: true,
          },
        },
      },
    });

    if (!vendor) {
      // Silently no-op for non-vendor users
      return res.json({ success: true, message: 'No vendor profile', data: null });
    }

    res.json({ success: true, message: 'Vendor retrieved', data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving vendor' });
  }
};

// PUT /vendors/me - update current operator's vendor record
const updateMyVendor = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const existing = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!existing) {
      // Silently no-op if user isn't a vendor
      return res.json({ success: true, message: 'No vendor profile', data: null });
    }

    // If multipart/form-data, faqs may arrive as JSON string
    const body = { ...req.body };
    if (typeof body.faqs === 'string') {
      try { body.faqs = JSON.parse(body.faqs); } catch (_) { /* leave as-is, zod will fail */ }
    }
    // If a new logo file uploaded, replace businessLogo
    if (req.file) {
      body.businessLogo = `/uploads/${req.file.filename}`;
      // Delete old logo file if exists
      if (existing.businessLogo) {
        const oldPath = path.join(process.cwd(), 'public', existing.businessLogo);
        await fs.unlink(oldPath).catch(() => {});
      }
    }

    const validated = myVendorSchema.parse(body);

    // Normalize + validate publicSlug uniqueness
    if (validated.publicSlug !== undefined && validated.publicSlug !== null && validated.publicSlug !== '') {
      const slug = normalizeSlug(validated.publicSlug);
      if (!slug) {
        return res.status(400).json({ success: false, message: 'Invalid publicSlug' });
      }
      validated.publicSlug = slug;

      const clash = await prisma.vendor.findFirst({
        where: { publicSlug: slug, NOT: { id: existing.id } },
        select: { id: true },
      });
      if (clash) {
        return res.status(409).json({ success: false, message: 'This URL is already taken. Please choose another.' });
      }
    } else if (
      (validated.publicSlug === '' || validated.publicSlug === null) &&
      !existing.publicSlug
    ) {
      // Nothing chosen and none stored: derive one from the business name so
      // the public profile and embed codes work without extra setup. Operators
      // can still overwrite it from the Public URL tab.
      validated.publicSlug = await buildUniqueSlug(
        validated.businessName || existing.businessName,
        existing.id
      );
    } else if (validated.publicSlug === '') {
      // Explicitly cleared but one already exists - keep the existing slug so
      // links already shared by the operator don't silently break.
      delete validated.publicSlug;
    }

    // Convert empty-string contactEmail to null so DB doesn't store empty
    if (validated.contactEmail === '') validated.contactEmail = null;

    const vendor = await prisma.vendor.update({
      where: { id: existing.id },
      data: validated,
    });

    res.json({ success: true, message: 'Vendor updated', data: vendor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A unique field is already taken.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Error updating vendor' });
  }
};

// GET /vendors/public - PUBLIC (no auth) - list of approved/active operators.
// Used by the public charter/logistics request forms so a customer can target
// a specific operator instead of broadcasting.
const getPublicVendors = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { status: 'ACTIVE' };
    if (search) {
      where.businessName = { contains: String(search), mode: 'insensitive' };
    }

    const vendors = await prisma.vendor.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        businessLogo: true,
        publicSlug: true,
        rating: true,
        baseIsland: true,
      },
      orderBy: { businessName: 'asc' },
    });

    res.json({ success: true, message: 'Operators retrieved', data: vendors });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving operators' });
  }
};

// GET /vendors/public/:slug - PUBLIC (no auth) - vendor profile + approved vessels
const getVendorByPublicSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Slug required' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { publicSlug: String(slug).toLowerCase() },
      select: {
        id: true,
        businessName: true,
        businessLogo: true,
        businessAddress: true,
        rating: true,
        contactEmail: true,
        contactPhone: true,
        description: true,
        baseIsland: true,
        termsConditions: true,
        cancellationPolicy: true,
        faqs: true,
        publicSlug: true,
        status: true,
        userId: true,
      },
    });

    if (!vendor || vendor.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    // Vessels belong to the vendor's user (via Vehicle.userId)
    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: vendor.userId,
        vehicleStatus: { in: ['AVAILABLE', 'BOOKED'] },
      },
      select: {
        id: true,
        vehicleName: true,
        vehicleNumber: true,
        vehicleImage: true,
        vehicleType: true,
        vehicleBrand: true,
        baseIsland: true,
        totalSeats: true,
        hasAc: true,
        vehicleRating: true,
        availableCity: true,
        amenities: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip internal userId before returning
    const { userId, status, ...publicVendor } = vendor;

    res.json({
      success: true,
      message: 'Vendor retrieved',
      data: { vendor: publicVendor, vessels: vehicles },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving vendor' });
  }
};

// GET /vendors/public/vessel/:id - PUBLIC vessel + its operator (for embed)
const getPublicVessel = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        vehicleName: true,
        vehicleNumber: true,
        vehicleImage: true,
        vehicleType: true,
        vehicleBrand: true,
        baseIsland: true,
        totalSeats: true,
        hasAc: true,
        vehicleRating: true,
        availableCity: true,
        amenities: true,
        vehicleStatus: true,
        userId: true,
      },
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vessel not found' });
    }
    let vendor = null;
    if (vehicle.userId) {
      vendor = await prisma.vendor.findUnique({
        where: { userId: vehicle.userId },
        select: {
          id: true,
          businessName: true,
          businessLogo: true,
          publicSlug: true,
          baseIsland: true,
        },
      });
    }
    const { userId, ...publicVehicle } = vehicle;
    res.json({ success: true, data: { vessel: publicVehicle, vendor } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving vessel' });
  }
};

// Shape shared by the multi-vessel and route embeds.
const PUBLIC_VESSEL_SELECT = {
  id: true,
  vehicleName: true,
  vehicleNumber: true,
  vehicleImage: true,
  vehicleType: true,
  baseIsland: true,
  totalSeats: true,
  hasAc: true,
  vehicleRating: true,
};

// GET /vendors/public/vessels?ids=a,b,c - PUBLIC, several vessels in one embed
const getPublicVessels = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24); // keep the embed (and the query) a sane size

    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'No vessel ids supplied' });
    }

    const vessels = await prisma.vehicle.findMany({
      where: { id: { in: ids }, vehicleStatus: { in: ['AVAILABLE', 'BOOKED'] } },
      select: { ...PUBLIC_VESSEL_SELECT, userId: true },
    });

    // Attach each vessel's operator without leaking userId.
    const vendors = await prisma.vendor.findMany({
      where: { userId: { in: [...new Set(vessels.map((v) => v.userId).filter(Boolean))] } },
      select: { userId: true, businessName: true, businessLogo: true, publicSlug: true },
    });
    const byUser = new Map(vendors.map((v) => [v.userId, v]));

    const data = vessels.map(({ userId, ...v }) => {
      const vendor = byUser.get(userId) || null;
      return {
        ...v,
        vendor: vendor ? { ...vendor, userId: undefined } : null,
      };
    });

    // Preserve the order the admin picked rather than DB order.
    data.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

    res.json({ success: true, data: { vessels: data } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving vessels' });
  }
};

const PUBLIC_ROUTE_SELECT = {
  id: true,
  sourceCity: true,
  destinationCity: true,
  serviceType: true,
  distance: true,
  durationMinutes: true,
  isActive: true,
};

const PUBLIC_SCHEDULE_SELECT = {
  id: true,
  routeId: true,
  departureTime: true,
  arrivalTime: true,
  availableSeats: true,
  priceLocalMvr: true,
  priceExpatMvr: true,
  priceTouristUsd: true,
  vehicles: { select: PUBLIC_VESSEL_SELECT },
};

// departureTime is a full timestamp but means a time of day, so order on
// minutes-of-day rather than the raw date.
const minutesOfDay = (d) => {
  const t = new Date(d);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
};

const fetchActiveSchedules = async (routeIds) => {
  const schedules = await prisma.busSchedule.findMany({
    where: { routeId: { in: routeIds }, status: 'ACTIVE' },
    select: PUBLIC_SCHEDULE_SELECT,
  });
  schedules.sort((a, b) => minutesOfDay(a.departureTime) - minutesOfDay(b.departureTime));
  return schedules;
};

// GET /vendors/public/route/:id - PUBLIC route + its active departures (embed)
const getPublicRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      select: {
        ...PUBLIC_ROUTE_SELECT,
        boardingPoints: {
          select: { id: true, locationName: true, sequenceNumber: true },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!route || route.isActive === false) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const schedules = await fetchActiveSchedules([id]);

    res.json({ success: true, data: { route, schedules } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving route' });
  }
};

// GET /vendors/public/routes?ids=a,b,c - PUBLIC timetable across several routes
const getPublicRoutes = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);

    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'No route ids supplied' });
    }

    const routes = await prisma.route.findMany({
      where: { id: { in: ids }, isActive: true },
      select: PUBLIC_ROUTE_SELECT,
    });

    const schedules = await fetchActiveSchedules(routes.map((r) => r.id));

    // Group departures under their route, keeping the order the operator chose.
    const data = routes
      .map((route) => ({
        route,
        schedules: schedules.filter((s) => s.routeId === route.id),
      }))
      .sort((a, b) => ids.indexOf(a.route.id) - ids.indexOf(b.route.id));

    res.json({ success: true, data: { routes: data } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving routes' });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getMyVendor,
  updateMyVendor,
  getVendorByPublicSlug,
  getPublicVendors,
  getPublicVessel,
  getPublicVessels,
  getPublicRoute,
  getPublicRoutes,
};
