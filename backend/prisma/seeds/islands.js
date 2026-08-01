/**
 * Maldives locations master list.
 *
 * Curated set of the significant locations operators actually run services to:
 * inhabited islands, airports, and major resorts — grouped by atoll.
 * This is NOT all 1,192 islands; admins can add more via the dashboard.
 */

// atollCode, atollName
const ATOLLS = [
  ['HA', 'Haa Alif'],
  ['HDh', 'Haa Dhaalu'],
  ['Sh', 'Shaviyani'],
  ['N', 'Noonu'],
  ['R', 'Raa'],
  ['B', 'Baa'],
  ['Lh', 'Lhaviyani'],
  ['K', 'Kaafu'],
  ['AA', 'Alif Alif'],
  ['ADh', 'Alif Dhaalu'],
  ['V', 'Vaavu'],
  ['M', 'Meemu'],
  ['F', 'Faafu'],
  ['Dh', 'Dhaalu'],
  ['Th', 'Thaa'],
  ['L', 'Laamu'],
  ['GA', 'Gaafu Alif'],
  ['GDh', 'Gaafu Dhaalu'],
  ['Gn', 'Gnaviyani'],
  ['S', 'Seenu'],
]

// atollCode: [ [name, type] ]
// type: INHABITED | RESORT | AIRPORT | INDUSTRIAL
const ISLANDS = {
  HA: [
    ['Dhidhdhoo', 'INHABITED'], ['Filladhoo', 'INHABITED'], ['Hoarafushi', 'INHABITED'],
    ['Ihavandhoo', 'INHABITED'], ['Kelaa', 'INHABITED'], ['Maarandhoo', 'INHABITED'],
    ['Muraidhoo', 'INHABITED'], ['Baarah', 'INHABITED'], ['Thakandhoo', 'INHABITED'],
    ['Thuraakunu', 'INHABITED'], ['Uligamu', 'INHABITED'], ['Utheemu', 'INHABITED'],
    ['Vashafaru', 'INHABITED'], ['Berinmadhoo', 'INHABITED'],
    ['Hoarafushi Airport', 'AIRPORT'],
  ],
  HDh: [
    ['Kulhudhuffushi', 'INHABITED'], ['Kumundhoo', 'INHABITED'], ['Kurinbi', 'INHABITED'],
    ['Makunudhoo', 'INHABITED'], ['Naivaadhoo', 'INHABITED'], ['Nellaidhoo', 'INHABITED'],
    ['Neykurendhoo', 'INHABITED'], ['Nolhivaram', 'INHABITED'], ['Nolhivaranfaru', 'INHABITED'],
    ['Vaikaradhoo', 'INHABITED'], ['Finey', 'INHABITED'], ['Hirimaradhoo', 'INHABITED'],
    ['Hanimaadhoo', 'INHABITED'], ['Hanimaadhoo Airport', 'AIRPORT'],
    ['Kulhudhuffushi Airport', 'AIRPORT'],
  ],
  Sh: [
    ['Funadhoo', 'INHABITED'], ['Feevah', 'INHABITED'], ['Feydhoo', 'INHABITED'],
    ['Foakaidhoo', 'INHABITED'], ['Goidhoo', 'INHABITED'], ['Kanditheemu', 'INHABITED'],
    ['Komandoo', 'INHABITED'], ['Lhaimagu', 'INHABITED'], ['Maakandoodhoo', 'INHABITED'],
    ['Maroshi', 'INHABITED'], ['Milandhoo', 'INHABITED'], ['Narudhoo', 'INHABITED'],
    ['Noomaraa', 'INHABITED'], ['Bilehffahi', 'INHABITED'],
    ['Fushivelavaru', 'RESORT'],
  ],
  N: [
    ['Manadhoo', 'INHABITED'], ['Henbandhoo', 'INHABITED'], ['Holhudhoo', 'INHABITED'],
    ['Kendhikulhudhoo', 'INHABITED'], ['Kudafari', 'INHABITED'], ['Landhoo', 'INHABITED'],
    ['Lhohi', 'INHABITED'], ['Maafaru', 'INHABITED'], ['Maalhendhoo', 'INHABITED'],
    ['Magoodhoo', 'INHABITED'], ['Miladhoo', 'INHABITED'], ['Velidhoo', 'INHABITED'],
    ['Fodhdhoo', 'INHABITED'],
    ['Maafaru International Airport', 'AIRPORT'],
    ['Soneva Jani', 'RESORT'], ['Cheval Blanc Randheli', 'RESORT'],
    ['Velaa Private Island', 'RESORT'], ['Siyam World', 'RESORT'],
  ],
  R: [
    ['Ungoofaaru', 'INHABITED'], ['Alifushi', 'INHABITED'], ['Angolhitheemu', 'INHABITED'],
    ['Dhuvaafaru', 'INHABITED'], ['Fainu', 'INHABITED'], ['Hulhudhuffaaru', 'INHABITED'],
    ['Inguraidhoo', 'INHABITED'], ['Innamaadhoo', 'INHABITED'], ['Kinolhas', 'INHABITED'],
    ['Maakurathu', 'INHABITED'], ['Maduvvaree', 'INHABITED'], ['Meedhoo', 'INHABITED'],
    ['Rasgetheemu', 'INHABITED'], ['Rasmaadhoo', 'INHABITED'], ['Vaadhoo', 'INHABITED'],
    ['Aarah', 'INHABITED'],
    ['Ifuru Airport', 'AIRPORT'],
    ['Adaaran Select Meedhupparu', 'RESORT'], ['Joali Maldives', 'RESORT'],
    ['The Standard Huruvalhi', 'RESORT'], ['Emerald Maldives', 'RESORT'],
  ],
  B: [
    ['Eydhafushi', 'INHABITED'], ['Dharavandhoo', 'INHABITED'], ['Dhonfanu', 'INHABITED'],
    ['Fehendhoo', 'INHABITED'], ['Fulhadhoo', 'INHABITED'], ['Goidhoo', 'INHABITED'],
    ['Hithaadhoo', 'INHABITED'], ['Kamadhoo', 'INHABITED'], ['Kendhoo', 'INHABITED'],
    ['Kihaadhoo', 'INHABITED'], ['Kudarikilu', 'INHABITED'], ['Maalhos', 'INHABITED'],
    ['Thulhaadhoo', 'INHABITED'], ['Dhakandhoo', 'INHABITED'],
    ['Dharavandhoo Airport', 'AIRPORT'],
    ['Soneva Fushi', 'RESORT'], ['Four Seasons Landaa Giraavaru', 'RESORT'],
    ['Milaidhoo Island', 'RESORT'], ['Amilla Maldives', 'RESORT'],
    ['Anantara Kihavah', 'RESORT'], ['The Nautilus', 'RESORT'],
    ['Reethi Beach Resort', 'RESORT'], ['Royal Island Resort', 'RESORT'],
  ],
  Lh: [
    ['Naifaru', 'INHABITED'], ['Hinnavaru', 'INHABITED'], ['Kurendhoo', 'INHABITED'],
    ['Olhuvelifushi', 'INHABITED'], ['Maafilaafushi', 'INHABITED'],
    ['Kanuhura', 'RESORT'], ['Komandoo Island Resort', 'RESORT'],
    ['Hurawalhi Island Resort', 'RESORT'], ['Kudadoo Private Island', 'RESORT'],
    ['Atmosphere Kanifushi', 'RESORT'], ['Cocoon Maldives', 'RESORT'],
    ['Innahura Maldives', 'RESORT'],
  ],
  K: [
    ['Malé City', 'INHABITED'], ['Hulhumalé', 'INHABITED'], ['Villingili', 'INHABITED'],
    ['Thulusdhoo', 'INHABITED'], ['Dhiffushi', 'INHABITED'], ['Gulhi', 'INHABITED'],
    ['Guraidhoo', 'INHABITED'], ['Himmafushi', 'INHABITED'], ['Huraa', 'INHABITED'],
    ['Kaashidhoo', 'INHABITED'], ['Gaafaru', 'INHABITED'], ['Maafushi', 'INHABITED'],
    ['Aarah', 'INHABITED'],
    ['Velana International Airport', 'AIRPORT'],
    ['Thilafushi', 'INDUSTRIAL'], ['Gulhi Falhu', 'INDUSTRIAL'],
    ['Adaaran Club Rannalhi', 'RESORT'], ['Adaaran Select Hudhuranfushi', 'RESORT'],
    ['Adaaran Prestige Vaadhoo', 'RESORT'], ['Anantara Dhigu', 'RESORT'],
    ['Anantara Veli', 'RESORT'], ['Baros Maldives', 'RESORT'],
    ['Bandos Island Resort', 'RESORT'], ['Kurumba Maldives', 'RESORT'],
    ['Paradise Island Resort', 'RESORT'], ['Velassaru Maldives', 'RESORT'],
    ['Sheraton Full Moon', 'RESORT'], ['Taj Coral Reef', 'RESORT'],
    ['One&Only Reethi Rah', 'RESORT'], ['Four Seasons Kuda Huraa', 'RESORT'],
    ['Gili Lankanfushi', 'RESORT'], ['Soneva Jani Malé', 'RESORT'],
    ['Club Med Kani', 'RESORT'], ['Kurumathi Malé', 'RESORT'],
  ],
  AA: [
    ['Rasdhoo', 'INHABITED'], ['Ukulhas', 'INHABITED'], ['Thoddoo', 'INHABITED'],
    ['Bodufolhudhoo', 'INHABITED'], ['Feridhoo', 'INHABITED'], ['Himandhoo', 'INHABITED'],
    ['Maalhos', 'INHABITED'], ['Mathiveri', 'INHABITED'],
    ['Kuramathi Maldives', 'RESORT'], ['Velidhu Island Resort', 'RESORT'],
    ['Gangehi Island Resort', 'RESORT'], ['Nika Island Resort', 'RESORT'],
    ['Ellaidhoo Maldives', 'RESORT'], ['Veligandu Island Resort', 'RESORT'],
  ],
  ADh: [
    ['Mahibadhoo', 'INHABITED'], ['Dhangethi', 'INHABITED'], ['Dhigurah', 'INHABITED'],
    ['Fenfushi', 'INHABITED'], ['Hangnaameedhoo', 'INHABITED'], ['Kunburudhoo', 'INHABITED'],
    ['Maamigili', 'INHABITED'], ['Mandhoo', 'INHABITED'], ['Omadhoo', 'INHABITED'],
    ['Aafinolhu', 'INHABITED'],
    ['Maamigili Airport', 'AIRPORT'],
    ['Vilamendhoo Island Resort', 'RESORT'], ['Sun Island Resort', 'RESORT'],
    ['Holiday Island Resort', 'RESORT'], ['Lily Beach Resort', 'RESORT'],
    ['Constance Moofushi', 'RESORT'], ['W Maldives', 'RESORT'],
    ['Conrad Rangali Island', 'RESORT'], ['LUX* South Ari Atoll', 'RESORT'],
    ['Centara Grand Island', 'RESORT'], ['Vakarufalhi Island Resort', 'RESORT'],
    ['Mirihi Island Resort', 'RESORT'], ['Angaga Island Resort', 'RESORT'],
  ],
  V: [
    ['Felidhoo', 'INHABITED'], ['Fulidhoo', 'INHABITED'], ['Keyodhoo', 'INHABITED'],
    ['Rakeedhoo', 'INHABITED'], ['Thinadhoo', 'INHABITED'], ['Aarah', 'INHABITED'],
    ['Alimatha Aquatic Resort', 'RESORT'], ['Dhiggiri Resort', 'RESORT'],
  ],
  M: [
    ['Muli', 'INHABITED'], ['Dhiggaru', 'INHABITED'], ['Kolhufushi', 'INHABITED'],
    ['Madifushi', 'INHABITED'], ['Maduvvaree', 'INHABITED'], ['Naalaafushi', 'INHABITED'],
    ['Raimmandhoo', 'INHABITED'], ['Veyvah', 'INHABITED'],
    ['Medhufushi Island Resort', 'RESORT'], ['Hakuraa Huraa', 'RESORT'],
  ],
  F: [
    ['Nilandhoo', 'INHABITED'], ['Biledhdhoo', 'INHABITED'], ['Dharanboodhoo', 'INHABITED'],
    ['Feeali', 'INHABITED'], ['Magoodhoo', 'INHABITED'],
    ['Filitheyo Island Resort', 'RESORT'], ['Adaaran Select Meedhupparu F', 'RESORT'],
  ],
  Dh: [
    ['Kudahuvadhoo', 'INHABITED'], ['Bandidhoo', 'INHABITED'], ['Hulhudheli', 'INHABITED'],
    ['Maaenboodhoo', 'INHABITED'], ['Meedhoo', 'INHABITED'], ['Rinbudhoo', 'INHABITED'],
    ['Vaanee', 'INHABITED'],
    ['Dhaalu Airport', 'AIRPORT'],
    ['Niyama Private Islands', 'RESORT'], ['Angsana Velavaru', 'RESORT'],
    ['Vommuli - St. Regis', 'RESORT'],
  ],
  Th: [
    ['Veymandoo', 'INHABITED'], ['Buruni', 'INHABITED'], ['Dhiyamigili', 'INHABITED'],
    ['Gaadhiffushi', 'INHABITED'], ['Guraidhoo', 'INHABITED'], ['Hirilandhoo', 'INHABITED'],
    ['Kandoodhoo', 'INHABITED'], ['Kinbidhoo', 'INHABITED'], ['Madifushi', 'INHABITED'],
    ['Omadhoo', 'INHABITED'], ['Thimarafushi', 'INHABITED'], ['Vandhoo', 'INHABITED'],
    ['Vilufushi', 'INHABITED'],
    ['Thimarafushi Airport', 'AIRPORT'],
  ],
  L: [
    ['Fonadhoo', 'INHABITED'], ['Gan', 'INHABITED'], ['Dhanbidhoo', 'INHABITED'],
    ['Hithadhoo', 'INHABITED'], ['Isdhoo', 'INHABITED'], ['Kalaidhoo', 'INHABITED'],
    ['Kunahandhoo', 'INHABITED'], ['Maabaidhoo', 'INHABITED'], ['Maamendhoo', 'INHABITED'],
    ['Maavah', 'INHABITED'], ['Mundoo', 'INHABITED'],
    ['Kadhdhoo Airport', 'AIRPORT'],
    ['Six Senses Laamu', 'RESORT'],
  ],
  GA: [
    ['Villingili', 'INHABITED'], ['Dhaandhoo', 'INHABITED'], ['Dhevvadhoo', 'INHABITED'],
    ['Gemanafushi', 'INHABITED'], ['Kanduhulhudhoo', 'INHABITED'], ['Kolamaafushi', 'INHABITED'],
    ['Kondey', 'INHABITED'], ['Maamendhoo', 'INHABITED'], ['Nilandhoo', 'INHABITED'],
    ['Kooddoo Airport', 'AIRPORT'],
    ['Park Hyatt Hadahaa', 'RESORT'],
  ],
  GDh: [
    ['Thinadhoo', 'INHABITED'], ['Fares-Maathodaa', 'INHABITED'], ['Fiyoaree', 'INHABITED'],
    ['Gaddhoo', 'INHABITED'], ['Hoandeddhoo', 'INHABITED'], ['Madaveli', 'INHABITED'],
    ['Nadellaa', 'INHABITED'], ['Rathafandhoo', 'INHABITED'], ['Vaadhoo', 'INHABITED'],
    ['Kaadedhdhoo Airport', 'AIRPORT'],
    ['Ayada Maldives', 'RESORT'], ['Raffles Maldives Meradhoo', 'RESORT'],
  ],
  Gn: [
    ['Fuvahmulah', 'INHABITED'],
    ['Fuvahmulah Airport', 'AIRPORT'],
  ],
  S: [
    ['Hithadhoo', 'INHABITED'], ['Feydhoo', 'INHABITED'], ['Maradhoo', 'INHABITED'],
    ['Maradhoo-Feydhoo', 'INHABITED'], ['Hulhudhoo', 'INHABITED'], ['Meedhoo', 'INHABITED'],
    ['Gan', 'INHABITED'],
    ['Gan International Airport', 'AIRPORT'],
    ['Shangri-La Villingili', 'RESORT'], ['Canareef Resort', 'RESORT'],
  ],
}

/** Flatten to rows ready for insert. */
function buildRows() {
  const atollName = Object.fromEntries(ATOLLS)
  const rows = []
  for (const [code, list] of Object.entries(ISLANDS)) {
    for (const [name, type] of list) {
      rows.push({
        name,
        atollCode: code,
        atollName: atollName[code],
        type,
        // Display label used in dropdowns, e.g. "Maafushi (Kaafu)"
        label: `${name} (${atollName[code]})`,
      })
    }
  }
  return rows
}

module.exports = { ATOLLS, ISLANDS, buildRows }
