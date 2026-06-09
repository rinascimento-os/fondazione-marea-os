import { supabase } from '../supabase.js'

// The avatars bucket is PRIVATE: the DB stores only the storage object path
// (e.g. "abc123.webp"), never a public URL. We mint short-lived signed URLs at
// render time for the logged-in user. Display URLs live on a separate
// `avatarUrl` (camelCase) field so the original path on `avatar_url` is
// preserved for saving back.
export const AVATARS_BUCKET = 'avatars'
const SIGNED_TTL_SECONDS = 60 * 60 * 8 // 8h — comfortably longer than a session
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

// Signed URLs are cached per browser session (keyed by storage path) so the
// SAME url is reused across page navigations — otherwise a fresh token each
// load busts the browser's image cache and re-downloads every avatar.
const CACHE_KEY = 'mareaAvatarUrls'
const REUSE_MARGIN_MS = 30 * 60 * 1000 // don't reuse a URL within 30min of expiry

function loadCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}
function saveCache(cache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* quota/full: ignore */ }
}
function cachePut(cache, path, url) {
  cache[path] = { url, exp: Date.now() + SIGNED_TTL_SECONDS * 1000 }
}

// Replace each row's storage path with a usable signed URL on `row.avatarUrl`.
// Mutates rows in place and returns them. Rows without an avatar are untouched;
// on failure they simply fall back to initials (avatarUrl stays empty).
export async function signAvatars(rows) {
  const list = (rows || []).filter(r => r && r.avatar_url)
  if (list.length === 0) return rows
  const cache = loadCache()
  const now = Date.now()

  // Reuse still-fresh cached URLs; only sign the paths we don't have.
  const toSign = []
  for (const r of list) {
    const hit = cache[r.avatar_url]
    if (hit && hit.exp - now > REUSE_MARGIN_MS) r.avatarUrl = hit.url
    else toSign.push(r.avatar_url)
  }

  const paths = [...new Set(toSign)]
  if (paths.length > 0) {
    try {
      const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .createSignedUrls(paths, SIGNED_TTL_SECONDS)
      if (error) throw error
      for (const d of data || []) {
        if (d.signedUrl && !d.error) cachePut(cache, d.path, d.signedUrl)
      }
      saveCache(cache)
    } catch (err) {
      console.warn('Firma avatar non riuscita:', err)
    }
  }
  for (const r of list) if (!r.avatarUrl) r.avatarUrl = cache[r.avatar_url]?.url || ''
  return rows
}

// Upload a pioniere's own photo to the private bucket. Returns the new storage
// path, or throws with an Italian message suitable for showAlert. Removes a
// stale object if the file extension changed (best effort).
export async function uploadOwnAvatar(file, pioniereId, previousPath) {
  if (!file) throw new Error('Nessun file selezionato.')
  if (!file.type.startsWith('image/')) throw new Error('Seleziona un file immagine.')
  if (!EXT_BY_TYPE[file.type]) throw new Error('Formato non supportato. Usa JPG, PNG, WEBP o GIF.')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Immagine troppo grande (max 5MB).')

  const ext = EXT_BY_TYPE[file.type]
  // Versioned key: a brand-new object path on every upload. Keeping the pioniere
  // id as the first dot-segment preserves the storage RLS ownership check
  // (split_part(name,'.',1) = pioniere id), but the changing path means other
  // users' cached signed URLs (sessionStorage, keyed by path) and any CDN copy
  // can never serve a stale image — their next load signs the new path fresh.
  // The previous object is removed below.
  const version = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const path = `${pioniereId}.${version}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })
  if (upErr) throw new Error('Caricamento non riuscito. Riprova.')

  if (previousPath && previousPath !== path) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]).catch(() => {})
  }
  return path
}

// Mint a signed URL for a single freshly-uploaded path (for instant preview).
export async function signOneAvatar(path) {
  if (!path) return ''
  try {
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .createSignedUrl(path, SIGNED_TTL_SECONDS)
    if (error) throw error
    const url = data?.signedUrl || ''
    // Fresh token on re-upload (even at the same key) → the new photo isn't
    // served from the browser cache. Refresh the session cache too.
    if (url) { const cache = loadCache(); cachePut(cache, path, url); saveCache(cache) }
    return url
  } catch {
    return ''
  }
}
