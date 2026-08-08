/**
 * Age bands, mirroring backend/src/utils/fare-engine.js.
 *
 * Only the age arithmetic lives here. The FARES come from the server, on
 * `schedule.bandFares` — the markup that goes into them is Myboat's margin and
 * never reaches a customer's browser, and a second copy of the pricing formula
 * on the client would be free to drift from the one that actually charges.
 *
 * An infant is under 2 and travels on a lap: no seat, no fare, no markup. A
 * child is 2 to 11. Anyone 12 or over is an adult.
 */
export const INFANT_UNDER_YEARS = 2;
export const CHILD_UNDER_YEARS = 12;

/** Whole years completed on `onDate`. Null for an unusable date. */
export function ageOn(dateOfBirth, onDate = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const at = new Date(onDate);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null;

  let years = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) years -= 1;
  return years;
}

/**
 * The band a passenger falls into on the day they travel.
 *
 * A missing or unreadable date of birth reads as ADULT, same as the server —
 * the alternative hands a free fare to anyone who leaves the field blank.
 */
export function bandForDob(dateOfBirth, travelDate = new Date()) {
  const years = ageOn(dateOfBirth, travelDate);
  if (years === null || years < 0) return 'ADULT';
  if (years < INFANT_UNDER_YEARS) return 'INFANT';
  if (years < CHILD_UNDER_YEARS) return 'CHILD';
  return 'ADULT';
}

/**
 * The band that decides a seated passenger's fare.
 *
 * A family that buys a seat for an 18-month-old rather than holding them pays
 * the child fare for it — taking a seat should not cost more than the child in
 * the next one is paying.
 */
export const seatedBand = (dateOfBirth, travelDate) =>
  bandForDob(dateOfBirth, travelDate) === 'ADULT' ? 'ADULT' : 'CHILD';

/** Counts of seated passengers by fare band, from their dates of birth. */
export function countSeatedBands(passengers = [], travelDate = new Date()) {
  return (passengers || []).reduce(
    (acc, p) => {
      if (seatedBand(p?.dateOfBirth, travelDate) === 'CHILD') acc.children += 1;
      else acc.adults += 1;
      return acc;
    },
    { adults: 0, children: 0 }
  );
}

/**
 * What the party costs, from the server's per-band fares.
 *
 * Returns null when the operator hasn't published this tier, so callers fall
 * back to whatever price the seat itself carries rather than quoting zero.
 */
export function priceParty(bandFares, { adults = 0, children = 0, infants = 0 }) {
  if (!bandFares) return null;
  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const adult = Number(bandFares.adult) || 0;
  const child = Number(bandFares.child) || 0;
  const infant = Number(bandFares.infant) || 0;

  return {
    adultFare: adult,
    childFare: child,
    infantFare: infant,
    gross: round(adult * adults + child * children + infant * infants),
  };
}

export const BAND_LABEL = { ADULT: 'Adult', CHILD: 'Child', INFANT: 'Infant' };
