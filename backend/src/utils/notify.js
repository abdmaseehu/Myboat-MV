/**
 * Fire-and-forget notification helper.
 *
 * Never throws: a failed notification must never break the request that
 * triggered it. Errors are logged and swallowed.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {Object}  payload
 * @param {string}  payload.userId      - recipient User.id (required)
 * @param {string} [payload.type]       - NotificationType enum value
 * @param {string}  payload.title
 * @param {string} [payload.body]
 * @param {string} [payload.link]       - in-app path, e.g. "/users/my-requests"
 * @param {string} [payload.entityType] - "CHARTER_REQUEST" | "LOGISTICS_REQUEST" | "BOOKING"
 * @param {string} [payload.entityId]
 * @returns {Promise<Object|null>} the created notification, or null on failure
 */
async function notify(prisma, { userId, type, title, body, link, entityType, entityId } = {}) {
  try {
    if (!prisma || !userId || !title) return null;

    return await prisma.notification.create({
      data: {
        userId,
        type: type || 'GENERAL',
        title,
        body: body || null,
        link: link || null,
        entityType: entityType || null,
        entityId: entityId || null,
      },
    });
  } catch (error) {
    // Swallow — notifications are best-effort.
    console.error('[notify] failed to create notification:', error?.message || error);
    return null;
  }
}

/**
 * Resolve the User.id that owns a vendor, so we can notify the operator.
 * Returns null (never throws) if the vendor cannot be resolved.
 */
async function getVendorUserId(prisma, vendorId) {
  try {
    if (!vendorId) return null;
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });
    return vendor?.userId || null;
  } catch (error) {
    console.error('[notify] failed to resolve vendor user:', error?.message || error);
    return null;
  }
}

/**
 * Notify every active administrator.
 *
 * Used for requests aimed at Myboat staff rather than a specific operator —
 * there is no single "admin user", so all of them are told.
 *
 * Best-effort like notify(): never throws, returns how many were created.
 */
async function notifyAdmins(prisma, payload = {}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', active: true },
      select: { id: true },
    });
    const sent = await Promise.all(
      admins.map((a) => notify(prisma, { ...payload, userId: a.id }))
    );
    return sent.filter(Boolean).length;
  } catch (error) {
    console.error('[notify] failed to notify admins:', error?.message || error);
    return 0;
  }
}

module.exports = { notify, getVendorUserId, notifyAdmins };
