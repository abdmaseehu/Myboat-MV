const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdminOrVendor } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getLayoutsList,
  getRoutesList,
} = require('../../controllers/v1/vehicle.controller');

// All routes require authentication and admin/vendor role
router.use(isAuthenticated, isAdminOrVendor);

// Get lists for dropdowns
router.get('/layouts/list', getLayoutsList);
router.get('/routes/list', getRoutesList);

// Get all vehicles with pagination
router.get('/', getAllVehicles);

// Get vehicle by ID
router.get('/:id', getVehicleById);

// Create new vessel — accepts up to 5 gallery images (field: vesselImages)
// plus the legacy single `vehicleImage` field for backwards compatibility.
const vesselUpload = upload.fields([
  { name: 'vesselImages', maxCount: 5 },
  { name: 'vehicleImage', maxCount: 1 },
]);

router.post('/', vesselUpload, createVehicle);

// Update vessel with image upload (same multi-image handling as create)
router.put('/:id', vesselUpload, updateVehicle);

// Delete vehicle
router.delete('/:id', deleteVehicle);

module.exports = router; 