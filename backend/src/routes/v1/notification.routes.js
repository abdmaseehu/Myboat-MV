const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require('../../controllers/v1/notification.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');

router.use(isAuthenticated);

router.get('/unread-count', getUnreadCount);
router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
