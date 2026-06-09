import { signInWithOtp } from '../auth.js'

export function renderLogin() {
  return `
    <div class="min-h-screen flex flex-col bg-marea-cream">
      <div class="pt-10 flex justify-center">
        <img src="/brand_assets/logo/Rema_Logo_Wordmark_C.svg" alt="Rema — Fondazione Marea" class="h-9" />
      </div>
      <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-12">
          <h1 class="font-heading text-5xl text-marea-black mb-4 leading-tight">Accedi</h1>
          <p class="text-marea-gray text-lg max-w-sm mx-auto">alla piattaforma di matching tra Pionieri e progetti della Fondazione</p>
        </div>

        <div class="bg-white rounded-2xl shadow-lg border border-marea-border/60 p-10">
          <form id="login-form" class="space-y-6">
            <div>
              <label for="login-email" class="block text-lg font-medium text-marea-black mb-2">Indirizzo email</label>
              <p class="text-sm text-marea-gray mb-3">Inserisci la tua email per ricevere un link di accesso</p>
              <input type="email" id="login-email" required
                     class="w-full px-5 py-3.5 rounded-xl border border-marea-border bg-white text-marea-black placeholder-marea-gray/60 focus-ring transition-all text-base"
                     placeholder="nome@esempio.it" />
            </div>
            <button type="submit" id="login-submit" class="btn-gold w-full justify-center py-3.5 text-base">
              <svg id="login-spinner" class="hidden animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span id="login-btn-text">Invia link di accesso</span>
            </button>
          </form>

          <div id="login-message" class="mt-6 text-sm text-center hidden p-3 rounded-xl bg-marea-light text-marea-teal"></div>
          <div id="login-error" class="mt-6 text-sm text-center text-red-600 hidden p-3 rounded-xl bg-red-50"></div>
        </div>

        <p class="text-center text-xs text-marea-gray mt-10">
          <a href="https://fondazionemarea.org" target="_blank" rel="noopener" class="hover:text-marea-teal transition-colors">Fondazione Marea ETS</a>
        </p>
      </div>
      </div>
    </div>
  `
}

export function initLogin() {
  const form = document.getElementById('login-form')
  const messageEl = document.getElementById('login-message')
  const errorEl = document.getElementById('login-error')

  document.getElementById('login-email').focus()

  const storedError = sessionStorage.getItem('login_error')
  if (storedError) {
    sessionStorage.removeItem('login_error')
    errorEl.textContent = storedError
    errorEl.classList.remove('hidden')
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value
    const submitBtn = document.getElementById('login-submit')

    const spinner = document.getElementById('login-spinner')
    const btnText = document.getElementById('login-btn-text')

    submitBtn.disabled = true
    submitBtn.classList.add('opacity-70', 'pointer-events-none')
    spinner.classList.remove('hidden')
    btnText.textContent = 'Invio in corso...'
    messageEl.classList.add('hidden')
    errorEl.classList.add('hidden')

    try {
      await signInWithOtp(email)
      const card = document.querySelector('#login-form').closest('.bg-white')
      card.innerHTML = `
        <div class="text-center py-4">
          <svg class="mx-auto mb-5 h-14 w-14 text-marea-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <h2 class="font-heading text-2xl text-marea-black mb-2">Controlla la tua email</h2>
          <p class="text-marea-gray text-sm mb-1">Abbiamo inviato un link di accesso a</p>
          <p class="text-marea-black font-semibold text-sm mb-6">${email}</p>
          <button id="login-retry" class="btn-outline text-sm py-2 px-5">Torna al login</button>
        </div>
      `
      document.getElementById('login-retry').addEventListener('click', () => {
        window.location.hash = '#/login'
      })
    } catch (err) {
      const errLower = (err.message || '').toLowerCase()
      let msg
      if (errLower.includes('security')) {
        msg = 'Hai già richiesto un link. Attendi 20 secondi prima di riprovare.'
      } else if (errLower.includes('rate limit')) {
        msg = 'Troppi tentativi. Attendi qualche minuto prima di riprovare.'
      } else {
        msg = err.message || 'Errore durante l\'invio. Riprova.'
      }
      errorEl.textContent = msg
      errorEl.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
      submitBtn.classList.remove('opacity-70', 'pointer-events-none')
      spinner.classList.add('hidden')
      btnText.textContent = 'Invia link di accesso'
    }
  })
}
