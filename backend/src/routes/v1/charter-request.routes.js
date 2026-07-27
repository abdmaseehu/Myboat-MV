const express = require('express');
const router = express.Router();
const {
  getMyRequests,
  getRequestsIRequested,
  getRequestById,
  createRequest,
  sendQuote,
  updateRequest,
  deleteRequest,
  getAllRequests,
} = require('../../controllers/v1/charter-request.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');

router.use(isAuthenticated);

router.get('/all', isAdmin, getAllRequests);
router.get('/requested-by-me', getRequestsIRequested);
router.get('/', getMyRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.patch('/:id/quote', sendQuote);
router.patch('/:id', updateRequest);
router.delete('/:id', deleteRequest);

module.exports = router;
