/**
 * Image uploads.
 *
 * Files are held in memory and then handed to the storage layer, which decides
 * whether they belong in a bucket or on the local disk. Controllers still read
 * `file.filename` and store that, exactly as they did when multer wrote
 * straight to disk — the key is the same either way, so no existing row or
 * call site had to change.
 *
 * `.single()` and `.fields()` return a pair of middleware rather than one.
 * Express flattens arrays in that position, so every existing route keeps
 * working while gaining the persistence step it now needs.
 */
const multer = require('multer');
const path = require('path');
const { putObject } = require('../utils/storage');

const MAX_BYTES = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const base = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

/** Same shape multer's disk storage produced: fieldname-timestamp-random.ext */
const keyFor = (file) => {
  const ext = path.extname(file.originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${file.fieldname}-${unique}${ext}`;
};

/** Everything multer parsed, flattened out of whichever shape it used. */
const collect = (req) => {
  if (req.file) return [req.file];
  if (!req.files) return [];
  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

const persist = (visibility) => async (req, res, next) => {
  try {
    const files = collect(req);
    for (const file of files) {
      file.filename = await putObject({
        buffer: file.buffer,
        filename: keyFor(file),
        contentType: file.mimetype,
        visibility,
      });
      // The buffer has served its purpose and would otherwise sit in memory
      // for the rest of the request.
      delete file.buffer;
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Multer rejects by throwing, which lands in the generic error handler as a
 * 500. A wrong file type or an oversized photo is the uploader's mistake, not
 * the server's, and they need to be told which.
 */
const translateErrors = (mw) => (req, res, next) =>
  mw(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That image is over 5 MB — try a smaller one'
        : err.message || 'Could not read that file';
    return res.status(400).json({ success: false, message });
  });

const wrap = (method, visibility = 'public') => (...args) =>
  [translateErrors(base[method](...args)), persist(visibility)];

module.exports = {
  single: wrap('single'),
  fields: wrap('fields'),
  array: wrap('array'),
  none: (...args) => base.none(...args),
  // For callers that need the raw multer instance, or a private destination.
  raw: base,
  persist,
  keyFor,
  MAX_BYTES,
};
