/**
 * v11 migration — charter commission. Additive only, safe to re-run.
 *
 *  - charter_requests.vendor_quoted_price / platform_markup_amount
 *      A charter now carries two figures: what the operator asked for, and what
 *      Myboat added. quoted_price keeps its meaning as the price the customer
 *      is shown and pays, so every screen that already reads it stays correct.
 *      Existing rows are backfilled with vendor_quoted_price = quoted_price and
 *      a zero markup, which is exactly what happened: nothing was marked up.
 *
 *  - CHARTER_LIVE_* / CHARTER_QUOTE_*
 *      Charter has two ways to reach a price and they deserve separate dials.
 *      A published rate can be marked up in advance; a quote can only be marked
 *      up once the operator names a number. Each is a percentage or a flat
 *      amount, and the flat amount is per currency — one shared figure would be
 *      a silent 1:1 conversion between MVR and USD.
 *
 *      All seeded at 0 / PERCENT, so nothing starts charging by surprise.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `ALTER TABLE charter_requests ADD COLUMN IF NOT EXISTS vendor_quoted_price NUMERIC(12,2)`,
  `ALTER TABLE charter_requests ADD COLUMN IF NOT EXISTS platform_markup_amount NUMERIC(12,2) DEFAULT 0`,
]

const SETTINGS = [
  ['CHARTER_LIVE_MARKUP_MODE', 'PERCENT', 'TEXT', 'Charter published rates: PERCENT or FLAT'],
  ['CHARTER_LIVE_MARKUP_PERCENT', '0', 'NUMBER', 'Charter published rates: markup as a % of the operator price'],
  ['CHARTER_LIVE_MARKUP_FLAT_MVR', '0', 'NUMBER', 'Charter published rates: flat markup on MVR trips'],
  ['CHARTER_LIVE_MARKUP_FLAT_USD', '0', 'NUMBER', 'Charter published rates: flat markup on USD trips'],
  ['CHARTER_QUOTE_MARKUP_MODE', 'PERCENT', 'TEXT', 'Charter quotes: PERCENT or FLAT'],
  ['CHARTER_QUOTE_MARKUP_PERCENT', '0', 'NUMBER', 'Charter quotes: markup as a % of the amount the operator quoted'],
  ['CHARTER_QUOTE_MARKUP_FLAT_MVR', '0', 'NUMBER', 'Charter quotes: flat markup on MVR quotes'],
  ['CHARTER_QUOTE_MARKUP_FLAT_USD', '0', 'NUMBER', 'Charter quotes: flat markup on USD quotes'],
]

;(async () => {
  console.log('v11 migration — charter commission\n')

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

  // Historic quotes were the operator's own number, unmarked-up. Only fill
  // rows that have not been filled already, so re-running cannot rewrite live
  // data after the engine starts splitting the two.
  const filled = await p.$executeRawUnsafe(
    `UPDATE charter_requests
        SET vendor_quoted_price = quoted_price,
            platform_markup_amount = 0
      WHERE quoted_price IS NOT NULL
        AND vendor_quoted_price IS NULL`
  )
  console.log(`\n  backfilled ${filled} historic quote(s)`)

  for (const [keyName, value, type, description] of SETTINGS) {
    const existing = await p.setting.findUnique({ where: { keyName } })
    if (existing) {
      console.log(`  skip settings.${keyName} (already ${JSON.stringify(existing.value)})`)
    } else {
      await p.setting.create({ data: { keyName, value, type, description } })
      console.log(`  ok   settings.${keyName} = ${value}`)
    }
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'charter_requests'
        AND column_name IN ('vendor_quoted_price','platform_markup_amount')`
  )
  console.log(`\n  charter columns: ${cols.length}/2`)
  if (cols.length !== 2) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
