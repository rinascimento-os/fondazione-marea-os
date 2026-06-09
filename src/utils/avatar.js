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

// Replace each row's storage path with a usable signed URL on `row.avatarUrl`.
// Mutates rows in place and returns them. Rows without an avatar are untouched;
// on failure they simply fall back to initials (avatarUrl stays empty).
export async function signAvatars(rows) {
  const list = (rows || []).filter(r => r && r.avatar_url)
  if (list.length === 0) return rows
  const paths = [...new Set(list.map(r => r.avatar_url))]
  try {
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .createSignedUrls(paths, SIGNED_TTL_SECONDS)
    if (error) throw error
    const byPath = new Map()
    for (const d of data || []) {
      if (d.signedUrl && !d.error) byPath.set(d.path, d.signedUrl)
    }
    for (const r of list) r.avatarUrl = byPath.get(r.avatar_url) || ''
  } catch (err) {
    console.warn('Firma avatar non riuscita:', err)
  }
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
  const path = `${pioniereId}.${ext}`

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
    return data?.signedUrl || ''
  } catch {
    return ''
  }
}
