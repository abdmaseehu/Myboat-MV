/**
 * v14 migration — custom_pages. Additive only, safe to re-run.
 *
 * Editorial pages an administrator writes from the dashboard: island guides,
 * landing pages, policy text. The body is raw HTML because the point is to
 * paste a layout with its own styles and widgets, which a rich-text field
 * would strip.
 *
 * The slug holds a whole path rather than one segment — 'maldives/kaafu-atoll/
 * huraa-guide' is one row, not three — so nesting costs no extra table and no
 * recursive query. It is unique and indexed because every page view looks a
 * row up by exactly that string.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS custom_pages (
     id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     title            VARCHAR(255) NOT NULL,
     slug             VARCHAR(255) NOT NULL,
     html_content     TEXT,
     meta_title       VARCHAR(255),
     meta_description TEXT,
     schema_json      TEXT,
     is_published     BOOLEAN NOT NULL DEFAULT true,
     created_at       TIMESTAMP NOT NULL DEFAULT now(),
     updated_at       TIMESTAMP NOT NULL DEFAULT now()
   )`,
  // The lookup every page view makes, and the guarantee that two pages cannot
  // claim the same path.
  `CREATE UNIQUE INDEX IF NOT EXISTS custom_pages_slug_key ON custom_pages (slug)`,
  // Listing in the admin table is newest-first.
  `CREATE INDEX IF NOT EXISTS custom_pages_updated_idx ON custom_pages (updated_at DESC)`,
]

;(async () => {
  console.log('v14 migration — custom pages\n')

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
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'custom_pages'`
  )
  const idx = await p.$queryRawUnsafe(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'custom_pages'`
  )
  console.log(`\n  columns: ${cols.length}/10 | indexes: ${idx.length}`)
  if (cols.length !== 10) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
