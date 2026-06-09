// One-off backfill: downloads each pioniere's public profile photo (scraped
// from fondazionemarea.org/la-fondazione/pionieri into scripts/pioniere-avatars.json),
// uploads it to the public `avatars` Supabase Storage bucket, and sets
// pionieri.avatar_url to the resulting public URL.
//
// Idempotent — skips pionieri that already have an avatar_url unless --force.
// Run the avatars migration first: sql_queries/supabase-migration-avatars.sql
//
// Run:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-pioniere-avatars.js
//   (append --force to re-upload rows that already have an avatar)

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const PLACEHOLDER_HASHES = new Set(require('./placeholder-hashes'))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FORCE = process.argv.includes('--force')
const BUCKET = 'avatars'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

async function main() {
  const mapping = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'pioniere-avatars.json'), 'utf8')
  )
  console.log(`Loaded ${mapping.length} avatar mappings.`)

  // Which pionieri already have an avatar? (skip unless --force)
  const { data: existing, error: existErr } = await admin
    .from('pionieri')
    .select('id, avatar_url')
  if (existErr) throw existErr
  const hasAvatar = new Set(existing.filter(r => r.avatar_url).map(r => r.id))
  const validId = new Set(existing.map(r => r.id))

  let uploaded = 0, skipped = 0, missing = 0, failed = 0, placeholder = 0
  for (const { id, full_name, source_image } of mapping) {
    if (!validId.has(id)) {
      console.warn(`  ✗ ${full_name}: id ${id} no longer exists, skipping`)
      missing++
      continue
    }
    if (hasAvatar.has(id) && !FORCE) {
      skipped++
      continue
    }
    try {
      // scale-down-to preserves aspect ratio (vs width+height which would crop)
      const res = await fetch(`${source_image}?scale-down-to=512`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim()
      const ext = EXT_BY_TYPE[contentType] || 'jpg'
      const buffer = Buffer.from(await res.arrayBuffer())

      // Skip the site's "no photo" placeholder — leave avatar_url null so the
      // app falls back to initials.
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      if (PLACEHOLDER_HASHES.has(hash)) {
        placeholder++
        continue
      }
      const objectPath = `${id}.${ext}`

      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(objectPath, buffer, { contentType, upsert: true })
      if (upErr) throw upErr

      // Bucket is private: store the bare object key, not a URL. The app mints
      // short-lived signed URLs at render time (see src/utils/avatar.js).
      const { error: updErr } = await admin
        .from('pionieri')
        .update({ avatar_url: objectPath })
        .eq('id', id)
      if (updErr) throw updErr

      uploaded++
      if (uploaded % 25 === 0) console.log(`  ...${uploaded} uploaded`)
    } catch (err) {
      console.error(`  ✗ ${full_name} (${id}): ${err.message}`)
      failed++
    }
  }

  console.log(
    `\nDone. uploaded=${uploaded} skipped(existing)=${skipped} placeholder=${placeholder} missing-id=${missing} failed=${failed}`
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
