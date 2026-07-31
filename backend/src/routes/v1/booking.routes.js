const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  bulkUpdateBookingStatus,
  deleteBooking,
  getBookingsByVehicleAndDate
} = require('../../controllers/v1/booking.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');

// Public route for checking vehicle bookings
router.get('/vehicle/:vehicleId', getBookingsByVehicleAndDate);

// All other routes are protected
router.use(isAuthenticated);

// Booking routes
router.post('/', createBooking);
router.get('/', getAllBookings);
// Must be declared BEFORE '/:id' so Express does not treat "bulk-status" as an id.
router.patch('/bulk-status', bulkUpdateBookingStatus);
router.get('/:id', getBookingById);
router.patch('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router; 