/**
 * v12 migration — charter quotes take a commission, not a markup.
 *
 * A published rate and a quote are not the same transaction:
 *
 *   published rate   priced in advance, so Myboat's cut is added on top and
 *                    the operator still receives the figure they published
 *   quote            the operator has often already named that price to the
 *                    customer, so adding to it would change a price they were
 *                    told. The cut comes out of the operator's share instead:
 *                    the customer pays the quote, the operator receives the
 *                    rest.
 *
 * So the column that held "what we added" now holds "what we keep, however we
 * came by it", and vendor_net_amount records what the operator actually
 * receives. One invariant covers both paths:
 *
 *   quoted_price = vendor_net_amount + platform_cut_amount
 *
 * Renaming rather than adding a second column keeps a charter from carrying
 * two fields where only one is ever populated.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const colExists = async (column) => {
  const rows = await p.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = 'charter_requests' AND column_name = $1`,
    column
  )
  return rows.length > 0
}

;(async () => {
  console.log('v12 migration — charter commission on quotes\n')

  if (await colExists('platform_markup_amount')) {
    if (await colExists('platform_cut_amount')) {
      // Both present: a partial earlier run. Keep the new one.
      await p.$executeRawUnsafe(`ALTER TABLE charter_requests DROP COLUMN platform_markup_amount`)
      console.log('  ok   dropped leftover platform_markup_amount')
    } else {
      await p.$executeRawUnsafe(
        `ALTER TABLE charter_requests RENAME COLUMN platform_markup_amount TO platform_cut_amount`
      )
      console.log('  ok   platform_markup_amount -> platform_cut_amount')
    }
  } else {
    await p.$executeRawUnsafe(
      `ALTER TABLE charter_requests ADD COLUMN IF NOT EXISTS platform_cut_amount NUMERIC(12,2) DEFAULT 0`
    )
    console.log('  ok   platform_cut_amount')
  }

  await p.$executeRawUnsafe(
    `ALTER TABLE charter_requests ADD COLUMN IF NOT EXISTS vendor_net_amount NUMERIC(12,2)`
  )
  console.log('  ok   vendor_net_amount')

  // Everything priced so far was priced with the dials at zero, so the
  // operator's whole figure is theirs.
  const filled = await p.$executeRawUnsafe(
    `UPDATE charter_requests
        SET vendor_net_amount = COALESCE(quoted_price, 0) - COALESCE(platform_cut_amount, 0)
      WHERE quoted_price IS NOT NULL
        AND vendor_net_amount IS NULL`
  )
  console.log(`  ok   backfilled ${filled} priced request(s)`)

  // A quote commission is a percentage of the operator's figure. There is no
  // flat variant to configure, so the keys for one should not exist.
  const existing = await p.setting.findUnique({
    where: { keyName: 'CHARTER_QUOTE_COMMISSION_PERCENT' },
  })
  if (existing) {
    console.log(`  skip settings.CHARTER_QUOTE_COMMISSION_PERCENT (already ${JSON.stringify(existing.value)})`)
  } else {
    // Carry across whatever percentage was already set, so turning this on is
    // not silently undone by the rename.
    const old = await p.setting.findUnique({ where: { keyName: 'CHARTER_QUOTE_MARKUP_PERCENT' } })
    const value = old?.value && String(old.value).trim() !== '' ? String(old.value) : '0'
    await p.setting.create({
      data: {
        keyName: 'CHARTER_QUOTE_COMMISSION_PERCENT',
        value,
        type: 'NUMBER',
        description: 'Charter quotes: commission taken from the operator’s quoted amount, as a %',
      },
    })
    console.log(`  ok   settings.CHARTER_QUOTE_COMMISSION_PERCENT = ${value}`)
  }

  const dead = await p.setting.deleteMany({
    where: {
      keyName: {
        in: [
          'CHARTER_QUOTE_MARKUP_MODE',
          'CHARTER_QUOTE_MARKUP_PERCENT',
          'CHARTER_QUOTE_MARKUP_FLAT_MVR',
          'CHARTER_QUOTE_MARKUP_FLAT_USD',
        ],
      },
    },
  })
  console.log(`  ok   removed ${dead.count} superseded quote setting(s)`)

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'charter_requests'
        AND column_name IN ('platform_cut_amount','vendor_net_amount','vendor_quoted_price')`
  )
  console.log(`\n  charter ledger columns: ${cols.length}/3`)
  if (cols.length !== 3) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
