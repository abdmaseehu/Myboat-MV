/**
 * v19 migration — the media library. Additive only, safe to re-run.
 *
 * Files already go to object storage; what was missing was any record that
 * they exist. Without one there is nothing to list, so adding an image to a
 * page meant hosting it somewhere else and pasting a URL — the storage was
 * built and then unusable from the CMS.
 *
 * This table is an index over the bucket, not a copy of it. The `key` is the
 * same string every other upload column already holds, so a row here and a
 * vessel photo elsewhere point at the same object in the same way.
 */
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS media_assets (
     id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     -- The storage key: what /uploads/<key> resolves to, bucket or disk.
     storage_key    VARCHAR(255) NOT NULL,
     original_name  VARCHAR(255),
     mime_type      VARCHAR(100),
     size_bytes     INTEGER,
     -- Editable after the fact: alt text is usually written later, by someone
     -- other than whoever dragged the file in.
     alt_text       VARCHAR(255),
     uploaded_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
     created_at     TIMESTAMP NOT NULL DEFAULT now(),
     updated_at     TIMESTAMP NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS media_assets_key_idx ON media_assets (storage_key)`,
  // The library is browsed newest first, always.
  `CREATE INDEX IF NOT EXISTS media_assets_created_idx ON media_assets (created_at DESC)`,
]

;(async () => {
  console.log('v19 migration — media library\n')

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
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'media_assets'`
  )
  console.log(`\n  columns: ${cols.length}/9`)
  if (cols.length !== 9) throw new Error('migration incomplete')

  await p.$disconnect()
  console.log('\ndone')
})().catch(async (e) => {
  console.error('FAILED:', e.message)
  await p.$disconnect()
  process.exit(1)
})
