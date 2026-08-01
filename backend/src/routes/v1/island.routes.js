const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getIslands,
  getAtolls,
  createIsland,
  updateIsland,
  deleteIsland,
} = require('../../controllers/v1/island.controller');

const router = express.Router();

// PUBLIC routes (no auth) - used by the operator dashboard and the public search form
router.get('/atolls', getAtolls);
router.get('/', getIslands);

// Admin-only master data management
router.post('/', isAuthenticated, isAdmin, createIsland);
router.put('/:id', isAuthenticated, isAdmin, updateIsland);
router.delete('/:id', isAuthenticated, isAdmin, deleteIsland);

module.exports = router;
