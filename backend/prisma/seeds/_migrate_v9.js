/**
 * v9 migration — additive only, safe to re-run.
 *
 * Marketplace pricing and agent partnerships:
 *
 *  - UserRole gains AGENT (guesthouses/resorts selling operators' seats)
 *  - route_markups: admin-defined markup per route, per passenger tier
 *  - global platform commission settings + the agent commission/discount ceiling
 *
 * Deliberately NOT changed:
 *  - Schedule tier pricing already exists as price_local_mvr / price_expat_mvr /
 *    price_tourist_usd, all Decimal(10,2). The currency suffix is what keeps MVR
 *    and USD independent, so those columns stay as they are.
 *  - Agent partnerships already live in operator_agents, which carries status,
 *    commission_percent, discount_percent, cascading deletes and a unique
 *    (vendor, user) pair. It is extended rather than duplicated.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

// Platform-wide commission knobs, created empty so the admin UI has rows to
// write into. A missing row would otherwise read as "unset" and be ambiguous.
const SETTINGS = [
  ['GLOBAL_PLATFORM_PERCENTAGE', '0', 'Platform cut taken from every booking, as a percentage'],
  ['GLOBAL_PLATFORM_FLAT_FEE', '0', 'Flat platform fee added to every booking'],
  ['AGENT_MAX_COMMISSION_PERCENT', '25', 'Ceiling an operator may grant an agent as commission'],
  ['AGENT_MAX_DISCOUNT_PERCENT', '25', 'Ceiling an operator may grant an agent as discount'],
]

const STATEMENTS = [
  // ------------------------------------------------------------ AGENT role
  // ADD VALUE IF NOT EXISTS is idempotent, but cannot run inside a
  // transaction block on older Postgres — executed on its own here.
  `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AGENT'`,

  // --------------------------------------------------------- route_markups
  `CREATE TABLE IF NOT EXISTS route_markups (
     id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     route_id       TEXT NOT NULL UNIQUE
                      REFERENCES routes(id) ON DELETE CASCADE ON UPDATE CASCADE,
     markup_local   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
     markup_expat   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
     markup_tourist NUMERIC(10,2) NOT NULL DEFAULT 0.00,
     created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_route_markups_route ON route_markups(route_id)`,
]

;(async () => {
  console.log('v9 migration — agent role, route markups, platform commission\n')

  for (const sql of STATEMENTS) {
    const label = sql.replace(/\s+/g, ' ').slice(0, 64)
    try {
      await p.$executeRawUnsafe(sql)
      console.log(`  ok   ${label}`)
    } catch (e) {
      console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`)
      throw e
    }
  }

  for (const [keyName, value, description] of SETTINGS) {
    const existing = await p.setting.findUnique({ where: { keyName } })
    if (existing) {
      console.log(`  skip settings.${keyName} (already ${JSON.stringify(existing.value)})`)
      continue
    }
    await p.setting.create({
      data: { keyName, value, type: 'NUMBER', description },
    })
    console.log(`  ok   settings.${keyName} = ${value}`)
  }

  // ---------------------------------------------------------------- verify
  const roles = await p.$queryRawUnsafe(
    `SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS vals
       FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'UserRole'`
  )
  const tbl = await p.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = 'route_markups'`
  )
  const cfg = await p.setting.count({
    where: { keyName: { in: SETTINGS.map((s) => s[0]) } },
  })

  console.log(`\n  UserRole      ${roles[0].vals}`)
  console.log(`  route_markups ${tbl[0].n === 1 ? 'created' : 'MISSING'}`)
  console.log(`  settings      ${cfg}/${SETTINGS.length}`)

  if (!String(roles[0].vals).includes('AGENT') || tbl[0].n !== 1 || cfg !== SETTINGS.length) {
    throw new Error('migration incomplete')
  }

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
