const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /notifications?unreadOnly=true&limit=30
const getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly, limit } = req.query;
    const take = Math.min(parseInt(limit, 10) || 30, 100);

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('getMyNotifications error', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
};

// GET /notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('getUnreadCount error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/:id/read
const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('markRead error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/read-all
const markAllRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    console.error('markAllRead error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
