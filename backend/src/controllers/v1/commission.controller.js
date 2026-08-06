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

/**
 * Private charter is priced per trip, not per seat, and where Myboat's share
 * comes from depends on how the price was reached.
 *
 * A published rate is priced in advance, so the markup goes on top and the
 * operator still receives what they published — a percentage or a flat amount,
 * the flat one held per currency because MVR and USD never mix.
 *
 * A quote is a figure the operator has usually already given the customer, so
 * adding to it would change a price they were told. The commission comes out
 * of it instead. A commission is a share of a figure, so there is nothing flat
 * to configure.
 */
const CHARTER_KEYS = {
  live: {
    mode: 'CHARTER_LIVE_MARKUP_MODE',
    percent: 'CHARTER_LIVE_MARKUP_PERCENT',
    flatMvr: 'CHARTER_LIVE_MARKUP_FLAT_MVR',
    flatUsd: 'CHARTER_LIVE_MARKUP_FLAT_USD',
  },
  quote: { commissionPercent: 'CHARTER_QUOTE_COMMISSION_PERCENT' },
};

const ALL_CHARTER_KEYS = Object.values(CHARTER_KEYS).flatMap((g) => Object.values(g));

/**
 * Logistics takes both, because the customer pays the operator directly.
 *
 * The markup is added on top and paid by the customer; the commission comes out
 * of the operator's quote. The operator collects the whole public price into
 * their own account, so both parts together are what they owe Myboat once the
 * order completes — which is why logistics needs an invoice and charter, where
 * the split happens before the money moves, does not.
 */
const LOGISTICS_KEYS = {
  markupMode: 'LOGISTICS_MARKUP_MODE',
  markupPercent: 'LOGISTICS_MARKUP_PERCENT',
  markupFlatMvr: 'LOGISTICS_MARKUP_FLAT_MVR',
  markupFlatUsd: 'LOGISTICS_MARKUP_FLAT_USD',
  commissionPercent: 'LOGISTICS_COMMISSION_PERCENT',
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

const charterSchema = z.object({
  live: z
    .object({
      mode: z.enum(['PERCENT', 'FLAT']).optional(),
      percent: percentage.optional(),
      flatMvr: money.optional(),
      flatUsd: money.optional(),
    })
    .optional(),
  quote: z.object({ commissionPercent: percentage.optional() }).optional(),
});

const logisticsSchema = z.object({
  markupMode: z.enum(['PERCENT', 'FLAT']).optional(),
  markupPercent: percentage.optional(),
  markupFlatMvr: money.optional(),
  markupFlatUsd: money.optional(),
  commissionPercent: percentage.optional(),
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

/** Read a text setting, falling back when missing or blank. */
const readText = (rows, key, fallback) => {
  const raw = rows.find((r) => r.keyName === key)?.value;
  return raw === undefined || raw === null || String(raw).trim() === '' ? fallback : String(raw);
};

const loadCharter = async () => {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: ALL_CHARTER_KEYS } },
    select: { keyName: true, value: true },
  });
  const live = CHARTER_KEYS.live;
  return {
    live: {
      mode: readText(rows, live.mode, 'PERCENT').toUpperCase() === 'FLAT' ? 'FLAT' : 'PERCENT',
      percent: readNumber(rows, live.percent, 0),
      flatMvr: readNumber(rows, live.flatMvr, 0),
      flatUsd: readNumber(rows, live.flatUsd, 0),
    },
    quote: {
      commissionPercent: readNumber(rows, CHARTER_KEYS.quote.commissionPercent, 0),
    },
  };
};

const loadLogistics = async () => {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: Object.values(LOGISTICS_KEYS) } },
    select: { keyName: true, value: true },
  });
  return {
    markupMode:
      readText(rows, LOGISTICS_KEYS.markupMode, 'PERCENT').toUpperCase() === 'FLAT'
        ? 'FLAT'
        : 'PERCENT',
    markupPercent: readNumber(rows, LOGISTICS_KEYS.markupPercent, 0),
    markupFlatMvr: readNumber(rows, LOGISTICS_KEYS.markupFlatMvr, 0),
    markupFlatUsd: readNumber(rows, LOGISTICS_KEYS.markupFlatUsd, 0),
    commissionPercent: readNumber(rows, LOGISTICS_KEYS.commissionPercent, 0),
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
    const [globals, charter, logistics, markups] = await Promise.all([
      loadGlobals(),
      loadCharter(),
      loadLogistics(),
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
        charter,
        logistics,
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

// POST /commissions/charter — the private-charter dials
const updateCharterCommission = async (req, res) => {
  try {
    const data = charterSchema.parse(req.body || {});

    const writes = [];
    const live = data.live;
    if (live) {
      const k = CHARTER_KEYS.live;
      const where = 'Charter published rates';
      if (live.mode !== undefined) {
        writes.push(writeSetting(k.mode, live.mode, `${where}: PERCENT or FLAT`));
      }
      if (live.percent !== undefined) {
        writes.push(
          writeSetting(k.percent, live.percent, `${where}: markup as a % of the operator price`)
        );
      }
      if (live.flatMvr !== undefined) {
        writes.push(writeSetting(k.flatMvr, live.flatMvr, `${where}: flat markup on MVR trips`));
      }
      if (live.flatUsd !== undefined) {
        writes.push(writeSetting(k.flatUsd, live.flatUsd, `${where}: flat markup on USD trips`));
      }
    }

    if (data.quote?.commissionPercent !== undefined) {
      writes.push(
        writeSetting(
          CHARTER_KEYS.quote.commissionPercent,
          data.quote.commissionPercent,
          'Charter quotes: commission taken from the operator’s quoted amount, as a %'
        )
      );
    }

    if (writes.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    await Promise.all(writes);
    return res.json({
      success: true,
      message: 'Charter commission updated',
      data: await loadCharter(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    console.error('updateCharterCommission error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error updating charter commission' });
  }
};

// POST /commissions/logistics — markup on top, commission out of the quote
const updateLogisticsCommission = async (req, res) => {
  try {
    const data = logisticsSchema.parse(req.body || {});

    const DESCRIPTIONS = {
      markupMode: 'Logistics markup: PERCENT or FLAT',
      markupPercent: 'Logistics markup added on top of the operator quote, as a %',
      markupFlatMvr: 'Logistics markup added on top of MVR quotes',
      markupFlatUsd: 'Logistics markup added on top of USD quotes',
      commissionPercent: 'Logistics commission taken from the operator quote, as a %',
    };

    const writes = Object.keys(LOGISTICS_KEYS)
      .filter((field) => data[field] !== undefined)
      .map((field) => writeSetting(LOGISTICS_KEYS[field], data[field], DESCRIPTIONS[field]));

    if (writes.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    await Promise.all(writes);
    return res.json({
      success: true,
      message: 'Logistics commission updated',
      data: await loadLogistics(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.') || 'form'}: ${e.message}`)
        .join('; ');
      return res.status(400).json({ success: false, message: `Validation error — ${detail}` });
    }
    console.error('updateLogisticsCommission error:', error);
    return res
      .status(500)
      .json({ success: false, message: error.message || 'Error updating logistics commission' });
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
  updateCharterCommission,
  updateLogisticsCommission,
  getRouteMarkupHandler,
  upsertRouteMarkup,
  deleteRouteMarkup,
  // shared with pricing code
  getRouteMarkup,
  loadGlobals,
};
