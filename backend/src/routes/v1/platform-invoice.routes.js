const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  listInvoices,
  markReceived,
} = require('../../controllers/v1/platform-invoice.controller');

router.use(isAuthenticated);

// Operators see their own; administrators see everyone's. The controller
// decides which, since the route is the same.
router.get('/', listInvoices);

// Only Myboat can say Myboat has been paid.
router.post('/:id/mark-received', isAdmin, markReceived);

module.exports = router;
