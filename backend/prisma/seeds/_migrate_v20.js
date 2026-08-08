/**
 * v20 migration — age band pricing on ferry schedules. Additive, safe to
 * re-run.
 *
 * A schedule already carries three prices, one per passenger tier. Crossing
 * those with three age bands would mean nine numbers per departure per day of
 * the week, which no operator will keep accurate and most would leave half
 * filled.
 *
 * So the three existing prices keep their meaning as the ADULT fare — which is
 * what they have always been — and a child or infant fare is derived from
 * whichever tier applies. Existing rows are already correct without touching
 * them: no backfill, nothing to get wrong.
 *
 * Defaults follow the usual Maldivian practice: half fare for a child, free
 * for an infant. An operator who charges differently overrides them per
 * schedule.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS child_percent NUMERIC(5,2) NOT NULL DEFAULT 50`,
  `ALTER TABLE bus_schedules
     ADD COLUMN IF NOT EXISTS infant_percent NUMERIC(5,2) NOT NULL DEFAULT 0`,
]

;(async () => {
  console.log('v20 migration — age band pricing\n')

  for (const sql of STATEMENTS) {
    const label = sql.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await p.$executeRawUnsafe(sql)
      console.log(`  ok   ${label}`)
    } catch (e) {
      console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`)
      throw e
    }
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name, column_default FROM information_schema.columns
      WHERE table_name = 'bus_schedules'
        AND column_name IN ('child_percent','infant_percent')
      ORDER BY column_name`
  )
  cols.forEach((c) => console.log(`\n  ${c.column_name} default ${c.column_default}`))
  if (cols.length !== 2) throw new Error('migration incomplete')

  const total = await p.busSchedule.count()
  console.log(`\n  ${total} existing schedule(s) now priced: adult as set, child 50%, infant free`)

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
