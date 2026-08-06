const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isVendor, isAdmin, hasRole } = require('../../middleware/role.middleware');
const {
  getMyAgents,
  inviteAgent,
  updateAgent,
  deleteAgent,
  getAllAgents,
  applyToOperator,
  getMyPartnerships,
  getMyTermsForOperator,
  getPendingRequests,
  approveAgent,
  rejectAgent,
  suspendAgentGlobally,
  reinstateAgentGlobally,
} = require('../../controllers/v1/operator-agent.controller');

// Everything below needs a session.
router.use(isAuthenticated);

// ---------------------------------------------------------------- admin only
// Declared before the vendor gate, and before any ':id' route that would
// otherwise swallow these paths.
router.get('/all', isAdmin, getAllAgents);
router.post('/admin/:userId/suspend', isAdmin, suspendAgentGlobally);
router.post('/admin/:userId/reinstate', isAdmin, reinstateAgentGlobally);

// ---------------------------------------------------------------- agent side
// An operator can also hold an agent relationship with another operator, so
// VENDOR is permitted here rather than AGENT alone.
router.post('/apply', hasRole(['AGENT', 'VENDOR']), applyToOperator);
router.get('/my-partnerships', hasRole(['AGENT', 'VENDOR']), getMyPartnerships);
router.get('/terms', hasRole(['AGENT', 'VENDOR']), getMyTermsForOperator);

// ------------------------------------------------------------- operator side
router.use(isVendor);

router.get('/', getMyAgents);
router.get('/requests', getPendingRequests);
router.post('/', inviteAgent);
router.post('/:id/approve', approveAgent);
router.post('/:id/reject', rejectAgent);
router.patch('/:id', updateAgent);
router.delete('/:id', deleteAgent);

module.exports = router;
