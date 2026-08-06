const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getPageBySlug,
  listPublishedPages,
  listPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
} = require('../../controllers/v1/custom-page.controller');

/**
 * Two routers, because the two audiences are different.
 *
 * Reading a published page is public — that is the whole point of publishing
 * it. Writing one means writing raw HTML that every visitor's browser will
 * execute, so it is administrators only.
 */
const publicRouter = express.Router();
const adminRouter = express.Router();

// Listed before the wildcard, or '/pages' would be read as a page named ''.
publicRouter.get('/', listPublishedPages);
// Express 4 puts a wildcard match in params[0]; multi-level paths arrive whole.
publicRouter.get('/*', getPageBySlug);

adminRouter.use(isAuthenticated, isAdmin);
adminRouter.get('/', listPages);
adminRouter.get('/:id', getPageById);
adminRouter.post('/', createPage);
adminRouter.patch('/:id', updatePage);
adminRouter.delete('/:id', deletePage);

module.exports = { publicRouter, adminRouter };
