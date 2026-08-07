/**
 * v17 migration — sanitise HTML already in the database. Idempotent.
 *
 * Sanitising on save protects everything written from now on and nothing
 * written before it, which would leave the oldest content — the content that
 * has been live longest — as the only content nobody ever checked.
 *
 * Rewrites a row only when cleaning actually changes it, so re-running this
 * touches nothing and `updated_at` stays honest about when a page was last
 * edited.
 */
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { sanitizeCmsHtml } = require('../../src/utils/sanitize-html')

const p = new PrismaClient()

/**
 * Everything this script is about to overwrite, written to disk first.
 *
 * Learned the hard way: the first run of this stripped a <style> block the
 * sanitiser should have kept, and there was no copy of the original anywhere.
 * A rewrite of content someone wrote is not something to do without a way back,
 * whatever confidence the rules were written with.
 */
const backupTo = path.join(__dirname, `_v17_backup.json`)

;(async () => {
  console.log('v17 migration — sanitise stored HTML\n')

  const pages = await p.customPage.findMany({
    select: { id: true, title: true, slug: true, htmlContent: true },
  })
  const footerRow = await p.setting.findUnique({ where: { keyName: 'FOOTER_HTML' } })

  fs.writeFileSync(
    backupTo,
    JSON.stringify(
      { takenAt: new Date().toISOString(), pages, footer: footerRow?.value ?? null },
      null,
      2
    )
  )
  console.log(`  ${pages.length} page(s) to check`)
  console.log(`  originals saved to ${path.basename(backupTo)} before anything is rewritten`)

  let cleaned = 0
  for (const page of pages) {
    if (!page.htmlContent) continue
    const { clean, changed, removed } = sanitizeCmsHtml(page.htmlContent)
    if (!changed) {
      console.log(`  ok   ${page.slug} — nothing to remove`)
      continue
    }
    await p.customPage.update({ where: { id: page.id }, data: { htmlContent: clean } })
    cleaned += 1
    console.log(`  CLEANED ${page.slug} — removed: ${removed.join(', ')}`)
  }

  if (footerRow?.value) {
    const { clean, changed, removed } = sanitizeCmsHtml(footerRow.value)
    if (changed) {
      await p.setting.update({ where: { keyName: 'FOOTER_HTML' }, data: { value: clean } })
      cleaned += 1
      console.log(`  CLEANED footer — removed: ${removed.join(', ')}`)
    } else {
      console.log('  ok   footer — nothing to remove')
    }
  } else {
    console.log('  skip footer — none set')
  }

  console.log(`\n  rows rewritten: ${cleaned}`)

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
