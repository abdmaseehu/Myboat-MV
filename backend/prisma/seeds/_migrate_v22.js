/**
 * v22 migration — let an operator decide whether they offer a child fare at
 * all, and name it in money rather than as a percentage. Additive, safe to
 * re-run.
 *
 * A percentage was the cheap way to cover three passenger tiers with one
 * number, but it is not how an operator thinks about a fare. They think "a
 * child is 30 rufiyaa", not "a child is 50% of 65". And plenty of routes carry
 * no child discount at all — a twenty-minute harbour crossing, a speedboat sold
 * by the seat — where the honest setting is simply "off".
 *
 * So: a switch, and one explicit price per tier.
 *
 *   child_fare_enabled = false  a child pays the adult fare
 *   an explicit price is set    that price, in that tier's currency
 *   enabled with no price       falls back to child_percent (50 by default)
 *
 * Existing rows default to enabled with no explicit price, which resolves to
 * the 50% they already had. Nothing reprices.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS child_fare_enabled BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS child_price_local_mvr NUMERIC(10,2)`,
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS child_price_expat_mvr NUMERIC(10,2)`,
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS child_price_tourist_usd NUMERIC(10,2)`,
]

;(async () => {
  console.log('v22 migration — explicit child fares\n')

  for (const sql of STATEMENTS) {
    const label = sql.replace(/\s+/g, ' ').slice(0, 72)
    try {
      await p.$executeRawUnsafe(sql)
      console.log(`  ok   ${label}`)
    } catch (e) {
      console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`)
      throw e
    }
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bus_schedules'
        AND column_name IN ('child_fare_enabled','child_price_local_mvr',
                            'child_price_expat_mvr','child_price_tourist_usd')
      ORDER BY column_name`
  )
  cols.forEach((c) => console.log(`\n  ${c.column_name}`))
  if (cols.length !== 4) throw new Error('migration incomplete')

  const total = await p.busSchedule.count()
  console.log(
    `\n  ${total} existing schedule(s) keep child fares on at 50%, unchanged`
  )

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
