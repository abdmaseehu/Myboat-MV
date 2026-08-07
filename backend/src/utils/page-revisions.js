/**
 * Snapshotting a page before something overwrites it.
 *
 * One function, used by the editor and by any bulk script, because the script
 * is the dangerous one: an edit changes a page someone is looking at, while a
 * migration rewrites every page at once with nobody watching. This CMS has
 * already lost a <style> block that way.
 */

/** How many versions of a page to keep. */
const KEEP_PER_PAGE = 20;

const SNAPSHOT_FIELDS = [
  'title',
  'slug',
  'htmlContent',
  'metaTitle',
  'metaDescription',
  'featuredImageUrl',
  'schemaJson',
  'isPublished',
];

/**
 * Record a page as it is now.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} page      the row as it stands, before the change
 * @param {object} [o]
 * @param {'EDIT'|'DELETE'|'RESTORE'|'BULK'} [o.reason]
 * @param {string} [o.userId]
 */
async function snapshotPage(prisma, page, { reason = 'EDIT', userId = null } = {}) {
  if (!page?.id) return null;

  const data = { pageId: page.id, reason, createdById: userId || null };
  SNAPSHOT_FIELDS.forEach((f) => {
    data[f] = page[f] ?? null;
  });
  // NOT NULL in the table, and a page can always name itself.
  data.title = page.title || '(untitled)';
  data.slug = page.slug || page.id;
  data.isPublished = page.isPublished ?? true;

  const revision = await prisma.pageRevision.create({ data });
  await pruneRevisions(prisma, page.id);
  return revision;
}

/**
 * Keep the most recent few and drop the rest.
 *
 * A DELETE snapshot is never pruned: it is the only record that a page existed
 * at all, and losing it turns "restore the page someone deleted" back into
 * "retype the page someone deleted".
 */
async function pruneRevisions(prisma, pageId) {
  const keepable = await prisma.pageRevision.findMany({
    where: { pageId, reason: { not: 'DELETE' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
    skip: KEEP_PER_PAGE,
  });
  if (keepable.length === 0) return 0;
  const { count } = await prisma.pageRevision.deleteMany({
    where: { id: { in: keepable.map((r) => r.id) } },
  });
  return count;
}

/** The fields a restore writes back. Never id, never timestamps. */
const revisionToPage = (revision) => {
  const page = {};
  SNAPSHOT_FIELDS.forEach((f) => {
    page[f] = revision[f];
  });
  return page;
};

module.exports = { snapshotPage, pruneRevisions, revisionToPage, SNAPSHOT_FIELDS, KEEP_PER_PAGE };
