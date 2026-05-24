// Aggregates the public showcase data and writes a single JSON file to the
// `showcase` Supabase Storage bucket. Runs daily via Netlify's scheduled-
// functions cron, and is also POST-callable by an authenticated admin from
// the sidebar's "Aggiorna" button for on-demand refreshes.
//
// Env vars (set in Netlify, no VITE_ prefix):
//   SUPABASE_URL              — same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service role secret (storage write + db read)

const { createClient } = require('@supabase/supabase-js')
const { aggregate, resolveLocationsViaNominatim } = require('../../src/lib/showcase-aggregate.js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'showcase'
const OBJECT_PATH = 'stats.json'

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function fetchAndUpload(client) {
  const [
    { data: pionieri, error: pErr },
    { data: projects, error: prErr },
    { data: matches, error: mErr },
    { data: timeEntries, error: tErr },
    { data: skills, error: sErr },
    { data: pioniereSkills, error: psErr },
    { data: projectNeeds, error: pnErr },
  ] = await Promise.all([
    client.from('pionieri_public').select('id, full_name, location, origin, created_at'),
    client.from('projects').select('id, name, type, status'),
    client.from('matches').select('id, status, created_at, pioniere_id, project_need_id'),
    client.from('time_entries').select('id, hours, date'),
    client.from('skills').select('id, name, category'),
    client.from('pioniere_skills').select('skill_id, pioniere_id'),
    client.from('project_needs').select('id, skill_id, urgency, status, project_id'),
  ])
  const firstErr = pErr || prErr || mErr || tErr || sErr || psErr || pnErr
  if (firstErr) throw new Error(`DB read failed: ${firstErr.message}`)

  const allLocStrings = []
  ;(pionieri || []).forEach((p) => {
    if (p.location) allLocStrings.push(p.location)
    if (p.origin) allLocStrings.push(p.origin)
  })
  const runtimeCache = await resolveLocationsViaNominatim(allLocStrings, client)

  const payload = aggregate({
    pionieri, projects, matches, timeEntries, skills, pioniereSkills, projectNeeds,
  }, runtimeCache)

  const body = JSON.stringify(payload)
  const { error: uploadErr } = await client.storage
    .from(BUCKET)
    .upload(OBJECT_PATH, body, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '3600',
    })
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  return {
    updated_at: payload._generatedAt,
    bytes: body.length,
    pionieri: payload.totalPionieri,
    unmatched_locations: payload._unmatchedLocations?.length || 0,
  }
}

exports.handler = async (event) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server is missing Supabase env vars' })
  }

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Scheduled invocations arrive without an HTTP method (Netlify runs the
  // handler directly with an empty/synthetic event). Manual POSTs require an
  // admin bearer token. Anything else is rejected.
  const isScheduled = !event?.httpMethod
  if (!isScheduled) {
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed' })
    }
    const authHeader = event.headers?.authorization || event.headers?.Authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return json(401, { error: 'Missing bearer token' })
    }
    const token = authHeader.slice('Bearer '.length).trim()
    const { data: callerData, error: callerErr } = await client.auth.getUser(token)
    if (callerErr || !callerData?.user) {
      return json(401, { error: 'Invalid token' })
    }
    if (callerData.user.app_metadata?.role === 'pioniere') {
      return json(403, { error: 'Only admins can refresh the showcase' })
    }
  }

  try {
    const result = await fetchAndUpload(client)
    return json(200, { ok: true, ...result })
  } catch (e) {
    console.error('[showcase-snapshot] failed:', e)
    return json(500, { error: e.message || 'Snapshot failed' })
  }
}
