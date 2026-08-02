/**
 * v5 migration — additive only, safe to re-run.
 *
 *  - bookings.passengers     JSON array of per-seat passenger details
 *                            (fullName, country, dateOfBirth required;
 *                             flight* fields optional)
 *  - bookings.contact_email  lead contact for the booking / e-ticket
 *  - bookings.contact_phone
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passengers JSONB`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone TEXT`,
]

;(async () => {
  console.log('v5 migration — booking passenger details')

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
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_name = 'bookings'
        AND column_name IN ('passengers','contact_email','contact_phone')
      ORDER BY column_name`
  )
  console.log('\n  bookings now has:')
  cols.forEach((c) => console.log(`    ${c.column_name.padEnd(15)} ${c.data_type}`))

  if (cols.length !== 3) {
    throw new Error(`expected 3 columns, found ${cols.length}`)
  }

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
