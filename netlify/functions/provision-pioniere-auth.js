// Provisions a Supabase auth.users row for a pioniere so they can sign in
// via magic link without admin invitation. Idempotent: if a user with the
// given email already exists (e.g. they are also an admin), this is a no-op
// and any existing app_metadata is preserved.
//
// Caller must be an authenticated admin (verified via Authorization header).
// Env vars (set in Netlify, no VITE_ prefix):
//   SUPABASE_URL              — same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service role secret (admin API access)

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const PIONIERE_METADATA = { role: 'pioniere' }

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server is missing Supabase env vars' })
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return json(401, { error: 'Missing bearer token' })
  }
  const token = authHeader.slice('Bearer '.length).trim()

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Verify caller is an admin (app_metadata.role !== 'pioniere').
  const { data: callerData, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !callerData?.user) {
    return json(401, { error: 'Invalid token' })
  }
  if (callerData.user.app_metadata?.role === 'pioniere') {
    return json(403, { error: 'Only admins can provision pioniere accounts' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const email = (payload.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return json(400, { error: 'Missing or invalid email' })
  }

  // Idempotency: look for an existing auth user with this email. listUsers
  // is paginated; we walk pages until we find a match or run out.
  let existing = null
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return json(500, { error: error.message })
    existing = data.users.find(u => u.email?.toLowerCase() === email) || null
    if (existing || data.users.length < 200) break
    page += 1
  }

  if (existing) {
    return json(200, {
      ok: true,
      created: false,
      user_id: existing.id,
      role: existing.app_metadata?.role || null,
    })
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: PIONIERE_METADATA,
  })
  if (createErr) return json(500, { error: createErr.message })

  return json(200, {
    ok: true,
    created: true,
    user_id: created.user.id,
    role: 'pioniere',
  })
}
