import { supabase } from './supabase.js'

const VIEW_MODE_KEY = 'view_mode'

// Resolved on each session change. null until first resolveRole() completes.
let currentRole = null

export function getRole() {
  return currentRole
}

// Returns { kind, isAdmin, isPioniere, pioniereId, email, viewMode }
// kind: 'admin' | 'pioniere' | 'dual' | 'none'
export async function resolveRole(session) {
  if (!session) {
    currentRole = makeRole({ kind: 'none' })
    return currentRole
  }

  const email = session.user.email
  const isAdmin = session.user.app_metadata?.role !== 'pioniere'

  // current_pioniere_id() resolves the caller's pioniere row by auth.email().
  // Works for both admins (who could query pionieri directly) and pionieri
  // (who can't read the base table) — returns null if no match.
  let pioniereId = null
  try {
    const { data, error } = await supabase.rpc('current_pioniere_id')
    if (!error) pioniereId = data || null
  } catch {
    pioniereId = null
  }
  const isPioniere = pioniereId !== null

  let kind
  if (isAdmin && isPioniere) kind = 'dual'
  else if (isAdmin) kind = 'admin'
  else if (isPioniere) kind = 'pioniere'
  else kind = 'none'

  currentRole = makeRole({ kind, email, pioniereId })
  return currentRole
}

function makeRole({ kind, email = null, pioniereId = null }) {
  const isAdmin = kind === 'admin' || kind === 'dual'
  const isPioniere = kind === 'pioniere' || kind === 'dual'
  // One-time migration: lift any pre-existing per-tab choice into localStorage
  // so the current tab keeps its view mode after the storage move.
  const legacy = sessionStorage.getItem(VIEW_MODE_KEY)
  if (legacy && !localStorage.getItem(VIEW_MODE_KEY)) {
    localStorage.setItem(VIEW_MODE_KEY, legacy)
    sessionStorage.removeItem(VIEW_MODE_KEY)
  }
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  let viewMode = null
  if (kind === 'admin') viewMode = 'admin'
  else if (kind === 'pioniere') viewMode = 'pioniere'
  else if (kind === 'dual') viewMode = stored === 'admin' || stored === 'pioniere' ? stored : null
  return { kind, isAdmin, isPioniere, pioniereId, email, viewMode }
}

export function setViewMode(mode) {
  if (mode !== 'admin' && mode !== 'pioniere') return
  localStorage.setItem(VIEW_MODE_KEY, mode)
  if (currentRole) currentRole.viewMode = mode
}

export function clearViewMode() {
  localStorage.removeItem(VIEW_MODE_KEY)
  if (currentRole) currentRole.viewMode = currentRole.kind === 'dual' ? null : currentRole.viewMode
}

// Routes a pioniere is allowed to visit. Admins can visit any route.
const PIONIERE_ROUTES = ['#/vetrina', '#/pionieri', '#/profilo']

export function canVisit(hash) {
  if (!currentRole) return false
  if (currentRole.viewMode === 'admin') return true
  if (currentRole.viewMode === 'pioniere') {
    return PIONIERE_ROUTES.some(r => hash.startsWith(r))
  }
  return false
}

export function defaultRouteFor(viewMode) {
  return viewMode === 'pioniere' ? '#/profilo' : '#/dashboard'
}
