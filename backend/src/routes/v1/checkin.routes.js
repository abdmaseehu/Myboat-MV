const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isVendor } = require('../../middleware/role.middleware');
const {
  createCheckin,
  getMyCheckins,
  lookupBooking,
} = require('../../controllers/v1/checkin.controller');

router.use(isAuthenticated, isVendor);

router.get('/', getMyCheckins);
router.post('/', createCheckin);
router.get('/lookup/:bookingRef', lookupBooking);

module.exports = router;
