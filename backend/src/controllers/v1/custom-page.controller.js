const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

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

/** What the write endpoints accept, with empty strings read as "not set". */
const toRow = (data) => {
  const row = { ...data };
  ['htmlContent', 'metaTitle', 'metaDescription', 'featuredImageUrl', 'schemaJson'].forEach((k) => {
    if (k in row) row[k] = blankToNull(row[k]);
  });
  return row;
};

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
    const data = toRow(pageSchema.parse(req.body || {}));
    const page = await prisma.customPage.create({ data });
    return res.status(201).json({ success: true, message: 'Page created', data: page });
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
    const data = toRow(updateSchema.parse(req.body || {}));
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    const page = await prisma.customPage.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, message: 'Page updated', data: page });
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
    await prisma.customPage.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    // Already gone is the same end state as deleted.
    if (error.code === 'P2025') {
      return res.json({ success: true, message: 'Page already deleted' });
    }
    console.error('deletePage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPageBySlug,
  listPublishedPages,
  listPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  normaliseSlug,
};
