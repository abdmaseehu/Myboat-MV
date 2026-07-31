/**
 * Replace bus-era demo data with real Maldives ferry data.
 *
 * DELETES: bookings, checkins, schedules, routes, boarding/dropping points,
 *          vehicles, seat layouts.
 * KEEPS:   users, vendors, settings, custom fields, amenities, categories,
 *          operator agents, charter/logistics requests.
 *
 * A JSON snapshot of the deleted rows is taken by _backup_demo_data.js first.
 */
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// ---------------------------------------------------------------- helpers

/** Build a single-deck seat layout (ferries/speedboats have no upper deck). */
function buildLayout(rows, cols) {
  const layoutRows = []
  const seats = {}
  let n = 1
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      row.push('SEAT')
      seats[`lower-${r}-${c}`] = {
        type: 'SEAT',
        number: String(n++),
        deck: 'LOWER',
      }
    }
    layoutRows.push(row)
  }
  return { rows: layoutRows, seats, totalSeats: rows * cols }
}

/** A DateTime carrying a wall-clock time (schema stores these as timestamps). */
const at = (hhmm) => new Date(`2026-01-01T${hhmm}:00.000Z`)

// ---------------------------------------------------------------- data

const ROUTES = [
  // from, to, serviceType, km, minutes, local MVR, expat MVR, tourist USD, departures
  ['Malé City',              'Hulhumalé',   'SCHEDULED_FERRY',  6,  15,  50,  60, 10, ['06:30','08:00','10:00','12:00','14:00','16:00','18:00','20:00']],
  ['Malé City',              'Maafushi',    'SCHEDULED_FERRY', 27,  30, 250, 350, 30, ['07:00','09:30','11:30','14:00','16:00']],
  ['Velana Intl. Airport',   'Maafushi',    'SCHEDULED_FERRY', 29,  35, 300, 400, 35, ['08:00','11:00','14:30','17:30']],
  ['Malé City',              'Thulusdhoo',  'SCHEDULED_FERRY', 28,  45, 300, 400, 35, ['08:30','13:00','16:30']],
  ['Malé City',              'Dhiffushi',   'SCHEDULED_FERRY', 38,  60, 350, 450, 40, ['09:00','15:00']],
  ['Malé City',              'Guraidhoo',   'SCHEDULED_FERRY', 32,  40, 280, 380, 32, ['08:00','12:30','17:00']],
  ['Malé City',              'Ukulhas',     'SCHEDULED_FERRY', 72,  75, 550, 700, 60, ['09:00','14:30']],
  ['Malé City',              'Rasdhoo',     'SCHEDULED_FERRY', 62,  90, 600, 750, 65, ['09:30']],
  ['Malé City',              'Dhigurah',    'SCHEDULED_FERRY', 96,  95, 650, 800, 70, ['10:00']],
  ['Maafushi',               'Gulhi',       'SCHEDULED_FERRY',  8,  15, 100, 150, 15, ['10:30','16:00']],
]

/** Jetties / harbours used as boarding + dropping points. */
const JETTY = {
  'Malé City':            ['Villingili Ferry Terminal', 'Jetty No. 1 (Hulhumalé Ferry)'],
  'Hulhumalé':            ['Hulhumalé Ferry Terminal'],
  'Velana Intl. Airport': ['Airport Speedboat Jetty'],
  'Maafushi':             ['Maafushi Main Harbour'],
  'Thulusdhoo':           ['Thulusdhoo Harbour'],
  'Dhiffushi':            ['Dhiffushi Harbour'],
  'Guraidhoo':            ['Guraidhoo Harbour'],
  'Ukulhas':              ['Ukulhas Harbour'],
  'Rasdhoo':              ['Rasdhoo Harbour'],
  'Dhigurah':             ['Dhigurah Harbour'],
  'Gulhi':                ['Gulhi Harbour'],
}

/** Vessels, distributed across the operators. */
const VESSELS = [
  { name: 'Ocean Pearl',    number: 'MV-1201', type: 'AC',     seats: 24, base: 'Malé City',  layout: [6, 4], ac: true,  spec: { length: '14', enginePower: '2x250', topSpeed: '35', yearBuilt: '2021' } },
  { name: 'Blue Lagoon',    number: 'MV-1202', type: 'AC',     seats: 30, base: 'Malé City',  layout: [10, 3], ac: true, spec: { length: '16', enginePower: '2x300', topSpeed: '32', yearBuilt: '2020' } },
  { name: 'Reef Runner',    number: 'MV-1203', type: 'NON_AC', seats: 15, base: 'Maafushi',   layout: [5, 3], ac: false, spec: { length: '11', enginePower: '2x200', topSpeed: '38', yearBuilt: '2022' } },
  { name: 'Island Hopper',  number: 'MV-1204', type: 'AC',     seats: 40, base: 'Malé City',  layout: [10, 4], ac: true, spec: { length: '19', enginePower: '3x300', topSpeed: '30', yearBuilt: '2019' } },
  { name: 'Coral Breeze',   number: 'MV-1205', type: 'AC',     seats: 21, base: 'Hulhumalé',  layout: [7, 3], ac: true,  spec: { length: '13', enginePower: '2x250', topSpeed: '36', yearBuilt: '2023' } },
  { name: 'Manta Express',  number: 'MV-1206', type: 'AC',     seats: 32, base: 'Maafushi',   layout: [8, 4], ac: true,  spec: { length: '17', enginePower: '2x350', topSpeed: '34', yearBuilt: '2021' } },
  { name: 'Sunset Voyager', number: 'MV-1207', type: 'NON_AC', seats: 18, base: 'Thulusdhoo', layout: [6, 3], ac: false, spec: { length: '12', enginePower: '2x200', topSpeed: '33', yearBuilt: '2018' } },
  { name: 'Atoll Star',     number: 'MV-1208', type: 'AC',     seats: 36, base: 'Malé City',  layout: [9, 4], ac: true,  spec: { length: '18', enginePower: '3x250', topSpeed: '31', yearBuilt: '2022' } },
]

const TERMS =
  'Passengers must arrive at the jetty 15 minutes before departure. ' +
  'One piece of hand luggage and one checked bag (max 20kg) are included. ' +
  'Life jackets are provided and must be worn when instructed by the crew. ' +
  'Departures may be delayed or cancelled due to sea conditions.'

const CANCELLATION =
  'Free cancellation up to 24 hours before departure. ' +
  'Cancellations within 24 hours are refunded at 50%. ' +
  'No-shows are non-refundable. ' +
  'Trips cancelled by the operator due to weather are refunded in full or rescheduled at no cost.'

// ---------------------------------------------------------------- run

;(async () => {
  // ---- Guard: this script DELETES all routes/vessels/schedules/bookings.
  // Require an explicit opt-in so it can never run by accident.
  if (process.env.CONFIRM_RESEED !== 'yes') {
    console.error(
      'Refusing to run: this script deletes all routes, vessels, schedules,\n' +
        'seat layouts and bookings before seeding.\n\n' +
        'If that is what you want, re-run with:\n' +
        '  CONFIRM_RESEED=yes node prisma/seeds/maldives.js\n'
    )
    process.exit(1)
  }

  // ---- Which operators are we seeding for? -----------------------------
  const vendors = await p.vendor.findMany({
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const owners = vendors.filter((v) => v.user?.id)
  if (owners.length === 0) throw new Error('No vendors with users found — cannot seed.')
  console.log(`Seeding across ${owners.length} operator(s):`)
  owners.forEach((o) => console.log(`  - ${o.businessName} (${o.user.email})`))

  // ---- Delete demo data (FK-safe order) --------------------------------
  console.log('\nClearing demo data...')
  const del = async (label, fn) => {
    try {
      const r = await fn()
      console.log(`  deleted ${label}: ${r.count ?? 0}`)
    } catch (e) {
      console.log(`  SKIP ${label}: ${e.message.slice(0, 90)}`)
    }
  }
  await del('checkins', () => p.checkin.deleteMany({}))
  await del('bookings', () => p.booking.deleteMany({}))
  await del('busSchedules', () => p.busSchedule.deleteMany({}))
  await del('boardingPoints', () => p.boardingPoint.deleteMany({}))
  await del('droppingPoints', () => p.droppingPoint.deleteMany({}))
  await del('vehicles', () => p.vehicle.deleteMany({}))
  await del('routes', () => p.route.deleteMany({}))
  await del('busLayouts', () => p.busLayout.deleteMany({}))

  // ---- Seat layouts ----------------------------------------------------
  console.log('\nCreating seat layouts...')
  const layoutByKey = {}
  const uniqueLayouts = [...new Set(VESSELS.map((v) => v.layout.join('x')))]
  for (const key of uniqueLayouts) {
    const [rows, cols] = key.split('x').map(Number)
    const built = buildLayout(rows, cols)
    const owner = owners[0]
    const layout = await p.busLayout.create({
      data: {
        layoutName: `${built.totalSeats}-seat (${rows}x${cols})`,
        totalSeats: built.totalSeats,
        sleeperSeats: 0,
        seaterSeats: built.totalSeats,
        hasUpperDeck: false,
        upperDeckSeats: 0,
        sleeperPrice: 0,
        seaterPrice: 250,
        rowCount: rows,
        columnCount: cols,
        layoutJson: { rows: built.rows, seats: built.seats },
        isActive: true,
        userId: owner.user.id,
      },
    })
    layoutByKey[key] = layout
    console.log(`  ${layout.layoutName}`)
  }

  // ---- Routes + boarding/dropping points -------------------------------
  console.log('\nCreating routes...')
  const routeRecords = []
  for (let i = 0; i < ROUTES.length; i++) {
    const [from, to, serviceType, km, mins, , , , departures] = ROUTES[i]
    const owner = owners[i % owners.length]
    const route = await p.route.create({
      data: {
        sourceCity: from,
        destinationCity: to,
        serviceType,
        distance: km,
        isActive: true,
        userId: owner.user.id,
        boardingPoints: {
          create: (JETTY[from] || [`${from} Harbour`]).map((locationName, idx) => ({
            locationName,
            arrivalTime: at(departures[0]),
            sequenceNumber: idx + 1,
          })),
        },
        droppingPoints: {
          create: (JETTY[to] || [`${to} Harbour`]).map((locationName, idx) => ({
            locationName,
            arrivalTime: at(departures[0]),
            sequenceNumber: idx + 1,
          })),
        },
      },
    })
    routeRecords.push({ route, meta: ROUTES[i], owner })
    console.log(`  ${from} -> ${to}  (${mins} min)`)
  }

  // ---- Vessels ---------------------------------------------------------
  console.log('\nCreating vessels...')
  const vesselRecords = []
  for (let i = 0; i < VESSELS.length; i++) {
    const v = VESSELS[i]
    const owner = owners[i % owners.length]
    const layout = layoutByKey[v.layout.join('x')]
    // Give each vessel a home route departing from its base island.
    const homeRoute =
      routeRecords.find((r) => r.meta[0] === v.base)?.route || routeRecords[0].route

    const vessel = await p.vehicle.create({
      data: {
        vehicleName: v.name,
        vehicleNumber: v.number,
        vehicleType: v.type,
        vehicleStatus: 'AVAILABLE',
        vehicleRating: 4.5,
        totalSeats: v.seats,
        hasAc: v.ac,
        baseIsland: v.base,
        specification: { ...v.spec, description: `${v.name} is a ${v.seats}-seat ${v.ac ? 'air-conditioned ' : ''}speedboat operating from ${v.base}.` },
        termsConditions: TERMS,
        cancellationPolicy: CANCELLATION,
        seatSelectionEnabled: v.seats >= 20, // small boats: no assigned seating
        amenities: [
          { name: 'Life Jackets' },
          { name: 'Luggage Space' },
          ...(v.ac ? [{ name: 'Air Conditioning' }] : []),
        ],
        userId: owner.user.id,
        routeId: homeRoute.id,
        layoutId: layout.id,
      },
    })
    vesselRecords.push({ vessel, owner })
    console.log(`  ${v.name} (${v.number}) — ${v.seats} seats, seat picker ${v.seats >= 20 ? 'ON' : 'OFF'}`)
  }

  // ---- Schedules with 3-tier pricing -----------------------------------
  console.log('\nCreating schedules...')
  let scheduleCount = 0
  for (let i = 0; i < routeRecords.length; i++) {
    const { route, meta, owner } = routeRecords[i]
    const [, , , , mins, localMvr, expatMvr, touristUsd, departures] = meta

    // Vessels belonging to this route's operator
    const candidates = vesselRecords.filter((v) => v.owner.user.id === owner.user.id)
    const vessel = (candidates.length ? candidates : vesselRecords)[i % (candidates.length || vesselRecords.length)]

    for (const dep of departures) {
      const [h, m] = dep.split(':').map(Number)
      const arrivalMins = h * 60 + m + mins
      const ah = String(Math.floor(arrivalMins / 60) % 24).padStart(2, '0')
      const am = String(arrivalMins % 60).padStart(2, '0')

      await p.busSchedule.create({
        data: {
          routeId: route.id,
          userId: owner.user.id,
          departureTime: at(dep),
          arrivalTime: at(`${ah}:${am}`),
          busType: 'AC_SEATER',
          departureDate: new Date('2026-01-01T00:00:00.000Z'),
          arrivalDate: new Date('2026-01-01T00:00:00.000Z'),
          availableSeats: vessel.vessel.totalSeats,
          blockedSeats: 0,
          priceLocalMvr: localMvr,
          priceExpatMvr: expatMvr,
          priceTouristUsd: touristUsd,
          isRecurring: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          status: 'ACTIVE',
          isActive: true,
          vehicles: { connect: [{ id: vessel.vessel.id }] },
        },
      })
      scheduleCount++
    }
    console.log(`  ${meta[0]} -> ${meta[1]}: ${departures.length} daily departures  (MVR ${localMvr} / MVR ${expatMvr} / USD ${touristUsd})`)
  }

  // ---- Summary ---------------------------------------------------------
  console.log('\n================ DONE ================')
  console.log('routes      ', await p.route.count())
  console.log('vessels     ', await p.vehicle.count())
  console.log('seat layouts', await p.busLayout.count())
  console.log('schedules   ', scheduleCount)
  console.log('bookings    ', await p.booking.count(), '(cleared)')
  console.log('users       ', await p.user.count(), '(kept)')
  console.log('vendors     ', await p.vendor.count(), '(kept)')

  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
