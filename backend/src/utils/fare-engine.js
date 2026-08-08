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
 *
 * Private charter has its own dials, further down: a whole boat for one trip
 * has no seat tiers to price, and where Myboat's share comes from depends on
 * whether the operator published the price in advance or named it for one
 * customer.
 */

const TIERS = {
  LOCAL: {
    field: 'priceLocalMvr',
    childField: 'childPriceLocalMvr',
    markup: 'markupLocal',
    currency: 'MVR',
  },
  EXPAT: {
    field: 'priceExpatMvr',
    childField: 'childPriceExpatMvr',
    markup: 'markupExpat',
    currency: 'MVR',
  },
  TOURIST: {
    field: 'priceTouristUsd',
    childField: 'childPriceTouristUsd',
    markup: 'markupTourist',
    currency: 'USD',
  },
};

const SETTING_KEYS = [
  'GLOBAL_PLATFORM_PERCENTAGE',
  'GLOBAL_PLATFORM_FLAT_FEE',
  'GLOBAL_PLATFORM_FLAT_FEE_USD',
];

const CHARTER_KEYS = [
  'CHARTER_LIVE_MARKUP_MODE',
  'CHARTER_LIVE_MARKUP_PERCENT',
  'CHARTER_LIVE_MARKUP_FLAT_MVR',
  'CHARTER_LIVE_MARKUP_FLAT_USD',
  'CHARTER_QUOTE_COMMISSION_PERCENT',
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
 * The operator's own child fare for one tier, before any markup.
 *
 * Three settings, in order of how specific they are:
 *
 *   childFareEnabled = false   there is no child discount on this departure,
 *                              so a child pays the adult fare. Normal for a
 *                              short harbour crossing.
 *   an explicit price          what the operator typed, in this tier's
 *                              currency. Named in money, because that is how an
 *                              operator thinks about a fare.
 *   neither                    childPercent of the adult fare, which is how
 *                              every schedule behaved before prices could be
 *                              set explicitly.
 */
function childBaseForTier(schedule, tier, adultBase) {
  const spec = TIERS[tier];
  const base = num(adultBase, 0);
  if (!spec) return base;

  // Only an explicit false turns it off, so a row loaded without the column
  // (or an older caller) keeps the child fare it had.
  if (schedule?.childFareEnabled === false) return base;

  const explicit = schedule?.[spec.childField];
  if (explicit !== null && explicit !== undefined && explicit !== '') {
    const n = Number(explicit);
    if (Number.isFinite(n) && n >= 0) return money(n);
  }

  return money((base * num(schedule?.childPercent, 50)) / 100);
}

/**
 * The public fare for each age band in one tier.
 *
 * Derived here rather than in the browser for two reasons. The markup is
 * Myboat's margin and has no business being sent to a customer's device; and a
 * second implementation of the formula on the client would be free to drift
 * from this one, which shows up as a checkout that quotes one price and charges
 * another.
 *
 * An infant carries no markup — our cut on a free fare would be a free seat
 * that costs money.
 */
function bandFaresForTier(schedule, markup, tier) {
  const spec = TIERS[tier];
  if (!spec) return null;
  const raw = schedule?.[spec.field];
  if (raw === null || raw === undefined || raw === '') return null;
  const base = Number(raw);
  if (!Number.isFinite(base)) return null;

  const m = num(markup?.[spec.markup], 0);
  const childBase = childBaseForTier(schedule, tier, base);
  const infantPct = num(schedule?.infantPercent, 0);

  return {
    currency: spec.currency,
    adult: money(base + m),
    child: money(childBase + m),
    infant: money((base * infantPct) / 100),
    // True when a child actually costs less than an adult. A schedule with the
    // discount switched off still has a child fare — it is just the adult one,
    // and labelling that "Child fare" on an invoice would be a lie.
    childDiscounted: childBase < base,
    infantPercent: infantPct,
  };
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

  // Per-band fares, so checkout can price a child without knowing the markup.
  out.bandFares = {
    LOCAL: bandFaresForTier(schedule, m, 'LOCAL'),
    EXPAT: bandFaresForTier(schedule, m, 'EXPAT'),
    TOURIST: bandFaresForTier(schedule, m, 'TOURIST'),
  };

  return out;
}

/**
 * Strip the operator's own figures from a schedule bound for a public
 * response. What the operator charges and what Myboat adds are internal; the
 * customer is quoted one number per band.
 */
function forPublicSchedule(schedule) {
  if (!schedule) return schedule;
  const {
    operatorPriceLocalMvr,
    operatorPriceExpatMvr,
    operatorPriceTouristUsd,
    appliedMarkup,
    ...rest
  } = schedule;
  return rest;
}

/* -------------------------------------------------------------------------- */
/*  Private charter                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Charter reaches a price in two ways, and Myboat takes its share differently
 * in each — because the two are not the same transaction.
 *
 *   live   a rate the operator published in advance. Nobody has been quoted
 *          anything yet, so our cut is ADDED on top and the operator still
 *          receives the figure they published. Percentage or flat amount.
 *
 *   quote  a number the operator names for one request, often after telling
 *          the customer. Adding to it would change a price they were given, so
 *          the cut is DEDUCTED: the customer pays the quote, the operator
 *          receives the rest. A commission is a share of a figure, so it is a
 *          percentage — there is no flat variant.
 *
 * Both settle to the same invariant:
 *
 *   quotedPrice = vendorNet + platformCut
 */
async function loadCharterConfig(prisma) {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: CHARTER_KEYS } },
    select: { keyName: true, value: true },
  });
  const get = (k) => rows.find((r) => r.keyName === k)?.value;

  return {
    live: {
      mode: String(get('CHARTER_LIVE_MARKUP_MODE') || '').toUpperCase() === 'FLAT' ? 'FLAT' : 'PERCENT',
      percent: num(get('CHARTER_LIVE_MARKUP_PERCENT'), 0),
      flat: {
        MVR: num(get('CHARTER_LIVE_MARKUP_FLAT_MVR'), 0),
        USD: num(get('CHARTER_LIVE_MARKUP_FLAT_USD'), 0),
      },
    },
    quote: { commissionPercent: num(get('CHARTER_QUOTE_COMMISSION_PERCENT'), 0) },
  };
}

/**
 * Price a published charter rate: the markup goes on top.
 *
 * Returns null for a null base — an unpriced trip stays unpriced rather than
 * becoming a fare made entirely of markup.
 */
function applyCharterMarkup(basePrice, currency, rule) {
  if (basePrice === null || basePrice === undefined || basePrice === '') return null;
  const base = money(num(basePrice, 0));
  const cur = currency === 'USD' ? 'USD' : 'MVR';

  const markup =
    rule?.mode === 'FLAT'
      ? money(num(rule?.flat?.[cur], 0))
      : money((base * num(rule?.percent, 0)) / 100);

  return {
    currency: cur,
    operatorPrice: base,
    markup,
    publicPrice: money(base + markup),
    // The operator keeps what they published; the markup was never theirs.
    vendorNet: base,
    platformCut: markup,
  };
}

/**
 * Price an operator's quote: the commission comes out of it.
 *
 * The customer pays exactly what the operator quoted, so a price already given
 * over the phone stays true.
 */
function applyCharterCommission(quotedAmount, currency, rule) {
  if (quotedAmount === null || quotedAmount === undefined || quotedAmount === '') return null;
  const quoted = money(num(quotedAmount, 0));
  const cur = currency === 'USD' ? 'USD' : 'MVR';

  const platformCut = money((quoted * num(rule?.commissionPercent, 0)) / 100);

  return {
    currency: cur,
    operatorPrice: quoted,
    markup: 0,
    publicPrice: quoted,
    vendorNet: money(quoted - platformCut),
    platformCut,
  };
}

/**
 * Public prices for a published charter rate, in whichever currencies the
 * operator actually set. A currency they left blank stays blank.
 */
function applyCharterRateMarkup(rate, charterCfg) {
  if (!rate) return rate;
  const mvr = applyCharterMarkup(rate.priceMvr, 'MVR', charterCfg?.live);
  const usd = applyCharterMarkup(rate.priceUsd, 'USD', charterCfg?.live);
  return {
    priceMvr: mvr ? mvr.publicPrice : null,
    priceUsd: usd ? usd.publicPrice : null,
    operatorPriceMvr: mvr ? mvr.operatorPrice : null,
    operatorPriceUsd: usd ? usd.operatorPrice : null,
    markupMvr: mvr ? mvr.markup : 0,
    markupUsd: usd ? usd.markup : 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Logistics                                                                  */
/* -------------------------------------------------------------------------- */

const LOGISTICS_KEYS = [
  'LOGISTICS_MARKUP_MODE',
  'LOGISTICS_MARKUP_PERCENT',
  'LOGISTICS_MARKUP_FLAT_MVR',
  'LOGISTICS_MARKUP_FLAT_USD',
  'LOGISTICS_COMMISSION_PERCENT',
];

/**
 * Logistics takes both a markup and a commission, because the two do different
 * jobs and the customer pays the operator directly.
 *
 *   markup      added on top of the operator's quote — the customer pays it
 *   commission  taken out of the operator's quote — the operator absorbs it
 *
 * Both are configured at once, and either can be zero.
 */
async function loadLogisticsConfig(prisma) {
  const rows = await prisma.setting.findMany({
    where: { keyName: { in: LOGISTICS_KEYS } },
    select: { keyName: true, value: true },
  });
  const get = (k) => rows.find((r) => r.keyName === k)?.value;

  return {
    markup: {
      mode: String(get('LOGISTICS_MARKUP_MODE') || '').toUpperCase() === 'FLAT' ? 'FLAT' : 'PERCENT',
      percent: num(get('LOGISTICS_MARKUP_PERCENT'), 0),
      flat: {
        MVR: num(get('LOGISTICS_MARKUP_FLAT_MVR'), 0),
        USD: num(get('LOGISTICS_MARKUP_FLAT_USD'), 0),
      },
    },
    commissionPercent: num(get('LOGISTICS_COMMISSION_PERCENT'), 0),
  };
}

/**
 * Price a logistics quote.
 *
 *   customer pays  = operator quote + markup
 *   operator keeps = operator quote - commission
 *   Myboat's share = markup + commission
 *
 * The operator collects the whole of what the customer pays into their own
 * account, so Myboat's share is not deducted anywhere — it becomes what the
 * operator owes once the order completes. Both parts belong on one invoice
 * because the operator settles them in one transfer, but they are recorded
 * separately: only the markup was ever the customer's money.
 */
function applyLogisticsPricing(quotedAmount, currency, cfg) {
  if (quotedAmount === null || quotedAmount === undefined || quotedAmount === '') return null;
  const quoted = money(num(quotedAmount, 0));
  const cur = currency === 'USD' ? 'USD' : 'MVR';

  const markup =
    cfg?.markup?.mode === 'FLAT'
      ? money(num(cfg?.markup?.flat?.[cur], 0))
      : money((quoted * num(cfg?.markup?.percent, 0)) / 100);

  const commission = money((quoted * num(cfg?.commissionPercent, 0)) / 100);

  return {
    currency: cur,
    operatorPrice: quoted,
    markup,
    commission,
    publicPrice: money(quoted + markup),
    vendorNet: money(quoted - commission),
    platformCut: money(markup + commission),
  };
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
/* -------------------------------------------------------------------------- */
/*  Age bands                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Where one band ends and the next begins, in years on the day of travel.
 *
 * A band is DERIVED from the date of birth every passenger already gives at
 * checkout — never from a dropdown someone picked. Asking twice invites a
 * thirty-year-old to be declared a child, and the fare would follow the
 * dropdown.
 *
 * An infant is under 2 and travels on a lap. A child is 2 to 11. Anyone 12 or
 * over is an adult. These are the usual thresholds for Maldivian ferry and
 * speedboat operators.
 */
const INFANT_UNDER_YEARS = 2;
const CHILD_UNDER_YEARS = 12;

/** Whole years completed on `onDate`. Returns null for an unusable date. */
function ageOn(dateOfBirth, onDate = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const at = new Date(onDate);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null;

  let years = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  // Not yet had this year's birthday.
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) years -= 1;
  return years;
}

/**
 * The band a passenger falls into on the day they travel.
 *
 * An unreadable or missing date of birth returns ADULT. That is deliberate:
 * the failure mode of guessing is charging an adult fare to someone who owed
 * one anyway, whereas guessing the other way hands out free travel to anyone
 * who leaves the field blank.
 */
function bandForDob(dateOfBirth, travelDate = new Date()) {
  const years = ageOn(dateOfBirth, travelDate);
  if (years === null || years < 0) return 'ADULT';
  if (years < INFANT_UNDER_YEARS) return 'INFANT';
  if (years < CHILD_UNDER_YEARS) return 'CHILD';
  return 'ADULT';
}

/**
 * Count a list of seated passengers into bands, from their dates of birth.
 *
 * Infants are not in this list — they take no seat and fill no form — so they
 * are counted separately and passed in alongside.
 */
function countBands(passengers = [], travelDate = new Date()) {
  const out = { adults: 0, children: 0, infants: 0 };
  (passengers || []).forEach((p) => {
    const band = bandForDob(p?.dateOfBirth, travelDate);
    // A family that buys a seat for an 18-month-old rather than holding them
    // pays the child fare for it. The free fare is for a lap, but taking a
    // seat should not cost more than the child in the next one is paying.
    if (band === 'CHILD' || band === 'INFANT') out.children += 1;
    else out.adults += 1;
  });
  return out;
}

/**
 * Split a party into the three age bands.
 *
 * Absent counts mean "all adults", which is what every caller meant before
 * bands existed — so an old call site keeps computing exactly what it did.
 */
function resolveParty({ seats = 1, adults, children, infants }) {
  const given =
    adults !== undefined || children !== undefined || infants !== undefined;
  if (!given) return { adults: Math.max(1, Number(seats) || 1), children: 0, infants: 0 };
  return {
    adults: Math.max(0, Number(adults) || 0),
    children: Math.max(0, Number(children) || 0),
    infants: Math.max(0, Number(infants) || 0),
  };
}

/**
 * Build the full ledger for a booking.
 *
 * @param {object} o
 * @param {number} o.basePerSeat   the operator's ADULT fare for this tier
 * @param {number} [o.markupPerSeat]
 * @param {number} [o.seats]       shorthand for a party of adults
 * @param {number} [o.adults]
 * @param {number} [o.children]
 * @param {number} [o.infants]
 * @param {number} [o.childPercent]   percentage of the adult fare, default 50
 * @param {number} [o.infantPercent]  default 0 — free
 */
function computeFare({
  basePerSeat,
  markupPerSeat = 0,
  seats = 1,
  adults,
  children,
  infants,
  // The operator's child fare for this tier, already resolved. Falls back to
  // childPercent so older callers keep working.
  childBasePerSeat,
  childPercent = 50,
  infantPercent = 0,
  tier = 'LOCAL',
  platform,
  agentDiscountPercent = 0,
  agentCommissionPercent = 0,
}) {
  const currency = currencyForTier(tier);
  const base = num(basePerSeat, 0);
  const markup = num(markupPerSeat, 0);

  const party = resolveParty({ seats, adults, children, infants });
  const childFare =
    childBasePerSeat === null || childBasePerSeat === undefined
      ? money((base * num(childPercent, 50)) / 100)
      : money(num(childBasePerSeat, 0));
  const infantFare = money((base * num(infantPercent, 0)) / 100);

  /**
   * An infant travels on a lap, so it takes no seat — and carries no markup.
   * Charging Myboat's markup on a free infant would mean a free fare that
   * costs money, which is not what "free" means to the person paying.
   */
  const seated = party.adults + party.children;
  const qty = Math.max(1, seated + party.infants);

  const baseTotal = money(
    base * party.adults + childFare * party.children + infantFare * party.infants
  );
  const markupTotal = money(markup * seated);
  const gross = money(baseTotal + markupTotal);
  // What one adult pays, kept for the callers and screens that quote a
  // headline price.
  const publicPrice = money(base + markup);

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
    // Everyone travelling, and the ones who occupy a seat.
    seats: qty,
    seatedCount: seated,
    party,
    fares: {
      adult: money(base + markup),
      child: money(childFare + markup),
      // No markup: nothing was charged to add it to.
      infant: infantFare,
    },
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
  INFANT_UNDER_YEARS,
  CHILD_UNDER_YEARS,
  ageOn,
  bandForDob,
  countBands,
  resolveParty,
  loadPlatformConfig,
  loadRouteMarkup,
  loadRouteMarkups,
  publicPriceForTier,
  applyMarkupToSchedule,
  bandFaresForTier,
  childBaseForTier,
  forPublicSchedule,
  loadCharterConfig,
  applyCharterMarkup,
  applyCharterCommission,
  applyCharterRateMarkup,
  loadLogisticsConfig,
  applyLogisticsPricing,
  currencyForTier,
  computeFare,
  money,
};
