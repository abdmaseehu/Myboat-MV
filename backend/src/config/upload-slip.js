/**
 * Uploads for bank transfer slips.
 *
 * Separate from the image uploader because a slip is usually a PDF from a
 * banking app, and the shared config accepts images only. Everything else
 * matches: same directory, same served path, same size ceiling.
 *
 * Note: this writes to the container's own disk, which does not survive a
 * redeploy. The database keeps the filename, the amount, the reference and the
 * time, so the payment record outlives the image — but the image itself needs
 * object storage before slips can be treated as durable evidence.
 */
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `slip-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP|pdf|PDF)$/)) {
    req.fileValidationError = 'Slip must be an image or a PDF';
    return cb(new Error('Slip must be an image or a PDF'), false);
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
