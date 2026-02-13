export function renderModal({ title, content, id = 'modal' }) {
  return `
    <div id="${id}" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="absolute inset-0 bg-black/50" data-modal-close="${id}"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col z-10">
        <div class="flex items-center justify-between px-6 py-4 border-b border-marea-border">
          <h2 class="text-lg font-bold text-marea-black">${title}</h2>
          <button data-modal-close="${id}" class="p-1 rounded-lg hover:bg-gray-100 text-marea-gray">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="px-6 py-4 overflow-y-auto flex-1">
          ${content}
        </div>
      </div>
    </div>
  `
}

export function showModal(modalHtml) {
  const container = document.createElement('div')
  container.id = 'modal-container'
  container.innerHTML = modalHtml
  document.body.appendChild(container)

  container.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', closeModal)
  })
}

export function closeModal() {
  const container = document.getElementById('modal-container')
  if (container) container.remove()
}
