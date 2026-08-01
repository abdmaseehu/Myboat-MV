/**
 * v4 migration — additive only, safe to re-run.
 *
 *  - islands            master list of Maldives locations (for route dropdowns)
 *  - notifications      in-app notifications (quote sent, request accepted, ...)
 *  - vehicles.images    JSON array of up to 5 image paths
 *  - charter/logistics  richer quote fields (per-ton, per-NM, waiting charges...)
 */
const { PrismaClient } = require('@prisma/client')
const { buildRows } = require('./islands')

const p = new PrismaClient()

const STATEMENTS = [
  // ---------------------------------------------------------------- islands
  `DO $$ BEGIN
     CREATE TYPE island_type AS ENUM ('INHABITED','RESORT','AIRPORT','INDUSTRIAL');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `CREATE TABLE IF NOT EXISTS islands (
     id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     name        TEXT NOT NULL,
     atoll_code  VARCHAR(6) NOT NULL,
     atoll_name  TEXT NOT NULL,
     type        island_type NOT NULL DEFAULT 'INHABITED',
     label       TEXT NOT NULL,
     latitude    NUMERIC(9,6),
     longitude   NUMERIC(9,6),
     is_active   BOOLEAN NOT NULL DEFAULT true,
     created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
     UNIQUE (name, atoll_code)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_islands_atoll ON islands(atoll_code)`,
  `CREATE INDEX IF NOT EXISTS idx_islands_type ON islands(type)`,
  `CREATE INDEX IF NOT EXISTS idx_islands_active ON islands(is_active)`,

  // ---------------------------------------------------------- notifications
  `DO $$ BEGIN
     CREATE TYPE notification_type AS ENUM (
       'QUOTE_RECEIVED','QUOTE_ACCEPTED','QUOTE_REJECTED',
       'REQUEST_RECEIVED','BOOKING_CONFIRMED','BOOKING_CANCELLED',
       'PAYMENT_RECEIVED','GENERAL'
     );
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `CREATE TABLE IF NOT EXISTS notifications (
     id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     type        notification_type NOT NULL DEFAULT 'GENERAL',
     title       TEXT NOT NULL,
     body        TEXT,
     link        TEXT,
     entity_type VARCHAR(40),
     entity_id   TEXT,
     is_read     BOOLEAN NOT NULL DEFAULT false,
     read_at     TIMESTAMP,
     created_at  TIMESTAMP NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`,

  // ------------------------------------------------------- vessel gallery
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb`,

  // -------------------------------------------------- richer quote fields
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS price_per_nm NUMERIC(12,2)`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS estimated_distance_nm NUMERIC(10,2)`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS waiting_charges TEXT`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS price_includes TEXT`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS quote_notes TEXT`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS quote_valid_until DATE`,
  `ALTER TABLE charter_requests   ADD COLUMN IF NOT EXISTS booking_id TEXT`,

  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS price_per_ton NUMERIC(12,2)`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS price_per_nm NUMERIC(12,2)`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS estimated_distance_nm NUMERIC(10,2)`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS waiting_charges TEXT`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS price_includes TEXT`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS quote_notes TEXT`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS quote_valid_until DATE`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS booking_id TEXT`,
]

;(async () => {
  console.log('Applying v4 schema changes...\n')
  let ok = 0
  for (const sql of STATEMENTS) {
    try {
      await p.$executeRawUnsafe(sql)
      ok++
    } catch (e) {
      console.log('  FAIL:', sql.slice(0, 70).replace(/\s+/g, ' '), '->', e.message.slice(0, 120))
    }
  }
  console.log(`  ${ok}/${STATEMENTS.length} statements applied\n`)

  // ------------------------------------------------------------- seed islands
  const rows = buildRows()
  console.log(`Seeding ${rows.length} locations...`)

  let inserted = 0
  for (const r of rows) {
    try {
      await p.$executeRawUnsafe(
        `INSERT INTO islands (name, atoll_code, atoll_name, type, label)
         VALUES ($1, $2, $3, $4::island_type, $5)
         ON CONFLICT (name, atoll_code) DO UPDATE
           SET label = EXCLUDED.label,
               type = EXCLUDED.type,
               atoll_name = EXCLUDED.atoll_name,
               updated_at = NOW()`,
        r.name, r.atollCode, r.atollName, r.type, r.label
      )
      inserted++
    } catch (e) {
      console.log(`  skip ${r.label}: ${e.message.slice(0, 80)}`)
    }
  }

  const counts = await p.$queryRawUnsafe(
    `SELECT type::text AS type, count(*)::int AS n FROM islands GROUP BY type ORDER BY n DESC`
  )
  console.log(`  upserted ${inserted}`)
  counts.forEach((c) => console.log(`    ${c.type.padEnd(11)} ${c.n}`))

  const total = await p.$queryRawUnsafe(`SELECT count(*)::int AS n FROM islands`)
  console.log(`  TOTAL       ${total[0].n}`)

  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
