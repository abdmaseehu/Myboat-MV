/**
 * Where uploaded files live.
 *
 * The container's disk is wiped on every redeploy, which is survivable for a
 * vessel photo and not for a bank transfer slip. Files go to Supabase Storage
 * when it is configured, and to the local disk when it is not, so a developer
 * with no keys still gets a working app.
 *
 * Two buckets, because the two kinds of file need different answers to "who
 * may read this":
 *
 *   public   vessel photos, logos, site images — anyone with the link
 *   private  transfer slips — a customer's bank details are on them, so they
 *            are readable only through a signed URL minted for someone the
 *            server has already authorised
 *
 * Callers deal in keys, never URLs or paths. A key is what goes in the
 * database, and it is stable across drivers: the same filename works whether
 * it sits on disk or in a bucket, so switching does not rewrite any rows.
 */
const fs = require('fs');
const path = require('path');

const LOCAL_DIR = path.join(__dirname, '../../public/uploads');

const PUBLIC_BUCKET = process.env.SUPABASE_BUCKET_PUBLIC || 'uploads';
const PRIVATE_BUCKET = process.env.SUPABASE_BUCKET_PRIVATE || 'private-uploads';

/** How long a signed slip URL stays valid. Long enough to open, short enough
 *  that a copied link is not a permanent back door. */
const SIGNED_URL_TTL_SECONDS = 300;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let client = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  // Required lazily so a missing dependency cannot break local-disk installs.
  const { createClient } = require('@supabase/supabase-js');
  client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const usingSupabase = () => !!client;
const bucketFor = (visibility) => (visibility === 'private' ? PRIVATE_BUCKET : PUBLIC_BUCKET);

/**
 * Create the buckets on first use.
 *
 * Doing it here rather than in a setup script means a fresh deployment works
 * without anyone remembering a manual step. Cached per bucket: the check is a
 * network call and every upload would otherwise pay for it.
 */
const ensured = new Set();
async function ensureBucket(bucket, isPublic) {
  if (!client || ensured.has(bucket)) return;
  const { data } = await client.storage.getBucket(bucket);
  if (!data) {
    const { error } = await client.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: '10MB',
    });
    // A parallel request may have won the race; that is the outcome we wanted.
    if (error && !/exists/i.test(error.message)) throw error;
  }
  ensured.add(bucket);
}

/**
 * Store a file and return its key.
 *
 * @param {object} o
 * @param {Buffer} o.buffer
 * @param {string} o.filename     key to store under
 * @param {string} [o.contentType]
 * @param {'public'|'private'} [o.visibility]
 */
async function putObject({ buffer, filename, contentType, visibility = 'public' }) {
  if (!client) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
    return filename;
  }

  const bucket = bucketFor(visibility);
  await ensureBucket(bucket, visibility !== 'private');

  const { error } = await client.storage.from(bucket).upload(filename, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return filename;
}

/**
 * A browser-usable URL for a public object, or null when there is nothing to
 * point at. Private objects are never public — use signedUrl.
 */
function publicUrl(key) {
  if (!key) return null;
  if (!client) return `/uploads/${key}`;
  const { data } = client.storage.from(PUBLIC_BUCKET).getPublicUrl(key);
  return data?.publicUrl || null;
}

/**
 * A short-lived URL for a private object, for a viewer the caller has already
 * authorised. Falls back to the local path when running without Supabase,
 * where the file is on disk and access control is the route's business.
 */
async function signedUrl(key, expiresIn = SIGNED_URL_TTL_SECONDS) {
  if (!key) return null;
  if (!client) return `/uploads/${key}`;
  await ensureBucket(PRIVATE_BUCKET, false);
  const { data, error } = await client.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(key, expiresIn);
  if (error) throw new Error(`Could not sign URL: ${error.message}`);
  return data?.signedUrl || null;
}

/** Best-effort removal. A file that is already gone is the outcome we wanted. */
async function removeObject(key, visibility = 'public') {
  if (!key) return;
  if (!client) {
    try {
      fs.unlinkSync(path.join(LOCAL_DIR, key));
    } catch {
      /* already gone */
    }
    return;
  }
  await client.storage.from(bucketFor(visibility)).remove([key]);
}

/** True when the object exists locally — the fallback route needs to know. */
const existsLocally = (key) => !!key && fs.existsSync(path.join(LOCAL_DIR, key));

module.exports = {
  putObject,
  publicUrl,
  signedUrl,
  removeObject,
  existsLocally,
  usingSupabase,
  LOCAL_DIR,
  PUBLIC_BUCKET,
  PRIVATE_BUCKET,
};
