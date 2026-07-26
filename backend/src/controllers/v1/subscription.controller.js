const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /admin/subscriptions - list all users with a Charter Pro subscription
const listSubscriptions = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { status } = req.query;
    const now = new Date();

    const where = { charterProSubscribedUntil: { not: null } };
    if (status === 'ACTIVE') {
      where.charterProSubscribedUntil = { gte: now };
    } else if (status === 'EXPIRED') {
      where.charterProSubscribedUntil = { lt: now };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { charterProSubscribedUntil: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        charterProSubscribedUntil: true,
        createdAt: true,
      },
    });

    // Basic revenue estimate for the current month, based on setting price (MVR only).
    const priceSetting = await prisma.setting.findUnique({
      where: { keyName: 'CHARTER_PRO_PRICE_MVR' },
    });
    const priceMvr = Number(priceSetting?.value || 500);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Approx: any subscription whose expiry falls in current month is counted as "renewed/paid this month"
    const paidThisMonthCount = await prisma.user.count({
      where: {
        charterProSubscribedUntil: {
          gte: startOfMonth,
          lt: new Date(endOfMonth.getTime() + 31 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const activeCount = users.filter(
      (u) => u.charterProSubscribedUntil && new Date(u.charterProSubscribedUntil) >= now
    ).length;
    const expiredThisMonthCount = users.filter((u) => {
      const d = u.charterProSubscribedUntil ? new Date(u.charterProSubscribedUntil) : null;
      return d && d < now && d >= startOfMonth;
    }).length;

    return res.json({
      success: true,
      data: {
        users,
        stats: {
          activeCount,
          expiredThisMonthCount,
          // MVR only - Charter Pro is priced in MVR. Never combine with USD.
          revenueMvrThisMonth: paidThisMonthCount * priceMvr,
          priceMvr,
        },
      },
    });
  } catch (error) {
    console.error('listSubscriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listSubscriptions };
