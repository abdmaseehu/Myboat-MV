/**
 * One-shot backfill, safe to re-run.
 *
 * Vendors were created without a publicSlug, and both the public profile URL
 * and every embed code are derived from it — so the operator's Share panel
 * rendered an empty box with no explanation. Derive a slug from the business
 * name, keeping it unique.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const normalizeSlug = (raw) =>
  String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

;(async () => {
  const vendors = await p.vendor.findMany({
    where: { OR: [{ publicSlug: null }, { publicSlug: '' }] },
    select: { id: true, businessName: true },
  })

  console.log(`${vendors.length} operator(s) without a public URL\n`)

  // Seed with slugs already in use so we never collide.
  const taken = new Set(
    (
      await p.vendor.findMany({
        where: { publicSlug: { not: null } },
        select: { publicSlug: true },
      })
    ).map((v) => v.publicSlug)
  )

  for (const v of vendors) {
    const base = normalizeSlug(v.businessName) || 'operator'
    let slug = base
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
    taken.add(slug)

    await p.vendor.update({ where: { id: v.id }, data: { publicSlug: slug } })
    console.log(`  ${JSON.stringify(v.businessName)} -> /o/${slug}`)
  }

  const remaining = await p.vendor.count({
    where: { OR: [{ publicSlug: null }, { publicSlug: '' }] },
  })
  console.log(`\ndone — ${remaining} operator(s) still without a slug`)

  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
