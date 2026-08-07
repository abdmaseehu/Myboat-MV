const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const {
  listMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
} = require('../../controllers/v1/media.controller');

// The library is an authoring tool. The files it points at are public; the
// list of them, and the ability to add to it, are not.
router.use(isAuthenticated, isAdmin);

router.get('/', listMedia);
// Several at once: dragging a folder in is how a library gets filled.
router.post('/', upload.array('files', 20), uploadMedia);
router.patch('/:id', updateMedia);
router.delete('/:id', deleteMedia);

module.exports = router;
