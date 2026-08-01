const express = require('express');
const { isAuthenticated, optionalAuth } = require('../../middleware/auth.middleware');
const { isAdminOrVendor } = require('../../middleware/role.middleware');
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../../controllers/v1/route.controller');

const router = express.Router();

// Public routes. optionalAuth attaches req.user when a token is present so the
// controller can scope results to a VENDOR's own routes without blocking the
// anonymous public website.
router.get('/', optionalAuth, getAllRoutes);
router.get('/:id', optionalAuth, getRouteById);

// Protected routes (Admin or Vendor - vendors are scoped to their own routes
// inside the controller)
router.post('/', isAuthenticated, isAdminOrVendor, createRoute);
router.put('/:id', isAuthenticated, isAdminOrVendor, updateRoute);
router.delete('/:id', isAuthenticated, isAdminOrVendor, deleteRoute);

module.exports = router;
