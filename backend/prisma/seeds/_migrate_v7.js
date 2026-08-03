/**
 * v7 migration — additive only, safe to re-run.
 *
 * Private charter + logistics as bookable services rather than quote-only:
 *
 *  - vehicles.service_types        which services a vessel is offered for
 *                                  (FERRY / PRIVATE_CHARTER / LOGISTICS)
 *  - vehicles.charter_*            charter pricing mode + instant booking
 *  - vehicles.cargo_types etc.     logistics capability
 *  - charter_rates                 flat per-island-pair charter price
 *  - logistics_rates               per-ton or flat price, by route/atoll/nationwide
 *
 * Existing vessels are backfilled to ["FERRY"] so nothing disappears from the
 * ferry search.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  // ------------------------------------------------------------- vehicles
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS service_types JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charter_pricing_mode VARCHAR(10) DEFAULT 'QUOTE'`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charter_instant_booking BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cargo_types JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity_tons NUMERIC(10,2)`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS logistics_coverage VARCHAR(12)`,
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS logistics_atolls JSONB DEFAULT '[]'::jsonb`,

  // Everything that exists today is a ferry.
  `UPDATE vehicles
      SET service_types = '["FERRY"]'::jsonb
    WHERE service_types IS NULL
       OR jsonb_array_length(service_types) = 0`,

  // -------------------------------------------------------- charter_rates
  `CREATE TABLE IF NOT EXISTS charter_rates (
     id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     vehicle_id  TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
     from_island TEXT NOT NULL,
     to_island   TEXT NOT NULL,
     price_mvr   NUMERIC(12,2),
     price_usd   NUMERIC(12,2),
     quote_only  BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
     UNIQUE (vehicle_id, from_island, to_island)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_charter_rates_pair ON charter_rates(from_island, to_island)`,

  // ------------------------------------------------------ logistics_rates
  `CREATE TABLE IF NOT EXISTS logistics_rates (
     id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     vehicle_id  TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
     coverage    VARCHAR(12) NOT NULL DEFAULT 'ROUTE',
     from_island TEXT,
     to_island   TEXT,
     atoll_code  VARCHAR(6),
     basis       VARCHAR(10) NOT NULL DEFAULT 'PER_TON',
     price_mvr   NUMERIC(12,2),
     price_usd   NUMERIC(12,2),
     quote_only  BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_logistics_rates_vehicle ON logistics_rates(vehicle_id, coverage)`,
  `CREATE INDEX IF NOT EXISTS idx_logistics_rates_pair ON logistics_rates(from_island, to_island)`,
]

;(async () => {
  console.log('v7 migration — charter + logistics as bookable services\n')

  for (const sql of STATEMENTS) {
    const label = sql.replace(/\s+/g, ' ').slice(0, 66)
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
      WHERE table_name = 'vehicles'
        AND column_name IN ('service_types','charter_pricing_mode',
                            'charter_instant_booking','cargo_types',
                            'capacity_tons','logistics_coverage','logistics_atolls')`
  )
  const tables = await p.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('charter_rates','logistics_rates')`
  )
  const ferries = await p.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM vehicles WHERE service_types @> '["FERRY"]'::jsonb`
  )

  console.log(`\n  vehicles: ${cols.length}/7 new columns`)
  console.log(`  tables:   ${tables.map((t) => t.table_name).join(', ') || 'none'}`)
  console.log(`  ${ferries[0].n} existing vessel(s) marked as FERRY`)

  if (cols.length !== 7 || tables.length !== 2) {
    throw new Error('migration incomplete')
  }

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
