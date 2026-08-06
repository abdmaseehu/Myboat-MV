/**
 * v15 migration — navigation menu items. Additive only, safe to re-run.
 *
 * The header links were an array in main-nav.jsx, so adding one meant a code
 * change and a deploy. Now that an administrator can write pages without a
 * deploy, they need to be able to link to them the same way.
 *
 * Seeded with exactly the six links the site already had, in the order it
 * already had them, so the navigation looks identical the moment this runs.
 * The old `menus` table from the bus script stays where it is: it has no URL,
 * no order and no code reading it, so it never described this.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS nav_menu_items (
     id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     label          VARCHAR(80)  NOT NULL,
     url            VARCHAR(255) NOT NULL,
     -- HEADER or FOOTER: one table, because a link is a link.
     location       VARCHAR(10)  NOT NULL DEFAULT 'HEADER',
     sort_order     INTEGER      NOT NULL DEFAULT 0,
     is_visible     BOOLEAN      NOT NULL DEFAULT true,
     open_in_new_tab BOOLEAN     NOT NULL DEFAULT false,
     created_at     TIMESTAMP    NOT NULL DEFAULT now(),
     updated_at     TIMESTAMP    NOT NULL DEFAULT now()
   )`,
  // Every render reads one location in order.
  `CREATE INDEX IF NOT EXISTS nav_menu_items_location_idx
     ON nav_menu_items (location, sort_order)`,
]

// What main-nav.jsx hard-coded, in its order.
const HEADER_LINKS = [
  ['Home', '/'],
  ['Ferry', '/bus-tickets'],
  ['Charter', '/charter'],
  ['Logistics', '/logistics'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

;(async () => {
  console.log('v15 migration — navigation menus\n')

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

  // Seed only into an empty header: re-running must never resurrect a link an
  // administrator has since deleted.
  const existing = await p.navMenuItem.count({ where: { location: 'HEADER' } })
  if (existing > 0) {
    console.log(`\n  skip seeding — ${existing} header link(s) already configured`)
  } else {
    for (const [i, [label, url]] of HEADER_LINKS.entries()) {
      await p.navMenuItem.create({
        data: { label, url, location: 'HEADER', sortOrder: (i + 1) * 10 },
      })
      console.log(`  ok   header ${i + 1}. ${label} -> ${url}`)
    }
  }

  const rows = await p.navMenuItem.findMany({
    where: { location: 'HEADER' },
    orderBy: { sortOrder: 'asc' },
    select: { label: true, url: true },
  })
  console.log(`\n  header menu: ${rows.map((r) => r.label).join(' | ')}`)
  if (rows.length === 0) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
