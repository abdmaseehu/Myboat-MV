const getStripeInstance = require('../../config/stripe');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { getCurrencyForCategory } = require('../../utils/currency');
const prisma = new PrismaClient();

// Validation schema for seat numbers
const seatNumberSchema = z.object({
  key: z.string(),
  seatNumber: z.string(),
  deck: z.enum(['LOWER', 'UPPER']),
  type: z.enum(['SEAT', 'SEATER', 'SLEEPER']),
  price: z.number().positive()
}).passthrough();

// Validation schema for booking
const createBookingSchema = z.object({
  vehicleId: z.string().optional().nullable(),
  vendorId: z.string(),
  routeId: z.string().optional().nullable(),
  boardingPointId: z.string().optional().nullable(),
  droppingPointId: z.string().optional().nullable(),
  bookingDate: z.string().datetime(),
  seatNumbers: z.array(seatNumberSchema),
  totalAmount: z.number().nonnegative(),
  discountAmount: z.number().min(0).default(0),
  finalAmount: z.number().nonnegative(),
  paymentMethod: z.enum(['CASH', 'STRIPE', 'BANK_TRANSFER']),
  paymentStatus: z.enum(['PAID', 'PENDING', 'PROCESSING', 'AWAITING_PAYMENT', 'FAILED']).optional(),
  passengerCategory: z.enum(['LOCAL', 'EXPAT', 'TOURIST']).optional(),
  currency: z.string().optional(),
  isManual: z.boolean().optional(),
  agentId: z.string().optional().nullable(),
  agentDiscount: z.number().min(0).optional(),
  agentCommission: z.number().min(0).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

const updateBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  cancellationReason: z.string().optional(),
  cancellationCharge: z.number().min(0).optional(),
  refundAmount: z.number().min(0).optional(),
});

// Create booking
const createBooking = async (req, res) => {
  try {
    if (!req.body.seatNumbers || !Array.isArray(req.body.seatNumbers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat numbers format',
        error: 'seatNumbers must be an array'
      });
    }

    console.log('Incoming request body:', JSON.stringify(req.body, null, 2));
    
    // Ensure seat numbers are properly formatted
    const formattedData = {
      ...req.body,
      seatNumbers: req.body.seatNumbers.map((seat, index) => {
        if (!seat) {
          throw new Error(`Seat at index ${index} is undefined or null`);
        }
        
        console.log('Processing seat:', seat);
        
        const formattedSeat = {
          key: seat.key || `${seat.deck || 'LOWER'}-${seat.seatNumber || seat.number || index}`,
          seatNumber: seat.seatNumber || seat.number || `SEAT-${index}`,
          deck: seat.deck || 'LOWER',
          type: seat.type || 'SEAT',
          price: Number(seat.price || 0)
        };
        
        console.log('Formatted seat:', formattedSeat);
        return formattedSeat;
      })
    };

    console.log('Formatted data:', JSON.stringify(formattedData, null, 2));

    const validatedData = createBookingSchema.parse(formattedData);

    // Handle Stripe payment if selected
    let paymentIntent;
    if (validatedData.paymentMethod === 'STRIPE') {
      try {
        const stripe = await getStripeInstance(); // Get Stripe instance dynamically
        const stripeCurrency = (
          validatedData.currency ||
          getCurrencyForCategory(validatedData.passengerCategory)
        ).toLowerCase();
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(validatedData.finalAmount * 100),
          currency: stripeCurrency,
          payment_method_types: ['card'],
          metadata: {
            userId: req.user.id,
            vehicleId: validatedData.vehicleId,
            seats: JSON.stringify(validatedData.seatNumbers)
          }
        });
      } catch (stripeError) {
        console.error('Stripe Error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Error creating payment intent',
          error: stripeError.message
        });
      }
    }

    // Manual booking: embed customer info as metadata in seatNumbers so it
    // is not lost even though Booking does not have dedicated guest columns.
    const seatNumbersWithMeta =
      validatedData.isManual && (validatedData.customerName || validatedData.customerEmail || validatedData.customerPhone || validatedData.notes)
        ? [
            {
              key: '_meta',
              seatNumber: '_meta',
              deck: 'LOWER',
              type: 'SEAT',
              price: 0,
              meta: true,
              customerName: validatedData.customerName,
              customerEmail: validatedData.customerEmail,
              customerPhone: validatedData.customerPhone,
              notes: validatedData.notes,
            },
            ...validatedData.seatNumbers,
          ]
        : validatedData.seatNumbers;

    // Manual bookings default to CONFIRMED (the operator is recording an offline sale)
    const initialStatus = validatedData.isManual
      ? 'CONFIRMED'
      : validatedData.paymentMethod === 'CASH'
      ? 'PENDING'
      : 'PROCESSING';
    const initialPaymentStatus =
      validatedData.paymentStatus ||
      (validatedData.isManual
        ? 'PAID'
        : validatedData.paymentMethod === 'CASH'
        ? 'PENDING'
        : 'PROCESSING');

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        userId: validatedData.isManual ? null : req.user.id,
        vendorId: validatedData.vendorId,
        vehicleId: validatedData.vehicleId || null,
        routeId: validatedData.routeId || null,
        boardingPointId: validatedData.boardingPointId || null,
        droppingPointId: validatedData.droppingPointId || null,
        bookingDate: validatedData.bookingDate,
        totalAmount: validatedData.totalAmount,
        discountAmount: validatedData.discountAmount || 0,
        finalAmount: validatedData.finalAmount,
        paymentMethod: validatedData.paymentMethod,
        seatNumbers: seatNumbersWithMeta,
        passengerCategory: validatedData.passengerCategory,
        // Currency is ALWAYS derived from passenger category (MVR/USD independent).
        currency:
          validatedData.currency ||
          (typeof getCurrencyForCategory === 'function'
            ? getCurrencyForCategory(validatedData.passengerCategory)
            : validatedData.passengerCategory === 'TOURIST' ? 'USD' : 'MVR'),
        isManual: validatedData.isManual || false,
        agentId: validatedData.agentId || null,
        agentDiscount: validatedData.agentDiscount || 0,
        agentCommission: validatedData.agentCommission || 0,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentIntentId: paymentIntent?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true
          }
        },
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true
          }
        },
        boardingPoint: true,
        droppingPoint: true
      }
    });

    // Handle successful payment intent creation
    if (paymentIntent) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'AWAITING_PAYMENT'
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        clientSecret: paymentIntent?.client_secret
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Error in createBooking:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating booking'
    });
  }
};

// Get all bookings with pagination
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, fromDate, toDate, stats } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};

    // Add user filter for non-admin users
    if (req.user.role !== 'ADMIN') {
      if (req.user.role === 'VENDOR') {
        where.vendorId = req.user.id;
      } else {
        where.userId = req.user.id;
      }
    }

    // Lightweight stats endpoint (used by the operator bookings dashboard cards)
    if (stats === '1' || stats === 'true') {
      const [total, confirmed, pending, revenueRows] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
        prisma.booking.groupBy({
          by: ['currency'],
          where: { ...where, paymentStatus: 'PAID' },
          _sum: { finalAmount: true },
        }),
      ]);

      const revenueByCurrency = revenueRows.reduce((acc, row) => {
        const key = row.currency || 'MVR';
        acc[key] = Number(row._sum.finalAmount || 0);
        return acc;
      }, {});

      return res.json({
        success: true,
        message: 'Booking stats retrieved successfully',
        data: {
          total,
          confirmed,
          pending,
          revenueByCurrency,
        },
      });
    }
    // Add vendor filter if role is vendor


    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (fromDate && toDate) {
      where.bookingDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      };
    }

    // Get total count for pagination
    const total = await prisma.booking.count({ where });

    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true
          }
        },
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true
          }
        },
        boardingPoint: true,
        droppingPoint: true
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving bookings'
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true
          }
        },
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true
          }
        },
        boardingPoint: true,
        droppingPoint: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has permission to view this booking
    if (
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'VENDOR' && 
      booking.userId !== req.user.id && 
      booking.vendorId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving booking'
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);

    // Check if booking exists and user has permission
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'VENDOR' && 
      existingBooking.userId !== req.user.id && 
      existingBooking.vendorId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this booking'
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true
          }
        },
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true
          }
        },
        boardingPoint: true,
        droppingPoint: true
      }
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking'
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists and user has permission
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this booking'
      });
    }

    await prisma.booking.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting booking'
    });
  }
};

/**
 * Get bookings by vehicle ID and date
 * @route GET /api/v1/bookings/vehicle/:vehicleId
 * @param {string} vehicleId - Vehicle ID
 * @param {string} date - Booking date (YYYY-MM-DD)
 */
const getBookingsByVehicleAndDate = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { date } = req.query;

    if (!vehicleId || !date) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID and date are required",
      });
    }

    // Parse the date string to ensure it's a valid date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Set the time to start of day and end of day for the query
    const startDate = new Date(bookingDate.setHours(0, 0, 0, 0));
    const endDate = new Date(bookingDate.setHours(23, 59, 59, 999));

    const bookings = await prisma.booking.findMany({
      where: {
        vehicleId: vehicleId,
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        // Only get confirmed or pending bookings
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      },
      select: {
        id: true,
        bookingDate: true,
        seatNumbers: true,
        status: true,
      }
    });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching vehicle bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching vehicle bookings",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingsByVehicleAndDate,
}; 