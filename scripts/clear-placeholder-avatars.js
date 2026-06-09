// Clears avatars that are really the foundation site's "no photo" placeholder.
// Scans every pioniere with an avatar, hashes the stored object, and for any
// match: deletes the storage object and sets avatar_url = NULL (so the app
// shows initials). Byte-based + idempotent — safe to re-run.
//
// Run:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/clear-placeholder-avatars.js

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const PLACEHOLDER_HASHES = new Set(require('./placeholder-hashes'))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'avatars'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { data, error } = await admin
    .from('pionieri')
    .select('id, full_name, avatar_url')
    .not('avatar_url', 'is', null)
  if (error) throw error
  console.log(`Scanning ${data.length} avatars...`)

  let cleared = 0, kept = 0, failed = 0
  for (const p of data) {
    try {
      const { data: blob, error: dErr } = await admin.storage.from(BUCKET).download(p.avatar_url)
      if (dErr) throw dErr
      const buffer = Buffer.from(await blob.arrayBuffer())
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      if (!PLACEHOLDER_HASHES.has(hash)) { kept++; continue }

      await admin.storage.from(BUCKET).remove([p.avatar_url]).catch(() => {})
      const { error: uErr } = await admin.from('pionieri').update({ avatar_url: null }).eq('id', p.id)
      if (uErr) throw uErr
      cleared++
      console.log(`  cleared: ${p.full_name}`)
    } catch (err) {
      failed++
      console.error(`  ✗ ${p.full_name} (${p.id}): ${err.message}`)
    }
  }
  console.log(`\nDone. cleared=${cleared} kept=${kept} failed=${failed}`)
}

main().catch(err => { console.error(err); process.exit(1) })
