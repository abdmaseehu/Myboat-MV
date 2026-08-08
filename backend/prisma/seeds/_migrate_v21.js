/**
 * v21 migration — record the age bands on a booking. Additive, safe to re-run.
 *
 * A ferry manifest has to say how many of the people aboard are children and
 * how many are lap infants. Neither is recoverable after the fact: an infant
 * takes no seat and fills no passenger form, so nothing else in the row knows
 * it was ever there.
 *
 * Adults are deliberately NOT stored. Adults = seats - children, and a third
 * column would be free to drift out of step with the seat list without
 * anything noticing.
 *
 * Existing rows default to 0/0, which reads as "all seats adult" — exactly how
 * they were priced.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bookings
     ADD COLUMN IF NOT EXISTS child_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE bookings
     ADD COLUMN IF NOT EXISTS infant_count INTEGER NOT NULL DEFAULT 0`,
]

;(async () => {
  console.log('v21 migration — booking age bands\n')

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
      WHERE table_name = 'bookings'
        AND column_name IN ('child_count','infant_count')
      ORDER BY column_name`
  )
  cols.forEach((c) => console.log(`\n  ${c.column_name} default ${c.column_default}`))
  if (cols.length !== 2) throw new Error('migration incomplete')

  const total = await p.booking.count()
  console.log(`\n  ${total} existing booking(s) read as all-adult, which is how they were priced`)

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
