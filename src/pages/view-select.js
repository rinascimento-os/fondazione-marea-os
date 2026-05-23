import { setViewMode, defaultRouteFor } from '../role.js'

export function renderViewSelect() {
  return `
    <div class="min-h-screen flex flex-col bg-marea-cream">
      <div class="pt-6 pl-6">
        <img src="/brand_assets/logo/Fondazione_Marea_Logo_MAIN_C.svg" alt="Fondazione Marea" class="h-8" />
      </div>
      <div class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-3xl">
          <div class="text-center mb-12">
            <h1 class="font-heading text-5xl text-marea-black mb-4 leading-tight">Come vuoi accedere oggi?</h1>
            <p class="text-marea-gray text-lg max-w-xl mx-auto">Hai accesso sia come amministratore che come Pioniere. Scegli quale vista usare.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button data-view-mode="admin" class="view-select-card bg-white rounded-2xl shadow-lg border border-marea-border/60 p-8 text-left hover:-translate-y-0.5 transition-all">
              <div class="w-12 h-12 rounded-xl bg-marea-navy/10 flex items-center justify-center mb-5">
                <svg class="w-6 h-6 text-marea-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h2 class="font-heading text-2xl text-marea-black mb-2">Vista Admin</h2>
              <p class="text-marea-gray text-sm">Gestione completa: Pionieri, competenze, progetti, matching, banca del tempo, dashboard.</p>
            </button>

            <button data-view-mode="pioniere" class="view-select-card bg-white rounded-2xl shadow-lg border border-marea-border/60 p-8 text-left hover:-translate-y-0.5 transition-all">
              <div class="w-12 h-12 rounded-xl bg-marea-teal-light flex items-center justify-center mb-5">
                <svg class="w-6 h-6 text-marea-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h2 class="font-heading text-2xl text-marea-black mb-2">Vista Pioniere</h2>
              <p class="text-marea-gray text-sm">Esplora la rete, vedi l&rsquo;impatto globale, aggiorna il tuo profilo e le tue competenze.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initViewSelect() {
  document.querySelectorAll('.view-select-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.viewMode
      setViewMode(mode)
      const target = defaultRouteFor(mode)
      // When the splash is shown on top of a hash that already equals the
      // target (e.g. dual user lands on #/dashboard, no stored choice, splash
      // renders, then they click Vista Admin → still #/dashboard), assigning
      // the same value to location.hash does not fire 'hashchange'. Dispatch
      // it manually so the router re-runs with the new viewMode.
      if (window.location.hash === target) {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      } else {
        window.location.hash = target
      }
    })
  })
}
