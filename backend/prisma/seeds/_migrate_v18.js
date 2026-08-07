/**
 * v18 migration — page revisions. Additive only, safe to re-run.
 *
 * A snapshot of a page as it was, taken before every change that overwrites
 * it. Written because this CMS has already lost content once: a bulk
 * sanitising pass stripped a <style> block it should have kept, and there was
 * no earlier copy of the page anywhere.
 *
 * Two decisions worth stating.
 *
 * `page_id` is a plain column, not a foreign key. A revision has to outlive
 * the page — the version you most want back is the one from just before
 * someone deleted it, and a cascade would take exactly that away. Orphaned
 * rows are the price, and pruning keeps them bounded.
 *
 * Every field is stored, not a diff. A diff is smaller and needs the whole
 * chain intact to reconstruct anything; a snapshot restores on its own, which
 * is the only property that matters at the moment you need one.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS page_revisions (
     id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     page_id            TEXT NOT NULL,
     title              VARCHAR(255) NOT NULL,
     slug               VARCHAR(255) NOT NULL,
     html_content       TEXT,
     meta_title         VARCHAR(255),
     meta_description   TEXT,
     featured_image_url VARCHAR(500),
     schema_json        TEXT,
     is_published       BOOLEAN NOT NULL DEFAULT true,
     -- Why the snapshot was taken: EDIT, DELETE, RESTORE or BULK.
     reason             VARCHAR(20) NOT NULL DEFAULT 'EDIT',
     created_by_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
     created_at         TIMESTAMP NOT NULL DEFAULT now()
   )`,
  // The history of one page, newest first — the only read this table gets.
  `CREATE INDEX IF NOT EXISTS page_revisions_page_idx
     ON page_revisions (page_id, created_at DESC)`,
  // Finding deleted pages to restore.
  `CREATE INDEX IF NOT EXISTS page_revisions_reason_idx
     ON page_revisions (reason, created_at DESC)`,
]

;(async () => {
  console.log('v18 migration — page revisions\n')

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

  // Seed one revision per existing page, so today's content is recoverable
  // rather than every page starting with an empty history.
  const pages = await p.customPage.findMany()
  let seeded = 0
  for (const page of pages) {
    const already = await p.pageRevision.count({ where: { pageId: page.id } })
    if (already > 0) continue
    await p.pageRevision.create({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        htmlContent: page.htmlContent,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        featuredImageUrl: page.featuredImageUrl,
        schemaJson: page.schemaJson,
        isPublished: page.isPublished,
        reason: 'BULK',
      },
    })
    seeded += 1
    console.log(`  ok   baseline revision for ${page.slug}`)
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'page_revisions'`
  )
  console.log(`\n  columns: ${cols.length}/13 | baselines written: ${seeded}`)
  if (cols.length !== 13) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
