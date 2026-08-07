const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { sanitizeCmsHtml } = require('../../utils/sanitize-html');
const {
  snapshotPage,
  revisionToPage,
  KEEP_PER_PAGE,
} = require('../../utils/page-revisions');

const prisma = new PrismaClient();

/**
 * Editorial pages written from the admin dashboard.
 *
 * The body is raw HTML by design — the module exists so an administrator can
 * paste a layout with its own styles and widgets, which a rich-text field
 * would strip. That HTML is rendered unescaped, so authoring is an
 * administrator-only capability and the write endpoints sit behind isAdmin.
 *
 * A slug is a whole path, not a segment. 'maldives/kaafu-atoll/huraa-guide' is
 * one row, and the catch-all route hands back exactly the string this column
 * is indexed on.
 */

/**
 * Reduce anything an author types to the one canonical form of a path.
 *
 * Authors paste '/Maldives/Kaafu Atoll/', 'maldives//kaafu-atoll' and
 * 'maldives/kaafu-atoll' meaning the same page; without this they would be
 * three different rows and the unique index would not catch it. Spaces become
 * hyphens rather than being rejected, because a pasted title is the most
 * common thing to land in this field.
 */
const normaliseSlug = (raw) =>
  String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .split('/')
    .map((segment) =>
      segment
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    )
    .filter(Boolean)
    .join('/');

const slugField = z
  .string()
  .min(1, 'Slug is required')
  .transform(normaliseSlug)
  .refine((s) => s.length > 0, 'Slug must contain letters or numbers')
  .refine((s) => s.length <= 255, 'Slug is too long');

/**
 * JSON-LD is stored as typed, but it is validated before it can be saved:
 * malformed markup in a page's head is worse than an error at the point of
 * writing it, because nothing on the page looks wrong.
 */
const schemaJsonField = z
  .string()
  .optional()
  .nullable()
  .refine((v) => {
    if (v === undefined || v === null || String(v).trim() === '') return true;
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  }, 'Structured data must be valid JSON');

const optionalText = z.string().optional().nullable();

/**
 * A featured image is either somewhere else on the web or somewhere on this
 * site. Anything else — a bare filename, a javascript: URL — is a mistake or
 * an attack, and this value ends up in an og:image tag where neither belongs.
 */
const imageUrlField = z
  .string()
  .max(500, 'That image URL is too long')
  .optional()
  .nullable()
  .refine(
    (v) =>
      v === undefined ||
      v === null ||
      String(v).trim() === '' ||
      /^(https?:\/\/|\/)/i.test(String(v).trim()),
    'Image must be a full https:// address or a path starting with /'
  );

/**
 * Slugs a real route already answers.
 *
 * Pages are served from the site root, so a page whose slug matches a route is
 * never reached — the more specific route always wins. Without this check the
 * page would sit in the dashboard looking published while being invisible to
 * everyone, which is a worse outcome than being told no.
 *
 * `charter` is the exception: that route reads its page and renders the copy,
 * so creating one is the intended way to edit it. As other routes are wired to
 * the CMS they move from the blocked list into this one.
 */
const ATTACHED_SLUGS = {
  charter: '/charter',
  logistics: '/logistics',
};

const TAKEN_SLUGS = new Set([
  'about', 'admin', 'agent', 'api', 'auth', 'contact', 'dashboard', 'embed',
  'favicon.ico', 'ferry', 'health', 'o', 'pages', 'robots.txt',
  'services', 'sitemap.xml', 'uploads', 'users', '_next',
]);

/** The reason a slug cannot be used, or null when it is free. */
const slugConflict = (slug) => {
  const first = String(slug || '').split('/')[0].toLowerCase();
  if (!first) return null;
  if (ATTACHED_SLUGS[first]) return null;
  if (TAKEN_SLUGS.has(first)) {
    return `"${first}" is already a page on the site, so nothing saved here would be reachable. Pick a different path.`;
  }
  return null;
};

// Absent means "leave it alone" on an update, so no field carries a default —
// a default here would blank every field the form did not send.
const pageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  slug: slugField,
  htmlContent: optionalText,
  metaTitle: z.string().max(255, 'Meta title is too long').optional().nullable(),
  metaDescription: optionalText,
  featuredImageUrl: imageUrlField,
  schemaJson: schemaJsonField,
  isPublished: z.boolean().optional(),
});

const updateSchema = pageSchema.partial();

const blankToNull = (v) => (v === undefined ? undefined : String(v ?? '').trim() === '' ? null : v);

/**
 * What the write endpoints accept, with empty strings read as "not set".
 *
 * The body is sanitised here rather than on the way out, so what is stored is
 * what is safe: nothing downstream has to remember to clean it, and a page
 * read straight from the database by some future report or export cannot
 * carry a payload.
 *
 * Returns what was stripped alongside the row, so the author is told rather
 * than silently handed back something different from what they wrote.
 */
const toRow = (data) => {
  const row = { ...data };
  ['htmlContent', 'metaTitle', 'metaDescription', 'featuredImageUrl', 'schemaJson'].forEach((k) => {
    if (k in row) row[k] = blankToNull(row[k]);
  });

  let stripped = [];
  if (row.htmlContent) {
    const { clean, removed } = sanitizeCmsHtml(row.htmlContent);
    row.htmlContent = clean;
    stripped = removed;
  }
  return { row, stripped };
};

/** A sentence an author can act on, or nothing when nothing was touched. */
const strippedNote = (stripped) =>
  stripped.length
    ? ` — ${stripped.slice(0, 6).join(', ')} ${stripped.length === 1 ? 'was' : 'were'} removed as unsafe`
    : '';

const zodMessage = (error) =>
  error.errors.map((e) => `${e.path.join('.') || 'form'}: ${e.message}`).join('; ');

/* ------------------------------- public ---------------------------------- */

/**
 * GET /pages/*  — the page behind a path.
 *
 * Express hands a wildcard back in params[0]; a catch-all client may instead
 * send segments. Both reduce to the same string, which is what the column
 * holds.
 */
const getPageBySlug = async (req, res) => {
  try {
    const raw = req.params.slug ?? req.params[0] ?? '';
    const joined = Array.isArray(raw) ? raw.join('/') : raw;
    const slug = normaliseSlug(joined);

    if (!slug) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const page = await prisma.customPage.findUnique({ where: { slug } });

    // An unpublished page is a 404 to the public, not a 403: saying "this
    // exists but you may not see it" tells an anonymous visitor what drafts
    // are named.
    if (!page || !page.isPublished) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    return res.json({ success: true, message: 'Page retrieved', data: page });
  } catch (error) {
    console.error('getPageBySlug error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /pages — published paths only, for sitemaps and link pickers. */
const listPublishedPages = async (req, res) => {
  try {
    const pages = await prisma.customPage.findMany({
      where: { isPublished: true },
      select: { slug: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, message: 'Pages retrieved', data: pages });
  } catch (error) {
    console.error('listPublishedPages error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- admin ---------------------------------- */

// GET /admin/pages
const listPages = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const pages = await prisma.customPage.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      // The body can be very large and the table never shows it.
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        featuredImageUrl: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, message: 'Pages retrieved', data: pages });
  } catch (error) {
    console.error('listPages error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/pages/:id — the whole row, body included, for the editor
const getPageById = async (req, res) => {
  try {
    const page = await prisma.customPage.findUnique({ where: { id: req.params.id } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    return res.json({ success: true, message: 'Page retrieved', data: page });
  } catch (error) {
    console.error('getPageById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/pages
const createPage = async (req, res) => {
  try {
    const { row, stripped } = toRow(pageSchema.parse(req.body || {}));

    const conflict = slugConflict(row.slug);
    if (conflict) {
      return res.status(409).json({ success: false, message: conflict });
    }

    const page = await prisma.customPage.create({ data: row });
    return res.status(201).json({
      success: true,
      message: `Page created${strippedNote(stripped)}`,
      data: page,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: `Validation error — ${zodMessage(error)}` });
    }
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, message: 'Another page already uses that path' });
    }
    console.error('createPage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /admin/pages/:id
const updatePage = async (req, res) => {
  try {
    const { row, stripped } = toRow(updateSchema.parse(req.body || {}));
    if (Object.keys(row).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    if (row.slug !== undefined) {
      const conflict = slugConflict(row.slug);
      if (conflict) {
        return res.status(409).json({ success: false, message: conflict });
      }
    }

    // The version being replaced, kept before it is replaced. Read from the
    // stored row rather than the request, so it is what was actually live.
    const before = await prisma.customPage.findUnique({ where: { id: req.params.id } });
    if (!before) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    await snapshotPage(prisma, before, { reason: 'EDIT', userId: req.user?.id });

    const page = await prisma.customPage.update({ where: { id: req.params.id }, data: row });
    return res.json({
      success: true,
      message: `Page updated${strippedNote(stripped)}`,
      data: page,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: `Validation error — ${zodMessage(error)}` });
    }
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, message: 'Another page already uses that path' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    console.error('updatePage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /admin/pages/:id
const deletePage = async (req, res) => {
  try {
    // Snapshot first: this is the version most likely to be wanted back, and
    // once the row is gone there is nothing left to copy.
    const before = await prisma.customPage.findUnique({ where: { id: req.params.id } });
    if (before) {
      await snapshotPage(prisma, before, { reason: 'DELETE', userId: req.user?.id });
    }
    await prisma.customPage.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Page deleted - restorable from Deleted pages' });
  } catch (error) {
    // Already gone is the same end state as deleted.
    if (error.code === 'P2025') {
      return res.json({ success: true, message: 'Page already deleted' });
    }
    console.error('deletePage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------ revisions -------------------------------- */

// GET /admin/pages/:id/revisions - the history, without the bodies
const listRevisions = async (req, res) => {
  try {
    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: req.params.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        reason: true,
        createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
        // A body can be tens of kilobytes; the list only needs its size.
        htmlContent: true,
      },
    });

    return res.json({
      success: true,
      message: 'Revisions retrieved',
      data: revisions.map(({ htmlContent, ...r }) => ({
        ...r,
        contentLength: htmlContent ? htmlContent.length : 0,
      })),
      meta: { keptPerPage: KEEP_PER_PAGE },
    });
  } catch (error) {
    console.error('listRevisions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/pages/revisions/:revisionId - one version in full, to preview
const getRevision = async (req, res) => {
  try {
    const revision = await prisma.pageRevision.findUnique({
      where: { id: req.params.revisionId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision not found' });
    }
    return res.json({ success: true, message: 'Revision retrieved', data: revision });
  } catch (error) {
    console.error('getRevision error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /admin/pages/revisions/:revisionId/restore
 *
 * Puts a version back, snapshotting what it replaced on the way - restoring is
 * itself an overwrite, and undoing a restore is a thing people need.
 *
 * Also brings back a deleted page: the row is recreated from the snapshot,
 * which is precisely why a DELETE revision is never pruned.
 */
const restoreRevision = async (req, res) => {
  try {
    const revision = await prisma.pageRevision.findUnique({
      where: { id: req.params.revisionId },
    });
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision not found' });
    }

    const current = await prisma.customPage.findUnique({ where: { id: revision.pageId } });
    const fields = revisionToPage(revision);

    if (current) {
      await snapshotPage(prisma, current, { reason: 'RESTORE', userId: req.user?.id });
      const page = await prisma.customPage.update({
        where: { id: revision.pageId },
        data: fields,
      });
      return res.json({
        success: true,
        message: 'Restored the version from ' + new Date(revision.createdAt).toISOString(),
        data: page,
      });
    }

    // The page is gone: recreate it, keeping its id so its history follows it.
    const clash = await prisma.customPage.findUnique({ where: { slug: fields.slug } });
    if (clash) {
      return res.status(409).json({
        success: false,
        message: 'Another page now uses the path /' + fields.slug + '. Change that one first.',
      });
    }

    const page = await prisma.customPage.create({
      data: { id: revision.pageId, ...fields },
    });
    return res.status(201).json({ success: true, message: 'Page restored', data: page });
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, message: 'Another page already uses that path' });
    }
    console.error('restoreRevision error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /admin/pages/deleted - pages that no longer exist but can come back.
 *
 * A DELETE snapshot whose page id no longer resolves. Deleting and recreating
 * the same path is normal, so the check is on the id, not the slug.
 */
const listDeletedPages = async (req, res) => {
  try {
    const deletions = await prisma.pageRevision.findMany({
      where: { reason: 'DELETE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        pageId: true,
        title: true,
        slug: true,
        createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (deletions.length === 0) {
      return res.json({ success: true, message: 'No deleted pages', data: [] });
    }

    const live = await prisma.customPage.findMany({
      where: { id: { in: deletions.map((d) => d.pageId) } },
      select: { id: true },
    });
    const liveIds = new Set(live.map((page) => page.id));

    // One entry per page: its most recent deletion.
    const seen = new Set();
    const data = deletions.filter((d) => {
      if (liveIds.has(d.pageId) || seen.has(d.pageId)) return false;
      seen.add(d.pageId);
      return true;
    });

    return res.json({ success: true, message: 'Deleted pages retrieved', data });
  } catch (error) {
    console.error('listDeletedPages error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listRevisions,
  getRevision,
  restoreRevision,
  listDeletedPages,
  getPageBySlug,
  listPublishedPages,
  listPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  normaliseSlug,
};
