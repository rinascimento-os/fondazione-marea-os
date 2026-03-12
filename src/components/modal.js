export function renderModal({ title, content, id = 'modal', size = 'lg' }) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' }[size] || 'max-w-lg'
  return `
    <div id="${id}" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" data-modal-close="${id}"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col z-10 modal-content-enter">
        <div class="flex items-center justify-between px-6 py-5 border-b border-marea-border">
          <h2 class="text-xl text-marea-black">${title}</h2>
          <button data-modal-close="${id}" class="p-1.5 rounded-full hover:bg-gray-100 text-marea-gray transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="px-6 py-5 overflow-y-auto flex-1">
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
