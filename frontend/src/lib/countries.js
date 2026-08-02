/**
 * Country list for passenger details.
 *
 * Maldives first (most local/expat passengers), then the top source markets for
 * Maldives tourism, then everything else alphabetically. Values are stored as
 * the plain country name so manifests stay readable without a lookup.
 */

// Surfaced at the top of the picker - these cover the large majority of
// Maldives arrivals, so most customers never have to scroll.
const PRIORITY = [
  "Maldives",
  "India",
  "China",
  "Russia",
  "United Kingdom",
  "Germany",
  "Italy",
  "France",
  "United States",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
];

const REST = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahrain", "Belarus",
  "Belgium", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Ethiopia", "Fiji", "Finland", "Georgia",
  "Ghana", "Greece", "Hungary", "Iceland", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Libya", "Lithuania",
  "Luxembourg", "Malaysia", "Malta", "Mauritius", "Mexico", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Myanmar", "Netherlands",
  "New Zealand", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palestine", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Tunisia", "Turkey", "Turkmenistan", "Uganda",
  "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

export const COUNTRIES = [...PRIORITY, ...REST];

// How many leading entries are the "common" ones, so the picker can draw a
// separator without hardcoding the number in the component.
export const PRIORITY_COUNT = PRIORITY.length;
