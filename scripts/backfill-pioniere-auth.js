// One-off backfill: provisions a Supabase auth.users row for every pioniere
// with an email. Idempotent — skips emails that already have an auth user
// (preserves any existing app_metadata, so admins keep their admin role).
//
// Run:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-pioniere-auth.js
//
// Or, with netlify env loaded:
//   netlify dev:exec node scripts/backfill-pioniere-auth.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function listAllAuthUsers() {
  const byEmail = new Map()
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    for (const u of data.users) {
      if (u.email) byEmail.set(u.email.toLowerCase(), u)
    }
    if (data.users.length < 200) break
    page += 1
  }
  return byEmail
}

async function main() {
  const { data: pionieri, error } = await admin
    .from('pionieri')
    .select('id, full_name, email')
  if (error) throw error

  const withEmail = pionieri.filter(p => p.email && p.email.includes('@'))
  const withoutEmail = pionieri.length - withEmail.length

  const existingByEmail = await listAllAuthUsers()

  const results = { created: [], existing_admin: [], existing_pioniere: [], failed: [] }

  for (const p of withEmail) {
    const email = p.email.trim().toLowerCase()
    const existing = existingByEmail.get(email)
    if (existing) {
      const role = existing.app_metadata?.role
      if (role === 'pioniere') results.existing_pioniere.push({ email, name: p.full_name })
      else results.existing_admin.push({ email, name: p.full_name, role: role || '(none)' })
      continue
    }
    const { data, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: 'pioniere' },
    })
    if (createErr) {
      results.failed.push({ email, name: p.full_name, error: createErr.message })
    } else {
      results.created.push({ email, name: p.full_name, user_id: data.user.id })
    }
  }

  console.log(`\n── Backfill summary ──`)
  console.log(`Pionieri total:           ${pionieri.length}`)
  console.log(`  with email:             ${withEmail.length}`)
  console.log(`  without email (skip):   ${withoutEmail}`)
  console.log(`Auth users newly created: ${results.created.length}`)
  console.log(`Already pioniere (skip):  ${results.existing_pioniere.length}`)
  console.log(`Already non-pioniere:     ${results.existing_admin.length} (left untouched)`)
  console.log(`Failed:                   ${results.failed.length}`)

  if (results.created.length) {
    console.log(`\nCreated:`)
    results.created.forEach(r => console.log(`  + ${r.email}  (${r.name})`))
  }
  if (results.existing_admin.length) {
    console.log(`\nExisting non-pioniere accounts (NOT modified):`)
    results.existing_admin.forEach(r => console.log(`  ~ ${r.email}  (${r.name})  role=${r.role}`))
  }
  if (results.failed.length) {
    console.log(`\nFailures:`)
    results.failed.forEach(r => console.log(`  ! ${r.email}  (${r.name}): ${r.error}`))
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
