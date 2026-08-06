const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getMenu,
  listItems,
  createItem,
  updateItem,
  reorderItems,
  deleteItem,
} = require('../../controllers/v1/nav-menu.controller');

/**
 * Reading the navigation is public — every visitor's header depends on it.
 * Changing it is administrators only.
 */
const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/', getMenu);

adminRouter.use(isAuthenticated, isAdmin);
adminRouter.get('/', listItems);
adminRouter.post('/', createItem);
// Before /:id, or 'reorder' is read as an id.
adminRouter.post('/reorder', reorderItems);
adminRouter.patch('/:id', updateItem);
adminRouter.delete('/:id', deleteItem);

module.exports = { publicRouter, adminRouter };
