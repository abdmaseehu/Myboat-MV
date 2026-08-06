/**
 * v10 migration — additive only, safe to re-run.
 *
 *  - bookings.markup_amount / platform_fee_amount / vendor_net_amount
 *      The fare ledger, so every booking records who the money belonged to
 *      rather than leaving it to be recomputed later from settings that may
 *      since have changed.
 *
 *  - GLOBAL_PLATFORM_FLAT_FEE_USD
 *      There was one flat fee for both currencies. Charging "15" on an MVR fare
 *      and on a USD fare is an implicit 1:1 conversion — roughly a 15x
 *      difference in real terms — which breaks the rule that MVR and USD stay
 *      independent. The existing key keeps its meaning as the MVR fee; this is
 *      its USD counterpart, seeded at 0 so nothing starts charging by surprise.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS markup_amount NUMERIC(10,2) DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2) DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vendor_net_amount NUMERIC(10,2) DEFAULT 0`,
]

;(async () => {
  console.log('v10 migration — fare ledger + per-currency flat fee\n')

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

  // Rename the existing key's description so its currency is unambiguous.
  await p.setting
    .update({
      where: { keyName: 'GLOBAL_PLATFORM_FLAT_FEE' },
      data: { description: 'Flat platform fee added to every MVR booking' },
    })
    .catch(() => {})

  const usd = await p.setting.findUnique({
    where: { keyName: 'GLOBAL_PLATFORM_FLAT_FEE_USD' },
  })
  if (usd) {
    console.log(`  skip settings.GLOBAL_PLATFORM_FLAT_FEE_USD (already ${JSON.stringify(usd.value)})`)
  } else {
    await p.setting.create({
      data: {
        keyName: 'GLOBAL_PLATFORM_FLAT_FEE_USD',
        value: '0',
        type: 'NUMBER',
        description: 'Flat platform fee added to every USD booking',
      },
    })
    console.log('  ok   settings.GLOBAL_PLATFORM_FLAT_FEE_USD = 0')
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bookings'
        AND column_name IN ('markup_amount','platform_fee_amount','vendor_net_amount')`
  )
  console.log(`\n  ledger columns: ${cols.length}/3`)
  if (cols.length !== 3) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
