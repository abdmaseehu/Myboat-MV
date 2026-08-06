const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getCommissionConfig,
  updateGlobalCommission,
  updateCharterCommission,
  getRouteMarkupHandler,
  upsertRouteMarkup,
  deleteRouteMarkup,
} = require('../../controllers/v1/commission.controller');

// Platform economics are the administrator's to set — operators must not be
// able to read or change the cut taken from them.
router.use(isAuthenticated, isAdmin);

router.get('/', getCommissionConfig);
router.post('/global', updateGlobalCommission);
router.post('/charter', updateCharterCommission);

// Static segment first so "route" is never matched as a markup id.
router.get('/route/:routeId', getRouteMarkupHandler);
router.post('/route', upsertRouteMarkup);
router.delete('/route/:routeId', deleteRouteMarkup);

module.exports = router;
