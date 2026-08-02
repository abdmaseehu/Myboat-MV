/**
 * v6 migration — additive only, safe to re-run.
 *
 *  - bookings.schedule_id            which departure was booked, so a ticket
 *                                    can show a departure time
 *  - vehicles.max_seats_per_booking  per-vessel cap (NULL = no artificial cap;
 *                                    replaces a hardcoded "max 4" in the UI)
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS schedule_id TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(schedule_id)`,
  // Named so a re-run can detect it; guarded because ADD CONSTRAINT has no
  // IF NOT EXISTS in Postgres.
  `DO $$ BEGIN
     ALTER TABLE bookings
       ADD CONSTRAINT bookings_schedule_id_fkey
       FOREIGN KEY (schedule_id) REFERENCES bus_schedules(id)
       ON DELETE SET NULL ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS max_seats_per_booking INTEGER`,
]

;(async () => {
  console.log('v6 migration — booking schedule link + per-vessel seat cap')

  for (const sql of STATEMENTS) {
    const label = sql.replace(/\s+/g, ' ').slice(0, 68)
    try {
      await p.$executeRawUnsafe(sql)
      console.log(`  ok   ${label}`)
    } catch (e) {
      console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`)
      throw e
    }
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE (table_name = 'bookings'  AND column_name = 'schedule_id')
         OR (table_name = 'vehicles'  AND column_name = 'max_seats_per_booking')
      ORDER BY table_name`
  )
  console.log('\n  added:')
  cols.forEach((c) => console.log(`    ${c.table_name}.${c.column_name}`))

  if (cols.length !== 2) {
    throw new Error(`expected 2 columns, found ${cols.length}`)
  }

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
