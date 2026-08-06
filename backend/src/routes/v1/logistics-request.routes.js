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
  getPaymentInfo,
  markPaid,
  submitOrder,
  getSlipUrl,
} = require('../../controllers/v1/logistics-request.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const uploadSlip = require('../../config/upload-slip');

router.use(isAuthenticated);

router.get('/all', isAdmin, getAllRequests);
router.get('/requested-by-me', getRequestsIRequested);
router.get('/', getMyRequests);
router.get('/:id/payment-info', getPaymentInfo);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.post('/:id/mark-paid', markPaid);
/**
 * The slip is the submission: multipart, one file.
 *
 * Multer rejects by throwing, which lands in the generic error handler as a
 * 500 — a wrong file type is the customer's mistake, not ours, and they need
 * to be told which. Wrapped so the message survives.
 */
router.post(
  '/:id/submit-order',
  (req, res, next) =>
    uploadSlip.raw.single('slip')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'That file is over 5 MB — try a photo or a smaller scan'
          : err.message || 'Could not read that file';
      return res.status(400).json({ success: false, message });
    }),
  uploadSlip.persistSlip,
  submitOrder
);

// The slip carries the customer's bank details, so it is never a public URL.
// This hands back a short-lived signed link, and only to someone entitled to it.
router.get('/:id/slip', getSlipUrl);
router.patch('/:id/quote', sendQuote);
router.patch('/:id', updateRequest);
router.delete('/:id', deleteRequest);

module.exports = router;
