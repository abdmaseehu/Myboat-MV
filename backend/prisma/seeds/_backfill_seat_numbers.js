/**
 * One-shot backfill, safe to re-run.
 *
 * Bookings made before the seat picker sent the real seat number stored
 * seatNumber values like "SEAT-0" (a positional fallback), which then printed
 * on e-tickets. The layout keyed by seat key holds the number actually shown in
 * the grid, so recover it from there.
 *
 * Only touches entries whose seatNumber still looks like the old fallback.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()
const LOOKS_LIKE_FALLBACK = (v) => /^SEAT-\d+$/i.test(String(v ?? ''))

;(async () => {
  const bookings = await p.booking.findMany({
    select: { id: true, vehicleId: true, seatNumbers: true },
  })

  // Cache layouts so a busy vessel is only fetched once.
  const layoutCache = new Map()
  const layoutFor = async (vehicleId) => {
    if (!vehicleId) return {}
    if (layoutCache.has(vehicleId)) return layoutCache.get(vehicleId)
    const v = await p.vehicle.findUnique({
      where: { id: vehicleId },
      select: { layout: { select: { layoutJson: true } } },
    })
    const seats = v?.layout?.layoutJson?.seats || {}
    layoutCache.set(vehicleId, seats)
    return seats
  }

  let scanned = 0
  let fixed = 0

  for (const b of bookings) {
    if (!Array.isArray(b.seatNumbers)) continue
    scanned++

    const needsWork = b.seatNumbers.some(
      (s) => s && s.key !== '_meta' && LOOKS_LIKE_FALLBACK(s.seatNumber)
    )
    if (!needsWork) continue

    const seats = await layoutFor(b.vehicleId)
    let ordinal = 0

    const next = b.seatNumbers.map((s) => {
      if (!s || s.key === '_meta') return s
      ordinal++
      if (!LOOKS_LIKE_FALLBACK(s.seatNumber)) return s
      // Prefer the number printed on the seat; fall back to its position.
      const fromLayout = seats?.[s.key]?.number
      return { ...s, seatNumber: String(fromLayout ?? ordinal) }
    })

    await p.booking.update({
      where: { id: b.id },
      data: { seatNumbers: next },
    })
    fixed++
    const before = b.seatNumbers.filter((s) => s?.key !== '_meta').map((s) => s.seatNumber)
    const after = next.filter((s) => s?.key !== '_meta').map((s) => s.seatNumber)
    console.log(`  ${b.id.slice(-8).toUpperCase()}  ${before.join(',')} -> ${after.join(',')}`)
  }

  console.log(`\nscanned ${scanned} bookings, updated ${fixed}`)
  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
