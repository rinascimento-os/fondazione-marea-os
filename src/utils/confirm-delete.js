import { escapeHtml } from './escape.js'

export function showAlert(message) {
  document.getElementById('alert-container')?.remove()

  const el = document.createElement('div')
  el.id = 'alert-container'
  el.innerHTML = `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm alert-overlay"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <p class="text-sm text-marea-black mb-6">${escapeHtml(message)}</p>
        <button class="alert-ok btn-gold py-2.5 px-6">OK</button>
      </div>
    </div>
  `
  document.body.appendChild(el)

  el.querySelector('.alert-ok').addEventListener('click', () => el.remove())
  el.querySelector('.alert-overlay').addEventListener('click', () => el.remove())
}

export function showConfirm(message, onConfirm) {
  document.getElementById('confirm-container')?.remove()

  const el = document.createElement('div')
  el.id = 'confirm-container'
  el.innerHTML = `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm confirm-overlay"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center">
        <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <p class="text-sm text-marea-black mb-6">${escapeHtml(message)}</p>
        <div class="flex justify-center gap-3">
          <button class="confirm-cancel btn-outline py-2.5 px-6">Annulla</button>
          <button class="confirm-delete inline-flex items-center gap-2 py-2.5 px-6 rounded-full text-sm font-semibold bg-orange-500 text-white hover:brightness-110 transition-all">Elimina</button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(el)

  el.querySelector('.confirm-cancel').addEventListener('click', () => el.remove())
  el.querySelector('.confirm-overlay').addEventListener('click', () => el.remove())
  el.querySelector('.confirm-delete').addEventListener('click', async () => {
    el.remove()
    await onConfirm()
  })
}

export function initDeleteConfirm(btnId, name, onConfirm) {
  const btn = document.getElementById(btnId)
  if (!btn) return

  btn.addEventListener('click', () => {
    showConfirm(`Eliminare ${escapeHtml(name)}?\nQuesta azione non può essere annullata.`, onConfirm)
  })
}
