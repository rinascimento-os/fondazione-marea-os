import { escapeHtml } from './escape.js'
import { safeUrl } from './url.js'

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/**
 * Render a pioniere avatar: their photo if `avatar_url` is set, otherwise an
 * initials placeholder. The two branches share size/shape classes so the
 * layout is identical whether or not a photo exists.
 */
export function renderAvatar(pioniere, { sizeClass = 'w-11 h-11', rounded = 'rounded-full', textClass = 'text-sm', extraClass = '', initialsId = '' } = {}) {
  const name = pioniere?.full_name || ''
  // `avatarUrl` is the signed display URL minted by signAvatars(); `avatar_url`
  // is the raw private-bucket path and is not directly usable in <img>.
  const url = safeUrl(pioniere?.avatarUrl)
  if (url) {
    return `<img src="${escapeAttr(url)}" alt="${escapeAttr(name)}" loading="lazy"
      class="${sizeClass} ${rounded} ${extraClass} object-cover flex-shrink-0 bg-marea-teal-light" />`
  }
  return `
    <div class="${sizeClass} ${rounded} ${extraClass} bg-marea-teal-light flex items-center justify-center flex-shrink-0">
      <span ${initialsId ? `id="${escapeAttr(initialsId)}"` : ''} class="text-marea-teal font-bold ${textClass}">${escapeHtml(getInitials(name))}</span>
    </div>`
}

export function urgencyBadge(u) {
  return { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' }[u] || 'bg-gray-100 text-gray-600'
}

export function urgencyLabel(u) {
  return { high: 'Alta', medium: 'Media', low: 'Bassa' }[u] || u
}

/**
 * Escape a value for use inside an HTML attribute (e.g. data-id="...").
 * Ensures quotes and angle brackets in IDs cannot break out of the attribute.
 */
export function escapeAttr(value) {
  return escapeHtml(String(value ?? ''))
}

/**
 * Disable a submit button and show a loading spinner during an async operation.
 * Returns a function to restore the button.
 */
export function withSubmitLock(form) {
  // Button may be inside the form or linked externally via form="id" attribute
  const btn = form.querySelector('button[type="submit"]')
    || (form.id && document.querySelector(`button[type="submit"][form="${form.id}"]`))
  if (!btn || btn.disabled) return null

  const original = btn.innerHTML
  btn.disabled = true
  btn.classList.add('opacity-60', 'pointer-events-none')
  btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Salvataggio...`

  return () => {
    btn.disabled = false
    btn.classList.remove('opacity-60', 'pointer-events-none')
    btn.innerHTML = original
  }
}
