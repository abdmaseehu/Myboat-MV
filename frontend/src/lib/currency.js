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
