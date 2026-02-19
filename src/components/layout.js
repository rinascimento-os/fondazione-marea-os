import { signOut } from '../auth.js'
import { renderModal, showModal, closeModal } from './modal.js'

const navItems = [
  { hash: '#/dashboard', label: 'Dashboard', icon: dashboardIcon },
  { hash: '#/pionieri', label: 'Pionieri', icon: pioneriIcon },
  { hash: '#/competenze', label: 'Competenze', icon: skillsIcon },
  { hash: '#/progetti', label: 'Progetti', icon: projectsIcon },
  { hash: '#/matching', label: 'Matching', icon: matchingIcon },
  { hash: '#/timebank', label: 'Banca del Tempo', icon: timebankIcon },
]

function dashboardIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>`
}

function pioneriIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
}

function projectsIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`
}

function matchingIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>`
}

function timebankIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
}

function skillsIcon() {
  return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`
}

export function renderLayout(contentHtml, currentHash) {
  const activeItem = navItems.find(item => currentHash.startsWith(item.hash)) || navItems[0]

  return `
    <div class="flex h-screen overflow-hidden">
      <!-- Mobile overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-30 hidden lg:hidden"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-marea-navy text-white flex flex-col transform -translate-x-full lg:translate-x-0 transition-transform duration-200">
        <!-- Logo area -->
        <div class="px-6 py-6 border-b border-white/10">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_H_W.svg" alt="Fondazione Marea" class="h-8" />
          <p class="text-xs text-white/60 mt-2 tracking-wide uppercase">Banca del Tempo</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          ${navItems.map(item => {
            const isActive = currentHash.startsWith(item.hash)
            return `
              <a href="${item.hash}"
                 class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                        ${isActive ? 'nav-active' : 'text-white/60 hover:bg-white/8 hover:text-white'}">
                ${item.icon()}
                ${item.label}
              </a>
            `
          }).join('')}
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t border-white/10">
          <button id="logout-btn" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white w-full transition-all duration-150">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Esci
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <header class="bg-white/80 backdrop-blur-sm border-b border-marea-border px-4 lg:px-8 py-5 sticky top-0 z-10">
          <div class="flex items-center justify-between max-w-7xl mx-auto">
            <div class="flex items-center gap-3">
              <button id="menu-btn" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <div id="page-title-area">
                <h1 class="text-2xl font-bold text-marea-black">${activeItem.label}</h1>
              </div>
            </div>
            <div id="page-actions" class="flex flex-wrap gap-3"></div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto p-4 lg:p-8">
          <div class="page-transition max-w-7xl mx-auto">
            ${contentHtml}
          </div>
        </div>
      </main>
    </div>
  `
}

export function initLayoutListeners() {
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const content = `
        <p class="text-sm text-marea-gray mb-6">Sei sicuro di voler uscire?</p>
        <div class="flex justify-end gap-3">
          <button data-modal-close="modal" class="btn-outline px-4 py-2 text-sm rounded-lg">Annulla</button>
          <button id="confirm-logout" class="btn-gold px-4 py-2 text-sm rounded-lg">Esci</button>
        </div>
      `
      showModal(renderModal({ title: 'Conferma uscita', content, size: 'sm' }))
      document.getElementById('confirm-logout')?.addEventListener('click', async () => {
        closeModal()
        await signOut()
        window.location.hash = '#/login'
      })
    })
  }

  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')

  const closeSidebar = () => {
    sidebar?.classList.add('-translate-x-full')
    overlay?.classList.add('hidden')
  }

  const openSidebar = () => {
    sidebar?.classList.remove('-translate-x-full')
    overlay?.classList.remove('hidden')
  }

  document.getElementById('menu-btn')?.addEventListener('click', openSidebar)
  overlay?.addEventListener('click', closeSidebar)
}
