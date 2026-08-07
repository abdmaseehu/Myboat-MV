const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getFooter,
  getFooterAdmin,
  updateFooter,
} = require('../../controllers/v1/site-footer.controller');

/**
 * Reading the footer is public — it is on the bottom of every page. Writing it
 * is administrators only, because it is raw HTML that runs in every visitor's
 * browser.
 */
const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/', getFooter);

adminRouter.use(isAuthenticated, isAdmin);
adminRouter.get('/', getFooterAdmin);
adminRouter.post('/', updateFooter);

module.exports = { publicRouter, adminRouter };
