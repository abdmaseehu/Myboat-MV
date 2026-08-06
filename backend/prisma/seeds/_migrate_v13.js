/**
 * v13 migration — logistics commission, payment slips, and operator invoices.
 * Additive only, safe to re-run.
 *
 * Logistics money moves differently from anything else on the platform: the
 * customer pays the operator's own bank account directly. Myboat never holds
 * the funds, so its share cannot be deducted at the till — it becomes a debt
 * the operator settles afterwards.
 *
 * That gives three parts:
 *
 *   1. the ledger on the request, so a completed order knows what it owes
 *        quoted_price = vendor_net_amount + platform_cut_amount
 *
 *   2. the payment slip, since a transfer that happened in a bank app is
 *      invisible here. The customer uploads proof and that is what "submitted"
 *      means for a logistics order.
 *
 *   3. platform_invoices — one per completed order, for the cut the operator
 *      now owes. A row rather than a computed total: it has a life of its own
 *      (issued, chased, paid on a date, by someone) that arithmetic over
 *      requests cannot record.
 *
 * Both a markup and a commission apply here, and they are not the same thing:
 * a markup is added on top and paid by the customer, a commission comes out of
 * the operator's share. The operator collects the whole public price, so what
 * they owe Myboat is both parts together.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  // 1. the ledger
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS vendor_quoted_price NUMERIC(12,2)`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS platform_cut_amount NUMERIC(12,2) DEFAULT 0`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS vendor_net_amount NUMERIC(12,2)`,

  // 2. the payment slip
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS payment_slip VARCHAR(255)`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS payment_slip_uploaded_at TIMESTAMP`,
  `ALTER TABLE logistics_requests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'UNPAID'`,

  // 3. what the operator owes Myboat
  `CREATE TABLE IF NOT EXISTS platform_invoices (
     id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     invoice_number VARCHAR(40)  NOT NULL UNIQUE,
     vendor_id      TEXT         NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
     request_type   VARCHAR(20)  NOT NULL,
     request_id     TEXT         NOT NULL,
     amount         NUMERIC(12,2) NOT NULL,
     currency       VARCHAR(3)    NOT NULL,
     markup_amount     NUMERIC(12,2) DEFAULT 0,
     commission_amount NUMERIC(12,2) DEFAULT 0,
     order_total    NUMERIC(12,2),
     status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
     issued_at      TIMESTAMP    NOT NULL DEFAULT now(),
     paid_at        TIMESTAMP,
     marked_by_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
     notes          TEXT,
     created_at     TIMESTAMP    NOT NULL DEFAULT now(),
     updated_at     TIMESTAMP    NOT NULL DEFAULT now()
   )`,
  // One invoice per order, whatever happens to its status afterwards.
  `CREATE UNIQUE INDEX IF NOT EXISTS platform_invoices_order_key
     ON platform_invoices (request_type, request_id)`,
  `CREATE INDEX IF NOT EXISTS platform_invoices_vendor_idx
     ON platform_invoices (vendor_id, status)`,
]

const SETTINGS = [
  ['LOGISTICS_MARKUP_MODE', 'PERCENT', 'TEXT', 'Logistics markup: PERCENT or FLAT'],
  ['LOGISTICS_MARKUP_PERCENT', '0', 'NUMBER', 'Logistics markup added on top of the operator quote, as a %'],
  ['LOGISTICS_MARKUP_FLAT_MVR', '0', 'NUMBER', 'Logistics markup added on top of MVR quotes'],
  ['LOGISTICS_MARKUP_FLAT_USD', '0', 'NUMBER', 'Logistics markup added on top of USD quotes'],
  ['LOGISTICS_COMMISSION_PERCENT', '0', 'NUMBER', 'Logistics commission taken from the operator quote, as a %'],
]

;(async () => {
  console.log('v13 migration — logistics commission, slips, operator invoices\n')

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

  // Everything quoted so far was quoted with the dials at zero.
  const filled = await p.$executeRawUnsafe(
    `UPDATE logistics_requests
        SET vendor_quoted_price = quoted_price,
            platform_cut_amount = 0,
            vendor_net_amount   = quoted_price
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
      WHERE table_name = 'logistics_requests'
        AND column_name IN ('vendor_quoted_price','platform_cut_amount','vendor_net_amount',
                            'payment_slip','payment_slip_uploaded_at','payment_status')`
  )
  const tbl = await p.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'platform_invoices'`
  )
  console.log(`\n  logistics columns: ${cols.length}/6 | platform_invoices: ${tbl.length}/1`)
  if (cols.length !== 6 || tbl.length !== 1) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
