const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * The site footer, as raw HTML.
 *
 * Two settings rather than a table: there is exactly one footer, and a table
 * with one row that can never have two is a table pretending to be a setting.
 * `settings.value` is unbounded text, so a whole footer fits.
 *
 * The built-in React footer stays in the codebase and stays the default. A
 * custom footer replaces it only when there is one and it has been switched
 * on — so an empty box or a half-finished paste never blanks the bottom of
 * every page.
 */

const KEYS = {
  mode: 'FOOTER_MODE',
  html: 'FOOTER_HTML',
};

const MODES = ['DEFAULT', 'CUSTOM'];

const footerSchema = z.object({
  mode: z.enum(MODES).optional(),
  html: z.string().max(200_000, 'That footer is too large').optional().nullable(),
});

const read = async () => {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: Object.values(KEYS) } },
    select: { keyName: true, value: true },
  });
  const get = (k) => rows.find((r) => r.keyName === k)?.value;

  const html = get(KEYS.html) || '';
  const mode = String(get(KEYS.mode) || 'DEFAULT').toUpperCase() === 'CUSTOM' ? 'CUSTOM' : 'DEFAULT';

  return {
    mode,
    html,
    // What the site will actually do, so the renderer needs no rules of its own.
    active: mode === 'CUSTOM' && html.trim().length > 0,
  };
};

const write = (keyName, value, description) =>
  prisma.setting.upsert({
    where: { keyName },
    update: { value: String(value) },
    create: { keyName, value: String(value), type: 'TEXT', description },
  });

// GET /footer — what every visitor's page bottom is built from
const getFooter = async (req, res) => {
  try {
    const footer = await read();
    return res.json({
      success: true,
      message: 'Footer retrieved',
      // A visitor has no use for a draft they are not being shown.
      data: footer.active
        ? { active: true, html: footer.html }
        : { active: false, html: '' },
    });
  } catch (error) {
    console.error('getFooter error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/footer — the draft too, whether or not it is live
const getFooterAdmin = async (req, res) => {
  try {
    return res.json({ success: true, message: 'Footer retrieved', data: await read() });
  } catch (error) {
    console.error('getFooterAdmin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/footer
const updateFooter = async (req, res) => {
  try {
    const data = footerSchema.parse(req.body || {});

    const writes = [];
    if (data.mode !== undefined) {
      writes.push(write(KEYS.mode, data.mode, 'Site footer: DEFAULT or CUSTOM'));
    }
    if (data.html !== undefined) {
      // Saving the box empty is how you clear it, so blank is a real value
      // here rather than "leave it alone".
      writes.push(write(KEYS.html, data.html ?? '', 'Site footer: raw HTML'));
    }

    if (writes.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    await Promise.all(writes);

    const footer = await read();
    return res.json({
      success: true,
      message:
        footer.mode === 'CUSTOM' && !footer.active
          ? 'Saved — but the custom footer is empty, so the built-in one is still showing'
          : 'Footer saved',
      data: footer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    console.error('updateFooter error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFooter, getFooterAdmin, updateFooter };
