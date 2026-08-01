/**
 * Currency helpers (frontend).
 * MVR and USD are handled INDEPENDENTLY. Never sum them.
 *   LOCAL, EXPAT -> MVR
 *   TOURIST      -> USD
 * Default (unknown/undefined category) falls back to MVR.
 */
export function getCurrencyForCategory(category) {
  switch (category) {
    case "TOURIST":
      return "USD";
    case "LOCAL":
    case "EXPAT":
      return "MVR";
    default:
      return "MVR";
  }
}

export function formatMoney(amount, currency = "MVR") {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "MVR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function currencyAccent(currency) {
  return currency === "USD"
    ? {
        text: "text-sky-600 dark:text-sky-400",
        border: "border-sky-500",
        badge: "border-sky-500 text-sky-600",
        icon: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/30",
      }
    : {
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500",
        badge: "border-emerald-500 text-emerald-600",
        icon: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
      };
}


/**
 * The single source of truth for what a seat costs.
 *
 * Tier prices live on the SCHEDULE (priceLocalMvr / priceExpatMvr /
 * priceTouristUsd). `layout.seaterPrice` is an MVR-denominated fallback for
 * legacy records only - it must NEVER be shown to a tourist, because pairing
 * an MVR figure with a "$" sign misrepresents the price.
 *
 * MVR and USD are independent. Nothing here converts between them.
 *
 * @returns {{amount: number|null, currency: 'MVR'|'USD'}}
 *          `amount` is null when the operator has not set that tier's price.
 */
export function priceForCategory(vehicleOrSchedule, category) {
  // Accepts either a vehicle (with .schedules[0]) or a schedule directly.
  const schedule =
    vehicleOrSchedule?.schedules?.[0] ?? vehicleOrSchedule ?? {};
  const layoutFallback = vehicleOrSchedule?.layout?.seaterPrice ?? null;

  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

  switch (category) {
    case "LOCAL":
      // MVR tier; the layout fallback is also MVR so it is safe here.
      return { amount: num(schedule.priceLocalMvr) ?? num(layoutFallback), currency: "MVR" };
    case "EXPAT":
      return { amount: num(schedule.priceExpatMvr) ?? num(layoutFallback), currency: "MVR" };
    case "TOURIST":
      // USD tier only - no MVR fallback, see note above.
      return { amount: num(schedule.priceTouristUsd), currency: "USD" };
    default:
      return { amount: num(layoutFallback), currency: "MVR" };
  }
}

/** Human label for a passenger category. */
export function categoryLabel(category) {
  switch (category) {
    case "LOCAL":
      return "Local";
    case "EXPAT":
      return "Expat";
    case "TOURIST":
      return "Tourist";
    default:
      return "Fare";
  }
}
