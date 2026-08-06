/**
 * Uploads for bank transfer slips.
 *
 * Separate from the image uploader on two counts. A slip is usually a PDF from
 * a banking app, which the image filter rejects; and it carries the customer's
 * account details, so it goes to the private bucket and is only ever served
 * through a signed URL minted for someone the server has authorised.
 */
const multer = require('multer');
const path = require('path');
const { putObject } = require('../utils/storage');

const MAX_BYTES = 5 * 1024 * 1024;

const base = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpe?g|png|webp|pdf)$/i)) {
      req.fileValidationError = 'Slip must be an image or a PDF';
      return cb(new Error('Slip must be an image or a PDF'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_BYTES },
});

const persistSlip = async (req, res, next) => {
  try {
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      req.file.filename = await putObject({
        buffer: req.file.buffer,
        filename: `slip-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
        contentType: req.file.mimetype,
        visibility: 'private',
      });
      delete req.file.buffer;
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  single: (field) => [base.single(field), persistSlip],
  raw: base,
  persistSlip,
  MAX_BYTES,
};
