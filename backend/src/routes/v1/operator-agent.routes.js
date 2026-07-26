const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isVendor, isAdmin } = require('../../middleware/role.middleware');
const {
  getMyAgents,
  inviteAgent,
  updateAgent,
  deleteAgent,
  getAllAgents,
} = require('../../controllers/v1/operator-agent.controller');

// Admin-only oversight endpoint (must come before the vendor-gated middleware)
router.get('/all', isAuthenticated, isAdmin, getAllAgents);

router.use(isAuthenticated, isVendor);

router.get('/', getMyAgents);
router.post('/', inviteAgent);
router.patch('/:id', updateAgent);
router.delete('/:id', deleteAgent);

module.exports = router;
