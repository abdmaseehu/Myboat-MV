const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Platform commission and per-route markups.
 *
 * Three things stack onto a fare, in this order:
 *   1. the operator's own tier price (price_local_mvr / expat / tourist)
 *   2. the admin's flat markup for that route, if one is configured
 *   3. the global platform cut — a percentage, plus a flat fee
 *
 * Markups are per passenger tier and are flat amounts in that tier's currency,
 * because MVR and USD never mix. A percentage markup would need a currency to
 * be meaningful; a flat one does not.
 */

const SETTING_KEYS = {
  percentage: 'GLOBAL_PLATFORM_PERCENTAGE',
  flatFee: 'GLOBAL_PLATFORM_FLAT_FEE',
  flatFeeUsd: 'GLOBAL_PLATFORM_FLAT_FEE_USD',
  maxCommission: 'AGENT_MAX_COMMISSION_PERCENT',
  maxDiscount: 'AGENT_MAX_DISCOUNT_PERCENT',
};

const ZERO_MARKUP = {
  markupLocal: 0,
  markupExpat: 0,
  markupTourist: 0,
};

const money = z.coerce
  .number()
  .nonnegative('Value cannot be negative')
  .max(9_999_999.99, 'Value is too large');

const percentage = z.coerce
  .number()
  .nonnegative('Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

const globalSchema = z.object({
  globalPlatformPercentage: percentage.optional(),
  globalPlatformFlatFee: money.optional(),
  globalPlatformFlatFeeUsd: money.optional(),
  agentMaxCommissionPercent: percentage.optional(),
  agentMaxDiscountPercent: percentage.optional(),
});

const markupSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  markupLocal: money.default(0),
  markupExpat: money.default(0),
  markupTourist: money.default(0),
});

/** Read a numeric setting, treating missing or blank as the supplied default. */
const readNumber = (rows, key, fallback = 0) => {
  const raw = rows.find((r) => r.keyName === key)?.value;
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const loadGlobals = async () => {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: Object.values(SETTING_KEYS) } },
    select: { keyName: true, value: true },
  });
  return {
    globalPlatformPercentage: readNumber(rows, SETTING_KEYS.percentage, 0),
    globalPlatformFlatFee: readNumber(rows, SETTING_KEYS.flatFee, 0),
    globalPlatformFlatFeeUsd: readNumber(rows, SETTING_KEYS.flatFeeUsd, 0),
    agentMaxCommissionPercent: readNumber(rows, SETTING_KEYS.maxCommission, 25),
    agentMaxDiscountPercent: readNumber(rows, SETTING_KEYS.maxDiscount, 25),
  };
};

const writeSetting = (keyName, value, description) =>
  prisma.setting.upsert({
    where: { keyName },
    update: { value: String(value) },
    create: { keyName, value: String(value), type: 'NUMBER', description },
  });

/**
 * Markup for one route, or zeros when none is configured.
 *
 * This is the fallback rule: a route without a markup row is the normal case,
 * not a missing record. Callers always get numbers.
 */
const getRouteMarkup = async (routeId) => {
  if (!routeId) return { ...ZERO_MARKUP, configured: false };
  const row = await prisma.routeMarkup.findUnique({ where: { routeId } });
  if (!row) return { ...ZERO_MARKUP, configured: false };
  return {
    markupLocal: Number(row.markupLocal),
    markupExpat: Number(row.markupExpat),
    markupTourist: Number(row.markupTourist),
    configured: true,
  };
};

// GET /commissions — global settings plus every configured markup
const getCommissionConfig = async (req, res) => {
  try {
    const [globals, markups] = await Promise.all([
      loadGlobals(),
      prisma.routeMarkup.findMany({
        include: {
          route: {
            select: { id: true, sourceCity: true, destinationCity: true, serviceType: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Commission configuration retrieved',
      data: {
        global: globals,
        markups: markups.map((m) => ({
          id: m.id,
          routeId: m.routeId,
          route: m.route,
          markupLocal: Number(m.markupLocal),
          markupExpat: Number(m.markupExpat),
          markupTourist: Number(m.markupTourist),
          updatedAt: m.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('getCommissionConfig error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving commission config' });
  }
};

// POST /commissions/global — update the platform-wide cut and agent ceilings
const updateGlobalCommission = async (req, res) => {
  try {
    const data = globalSchema.parse(req.body || {});

    const writes = [];
    if (data.globalPlatformPercentage !== undefined) {
      writes.push(
        writeSetting(
          SETTING_KEYS.percentage,
          data.globalPlatformPercentage,
          'Platform cut taken from every booking, as a percentage'
        )
      );
    }
    if (data.globalPlatformFlatFee !== undefined) {
      writes.push(
        writeSetting(
          SETTING_KEYS.flatFee,
          data.globalPlatformFlatFee,
          'Flat platform fee added to every booking'
        )
      );
    }
    if (data.globalPlatformFlatFeeUsd !== undefined) {
      writes.push(
        writeSetting(
          SETTING_KEYS.flatFeeUsd,
          data.globalPlatformFlatFeeUsd,
          'Flat platform fee added to every USD booking'
        )
      );
    }
    if (data.agentMaxCommissionPercent !== undefined) {
      writes.push(
        writeSetting(
          SETTING_KEYS.maxCommission,
          data.agentMaxCommissionPercent,
          'Ceiling an operator may grant an agent as commission'
        )
      );
    }
    if (data.agentMaxDiscountPercent !== undefined) {
      writes.push(
        writeSetting(
          SETTING_KEYS.maxDiscount,
          data.agentMaxDiscountPercent,
          'Ceiling an operator may grant an agent as discount'
        )
      );
    }

    if (writes.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    await Promise.all(writes);
    return res.json({
      success: true,
      message: 'Global commission settings updated',
      data: await loadGlobals(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    console.error('updateGlobalCommission error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error updating commission settings' });
  }
};

// GET /commissions/route/:routeId — always resolves, zeros when unset
const getRouteMarkupHandler = async (req, res) => {
  try {
    const markup = await getRouteMarkup(req.params.routeId);
    return res.json({ success: true, message: 'Route markup retrieved', data: markup });
  } catch (error) {
    console.error('getRouteMarkup error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error retrieving route markup' });
  }
};

// POST /commissions/route — insert or update one route's markup
const upsertRouteMarkup = async (req, res) => {
  try {
    const data = markupSchema.parse(req.body || {});

    // Fail with a clear message rather than a foreign-key violation.
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
      select: { id: true },
    });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const row = await prisma.routeMarkup.upsert({
      where: { routeId: data.routeId },
      create: data,
      update: {
        markupLocal: data.markupLocal,
        markupExpat: data.markupExpat,
        markupTourist: data.markupTourist,
      },
      include: {
        route: { select: { id: true, sourceCity: true, destinationCity: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Route markup saved',
      data: {
        id: row.id,
        routeId: row.routeId,
        route: row.route,
        markupLocal: Number(row.markupLocal),
        markupExpat: Number(row.markupExpat),
        markupTourist: Number(row.markupTourist),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    console.error('upsertRouteMarkup error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error saving route markup' });
  }
};

// DELETE /commissions/route/:routeId — clearing a markup returns it to 0.00
const deleteRouteMarkup = async (req, res) => {
  try {
    await prisma.routeMarkup.delete({ where: { routeId: req.params.routeId } });
    return res.json({ success: true, message: 'Route markup cleared', data: ZERO_MARKUP });
  } catch (error) {
    // Already absent is the same end state as cleared.
    if (error.code === 'P2025') {
      return res.json({ success: true, message: 'No markup to clear', data: ZERO_MARKUP });
    }
    console.error('deleteRouteMarkup error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error clearing route markup' });
  }
};

module.exports = {
  getCommissionConfig,
  updateGlobalCommission,
  getRouteMarkupHandler,
  upsertRouteMarkup,
  deleteRouteMarkup,
  // shared with pricing code
  getRouteMarkup,
  loadGlobals,
};
