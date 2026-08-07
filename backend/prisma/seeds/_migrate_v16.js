/**
 * v16 migration — featured images on custom pages. Additive only, safe to
 * re-run.
 *
 * The hero banner at the top of a page and the picture that appears when its
 * link is shared are the same image in practice, so one column feeds both: the
 * banner above the body, and the og:image and twitter:image tags that decide
 * what a link looks like in WhatsApp, Viber and Facebook.
 *
 * A URL rather than an upload, because a page can just as well point at an
 * image already hosted elsewhere. Anything uploaded through the platform's own
 * storage is reachable at /uploads/<key>, so that path works here too.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

;(async () => {
  console.log('v16 migration — featured images\n')

  const sql = `ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS featured_image_url VARCHAR(500)`
  try {
    await p.$executeRawUnsafe(sql)
    console.log(`  ok   ${sql}`)
  } catch (e) {
    console.log(`  FAIL ${sql}\n       ${e.message.split('\n')[0]}`)
    throw e
  }

  const cols = await p.$queryRawUnsafe(
    `SELECT column_name, data_type, character_maximum_length
       FROM information_schema.columns
      WHERE table_name = 'custom_pages' AND column_name = 'featured_image_url'`
  )
  console.log(`\n  column: ${cols.length ? `${cols[0].column_name} ${cols[0].data_type}(${cols[0].character_maximum_length})` : 'MISSING'}`)
  if (!cols.length) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
