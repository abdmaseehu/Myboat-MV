const { z } = require('zod');
const prisma = require('../../lib/prisma');

const createCheckinSchema = z.object({
  bookingId: z.string(),
  notes: z.string().optional(),
});

// Booking include used by check-in responses / lookups
const bookingInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      mobile: true,
    },
  },
  vehicle: {
    select: { id: true, vehicleName: true, vehicleNumber: true },
  },
  route: {
    select: {
      id: true,
      sourceCity: true,
      destinationCity: true,
      user: { select: { id: true } },
    },
  },
  schedule: {
    select: { id: true, departureTime: true, arrivalTime: true },
  },
  boardingPoint: true,
  droppingPoint: true,
};

const resolveVendor = async (userId) => {
  return prisma.vendor.findFirst({ where: { userId } });
};

// A booking belongs to this operator if:
//  - booking.vendorId === req.user.id (booking.vendor references User.id), OR
//  - the booking's route was created by this user (route.userId === req.user.id)
const operatorOwnsBooking = (booking, userId) => {
  if (!booking) return false;
  if (booking.vendorId === userId) return true;
  if (booking.route && booking.route.user && booking.route.user.id === userId) return true;
  return false;
};

// POST /checkins
const createCheckin = async (req, res) => {
  try {
    const data = createCheckinSchema.parse(req.body);

    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: bookingInclude,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!operatorOwnsBooking(booking, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This booking does not belong to your operator account',
      });
    }

    const existing = await prisma.checkin.findUnique({ where: { bookingId: booking.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already checked in' });
    }

    const [checkin, updatedBooking] = await prisma.$transaction([
      prisma.checkin.create({
        data: {
          bookingId: booking.id,
          vendorId: vendor.id,
          scannedByUserId: req.user.id,
          notes: data.notes,
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { checkedInAt: new Date() },
        include: bookingInclude,
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded',
      data: { checkin, booking: updatedBooking },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('createCheckin error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error recording check-in',
    });
  }
};

// GET /checkins?today=1
const getMyCheckins = async (req, res) => {
  try {
    const vendor = await resolveVendor(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const where = { vendorId: vendor.id };
    if (req.query.today === '1' || req.query.today === 'true') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      where.scannedAt = { gte: start, lte: end };
    }

    const checkins = await prisma.checkin.findMany({
      where,
      include: {
        booking: { include: bookingInclude },
        scannedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: 100,
    });

    return res.json({
      success: true,
      message: 'Check-ins retrieved',
      data: checkins,
    });
  } catch (error) {
    console.error('getMyCheckins error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving check-ins',
    });
  }
};

// GET /checkins/lookup/:bookingRef
const lookupBooking = async (req, res) => {
  try {
    const { bookingRef } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: bookingRef },
          // Support scanning payloads where the booking id has extra prefixes
          { id: { endsWith: bookingRef } },
        ],
      },
      include: {
        ...bookingInclude,
        checkin: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!operatorOwnsBooking(booking, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This booking does not belong to your operator account',
      });
    }

    return res.json({
      success: true,
      message: 'Booking found',
      data: booking,
    });
  } catch (error) {
    console.error('lookupBooking error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error looking up booking',
    });
  }
};

module.exports = {
  createCheckin,
  getMyCheckins,
  lookupBooking,
};
