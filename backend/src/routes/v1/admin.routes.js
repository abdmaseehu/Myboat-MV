const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const { listSubscriptions } = require('../../controllers/v1/subscription.controller');

router.use(isAuthenticated, isAdmin);

router.get('/subscriptions', listSubscriptions);

module.exports = router;
