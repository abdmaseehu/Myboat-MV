const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * The public site's navigation.
 *
 * These links used to be an array in the header component, so adding one meant
 * a deploy. Since an administrator can now write pages without one, they need
 * to be able to link to them without one either.
 *
 * Order is sparse — 10, 20, 30 — so moving a single item rewrites a single
 * row. Reordering the whole menu still sends the whole list, because a drag
 * that half-applies is worse than one that fails.
 */

const LOCATIONS = ['HEADER', 'FOOTER'];

const itemSchema = z.object({
  label: z.string().min(1, 'Label is required').max(80, 'Label is too long'),
  url: z.string().min(1, 'Link is required').max(255, 'Link is too long'),
  location: z.enum(LOCATIONS).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isVisible: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
});

const updateSchema = itemSchema.partial();

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Nothing to reorder'),
});

const zodMessage = (error) =>
  error.errors.map((e) => `${e.path.join('.') || 'form'}: ${e.message}`).join('; ');

/**
 * Tidy a link without deciding what it means.
 *
 * An external URL keeps its scheme; anything else is treated as a site path
 * and given the leading slash an author usually forgets. Guessing further —
 * prefixing 'www.' with https://, say — would rewrite links that were correct.
 */
const normaliseUrl = (raw) => {
  const url = String(raw || '').trim();
  if (!url) return url;
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

/* ------------------------------- public ---------------------------------- */

// GET /nav?location=HEADER — visible links only, in order
const getMenu = async (req, res) => {
  try {
    const location = String(req.query.location || 'HEADER').toUpperCase();
    if (!LOCATIONS.includes(location)) {
      return res.status(400).json({ success: false, message: 'Unknown menu location' });
    }

    const items = await prisma.navMenuItem.findMany({
      where: { location, isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, label: true, url: true, openInNewTab: true },
    });

    return res.json({ success: true, message: 'Menu retrieved', data: items });
  } catch (error) {
    console.error('getMenu error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- admin ---------------------------------- */

// GET /admin/nav — every link, hidden ones included
const listItems = async (req, res) => {
  try {
    const where = req.query.location
      ? { location: String(req.query.location).toUpperCase() }
      : {};
    const items = await prisma.navMenuItem.findMany({
      where,
      orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return res.json({ success: true, message: 'Menu items retrieved', data: items });
  } catch (error) {
    console.error('listItems error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/nav
const createItem = async (req, res) => {
  try {
    const data = itemSchema.parse(req.body || {});
    data.url = normaliseUrl(data.url);
    const location = data.location || 'HEADER';

    // A new link goes to the end unless it was given a position.
    if (data.sortOrder === undefined) {
      const last = await prisma.navMenuItem.findFirst({
        where: { location },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      data.sortOrder = (last?.sortOrder ?? 0) + 10;
    }

    const item = await prisma.navMenuItem.create({ data: { ...data, location } });
    return res.status(201).json({ success: true, message: 'Link added', data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: `Validation error — ${zodMessage(error)}` });
    }
    console.error('createItem error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /admin/nav/:id
const updateItem = async (req, res) => {
  try {
    const data = updateSchema.parse(req.body || {});
    if (data.url !== undefined) data.url = normaliseUrl(data.url);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    const item = await prisma.navMenuItem.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, message: 'Link updated', data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: `Validation error — ${zodMessage(error)}` });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }
    console.error('updateItem error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /admin/nav/reorder — the whole list, in its new order.
 *
 * One transaction: a menu that reordered halfway would leave two links
 * claiming the same position and no way to tell which was intended.
 */
const reorderItems = async (req, res) => {
  try {
    const { ids } = reorderSchema.parse(req.body || {});
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.navMenuItem.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } })
      )
    );
    return res.json({ success: true, message: 'Menu reordered' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: `Validation error — ${zodMessage(error)}` });
    }
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'One of those links no longer exists' });
    }
    console.error('reorderItems error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /admin/nav/:id
const deleteItem = async (req, res) => {
  try {
    await prisma.navMenuItem.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Link removed' });
  } catch (error) {
    // Already gone is the same end state as removed.
    if (error.code === 'P2025') {
      return res.json({ success: true, message: 'Link already removed' });
    }
    console.error('deleteItem error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMenu,
  listItems,
  createItem,
  updateItem,
  reorderItems,
  deleteItem,
};
