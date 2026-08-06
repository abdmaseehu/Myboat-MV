/**
 * Fare engine — the one place a price is assembled.
 *
 * A fare is built in layers, all within a single currency:
 *
 *   operator base          what the operator published for this tier
 * + route markup           Myboat's flat markup for this route and tier
 * = PUBLIC PRICE           what a customer is quoted
 *
 * From there, per booking:
 *
 *   gross         = publicPrice x seats
 *   platformPct   = gross x globalPercentage%
 *   platformFlat  = the flat fee for THIS currency
 *   agentDiscount = gross x agent discount%   (only for an active partnership)
 *
 *   customerPays  = gross + platformFlat - agentDiscount
 *   platformTake  = markup x seats + platformPct + platformFlat
 *   vendorNet     = base x seats - platformPct - agentDiscount
 *
 * Base Price Protection: the agent discount is subtracted from the vendor's
 * share alone. The markup, the percentage and the flat fee are identical
 * whether or not an agent is involved.
 *
 * The three shares always reconstruct the invoice:
 *   platformTake + vendorNet === customerPays
 *
 * Currency isolation: LOCAL and EXPAT settle wholly in MVR, TOURIST wholly in
 * USD. Nothing is converted, and the flat fee is read per currency — one shared
 * number would have been a silent 1:1 conversion.
 */

const TIERS = {
  LOCAL: { field: 'priceLocalMvr', markup: 'markupLocal', currency: 'MVR' },
  EXPAT: { field: 'priceExpatMvr', markup: 'markupExpat', currency: 'MVR' },
  TOURIST: { field: 'priceTouristUsd', markup: 'markupTourist', currency: 'USD' },
};

const SETTING_KEYS = [
  'GLOBAL_PLATFORM_PERCENTAGE',
  'GLOBAL_PLATFORM_FLAT_FEE',
  'GLOBAL_PLATFORM_FLAT_FEE_USD',
];

const ZERO_MARKUP = { markupLocal: 0, markupExpat: 0, markupTourist: 0 };

/** 2dp, without floating-point dust reaching an invoice. */
const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const num = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Platform-wide settings, with the flat fee split by currency. */
async function loadPlatformConfig(prisma) {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: SETTING_KEYS } },
    select: { keyName: true, value: true },
  });
  const get = (k) => rows.find((r) => r.keyName === k)?.value;
  return {
    percentage: num(get('GLOBAL_PLATFORM_PERCENTAGE'), 0),
    flatFee: {
      MVR: num(get('GLOBAL_PLATFORM_FLAT_FEE'), 0),
      USD: num(get('GLOBAL_PLATFORM_FLAT_FEE_USD'), 0),
    },
  };
}

/**
 * Markup for a route. A route with no row is the normal case, not an error —
 * callers always get numbers.
 */
async function loadRouteMarkup(prisma, routeId) {
  if (!routeId) return { ...ZERO_MARKUP };
  const row = await prisma.routeMarkup.findUnique({ where: { routeId } });
  if (!row) return { ...ZERO_MARKUP };
  return {
    markupLocal: num(row.markupLocal),
    markupExpat: num(row.markupExpat),
    markupTourist: num(row.markupTourist),
  };
}

/** Markups for many routes at once, keyed by routeId. Used by search. */
async function loadRouteMarkups(prisma, routeIds = []) {
  const ids = [...new Set(routeIds.filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;
  const rows = await prisma.routeMarkup.findMany({ where: { routeId: { in: ids } } });
  rows.forEach((r) =>
    map.set(r.routeId, {
      markupLocal: num(r.markupLocal),
      markupExpat: num(r.markupExpat),
      markupTourist: num(r.markupTourist),
    })
  );
  return map;
}

/**
 * Public price for one tier: operator base plus markup.
 *
 * Returns null when the operator hasn't published that tier — a markup alone is
 * not a fare, and quoting one would invent a price the operator never set.
 */
function publicPriceForTier(schedule, markup, tier) {
  const spec = TIERS[tier];
  if (!spec) return null;
  const base = schedule?.[spec.field];
  if (base === null || base === undefined || base === '') return null;
  const b = Number(base);
  if (!Number.isFinite(b)) return null;
  return money(b + num(markup?.[spec.markup], 0));
}

/**
 * Rewrite a schedule's tier prices to their public equivalents.
 *
 * Search and booking both read the same fields, so applying the markup here
 * means every surface quotes the same number without each one remembering to
 * add it. The operator's own figures are preserved alongside for the dashboards.
 */
function applyMarkupToSchedule(schedule, markup) {
  if (!schedule) return schedule;
  const m = markup || ZERO_MARKUP;
  const out = { ...schedule };

  // Keep what the operator set, so operator-facing views can still show it.
  out.operatorPriceLocalMvr = schedule.priceLocalMvr;
  out.operatorPriceExpatMvr = schedule.priceExpatMvr;
  out.operatorPriceTouristUsd = schedule.priceTouristUsd;
  out.appliedMarkup = { ...m };

  const local = publicPriceForTier(schedule, m, 'LOCAL');
  const expat = publicPriceForTier(schedule, m, 'EXPAT');
  const tourist = publicPriceForTier(schedule, m, 'TOURIST');

  if (local !== null) out.priceLocalMvr = local;
  if (expat !== null) out.priceExpatMvr = expat;
  if (tourist !== null) out.priceTouristUsd = tourist;

  return out;
}

/** Currency a tier settles in. Never inferred from anything else. */
const currencyForTier = (tier) => TIERS[tier]?.currency || 'MVR';

/**
 * Build the full ledger for a booking.
 *
 * @param {object} o
 * @param {number} o.basePerSeat        operator's own price for this tier
 * @param {number} o.markupPerSeat      Myboat markup for this route and tier
 * @param {number} o.seats
 * @param {string} o.tier               LOCAL | EXPAT | TOURIST
 * @param {object} o.platform           from loadPlatformConfig
 * @param {number} [o.agentDiscountPercent]
 * @param {number} [o.agentCommissionPercent]
 */
function computeFare({
  basePerSeat,
  markupPerSeat = 0,
  seats = 1,
  tier = 'LOCAL',
  platform,
  agentDiscountPercent = 0,
  agentCommissionPercent = 0,
}) {
  const currency = currencyForTier(tier);
  const base = num(basePerSeat, 0);
  const markup = num(markupPerSeat, 0);
  const qty = Math.max(1, Number(seats) || 1);

  const publicPrice = money(base + markup);
  const gross = money(publicPrice * qty);
  const baseTotal = money(base * qty);
  const markupTotal = money(markup * qty);

  const platformPct = money((gross * num(platform?.percentage, 0)) / 100);
  const platformFlat = money(num(platform?.flatFee?.[currency], 0));

  // Base Price Protection: the discount is the vendor's to give.
  const agentDiscount = money((gross * num(agentDiscountPercent, 0)) / 100);

  const customerPays = money(Math.max(0, gross + platformFlat - agentDiscount));
  const platformTake = money(markupTotal + platformPct + platformFlat);
  const vendorNet = money(baseTotal - platformPct - agentDiscount);

  // Commission is recorded, not invoiced — operators settle with agents direct.
  const agentCommission = money(
    (customerPays * num(agentCommissionPercent, 0)) / 100
  );

  return {
    currency,
    publicPricePerSeat: publicPrice,
    seats: qty,
    gross,
    baseTotal,
    markupTotal,
    platformPercentAmount: platformPct,
    platformFlatAmount: platformFlat,
    platformTake,
    agentDiscount,
    agentCommission,
    vendorNet,
    customerPays,
  };
}

module.exports = {
  TIERS,
  loadPlatformConfig,
  loadRouteMarkup,
  loadRouteMarkups,
  publicPriceForTier,
  applyMarkupToSchedule,
  currencyForTier,
  computeFare,
  money,
};
