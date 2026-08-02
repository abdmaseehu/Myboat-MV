/**
 * One-shot backfill, safe to re-run.
 *
 * Bookings made before bookings.schedule_id existed do not record which
 * departure was bought, so their tickets cannot show a time.
 *
 * Only unambiguous cases are filled: the vessel must run exactly ONE active
 * schedule on that route. Where a vessel runs several departures a day there is
 * genuinely no way to know which one was booked, so those are left NULL rather
 * than guessed — a wrong time on a ticket is worse than no time.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

;(async () => {
  const bookings = await p.booking.findMany({
    where: { scheduleId: null, routeId: { not: null } },
    select: { id: true, routeId: true, vehicleId: true },
  })

  console.log(`${bookings.length} booking(s) without a departure\n`)

  let filled = 0
  let ambiguous = 0
  let none = 0

  for (const b of bookings) {
    const schedules = await p.busSchedule.findMany({
      where: {
        routeId: b.routeId,
        status: 'ACTIVE',
        ...(b.vehicleId ? { vehicles: { some: { id: b.vehicleId } } } : {}),
      },
      select: { id: true, departureTime: true },
    })

    const ref = b.id.slice(-8).toUpperCase()

    if (schedules.length === 1) {
      await p.booking.update({
        where: { id: b.id },
        data: { scheduleId: schedules[0].id },
      })
      filled++
      console.log(`  ${ref}  filled`)
    } else if (schedules.length > 1) {
      ambiguous++
      console.log(`  ${ref}  skipped - ${schedules.length} departures, cannot tell which`)
    } else {
      none++
      console.log(`  ${ref}  skipped - no active schedule on this route`)
    }
  }

  console.log(
    `\nfilled ${filled}, ambiguous ${ambiguous}, no schedule ${none}`
  )
  if (ambiguous) {
    console.log(
      'Ambiguous bookings keep no departure time. New bookings record it directly.'
    )
  }

  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
