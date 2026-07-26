/**
 * Currency helpers.
 * MVR and USD are handled INDEPENDENTLY across the platform.
 * Passenger category determines which currency a booking is transacted in.
 *   LOCAL, EXPAT -> MVR
 *   TOURIST      -> USD
 * Default (unknown/undefined category) falls back to MVR.
 */
const getCurrencyForCategory = (category) => {
  switch (category) {
    case 'TOURIST':
      return 'USD';
    case 'LOCAL':
    case 'EXPAT':
      return 'MVR';
    default:
      return 'MVR';
  }
};

module.exports = {
  getCurrencyForCategory,
};
