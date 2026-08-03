/**
 * v8 migration — additive only, safe to re-run.
 *
 *  - charter_requests.admin_direct
 *  - logistics_requests.admin_direct
 *
 * "Request Boat MV" sends a request to Myboat staff to source a boat. Before
 * this it was stored with vendorId = NULL, which operators read as a broadcast
 * and could pick up themselves. The flag separates the two so operators only
 * see requests actually meant for them.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE charter_requests
     ADD COLUMN IF NOT EXISTS admin_direct BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE logistics_requests
     ADD COLUMN IF NOT EXISTS admin_direct BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS idx_charter_requests_admin_direct
     ON charter_requests(admin_direct)`,
  `CREATE INDEX IF NOT EXISTS idx_logistics_requests_admin_direct
     ON logistics_requests(admin_direct)`,
]

;(async () => {
  console.log('v8 migration — direct-to-admin boat requests\n')

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
    `SELECT table_name FROM information_schema.columns
      WHERE column_name = 'admin_direct'
        AND table_name IN ('charter_requests','logistics_requests')
      ORDER BY table_name`
  )
  console.log(`\n  added to: ${cols.map((c) => c.table_name).join(', ') || 'nothing'}`)
  if (cols.length !== 2) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
