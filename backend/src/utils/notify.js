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

module.exports = { notify, getVendorUserId };
