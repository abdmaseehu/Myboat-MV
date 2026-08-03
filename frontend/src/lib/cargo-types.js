/**
 * Cargo categories offered to operators when configuring a vessel and to
 * customers when searching. Shared so the two lists can never drift — a
 * customer filtering on a type no operator can pick would return nothing.
 */
export const CARGO_TYPES = [
  "General Cargo",
  "Construction Material",
  "Food & Perishables",
  "Furniture",
  "Vehicles",
  "Fuel",
  "Livestock",
  "Machinery",
  "Refrigerated",
  "Hazardous",
];

export default CARGO_TYPES;
