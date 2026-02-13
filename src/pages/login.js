import { signInWithOtp } from '../auth.js'

export function renderLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-marea-cream p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-10">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_MAIN_C.svg" alt="Fondazione Marea" class="h-24 mx-auto mb-8" />
          <h1 class="text-3xl text-marea-black mb-2">Banca del Tempo</h1>
          <p class="text-marea-gray text-sm">Accedi con il tuo indirizzo email</p>
        </div>

        <div class="bg-white rounded-2xl shadow-lg border border-marea-border/60 p-8">
          <form id="login-form" class="space-y-5">
            <div>
              <label for="login-email" class="block text-sm font-medium text-marea-black mb-2">Email</label>
              <input type="email" id="login-email" required
                     class="w-full px-4 py-3 rounded-xl border border-marea-border bg-white text-marea-black placeholder-marea-gray/60 focus-ring transition-all"
                     placeholder="nome@esempio.it" />
            </div>
            <button type="submit" id="login-submit" class="btn-gold w-full justify-center py-3 text-base">
              Accedi con magic link
            </button>
          </form>

          <div id="login-message" class="mt-5 text-sm text-center hidden p-3 rounded-xl bg-marea-light text-marea-teal"></div>
          <div id="login-error" class="mt-5 text-sm text-center text-red-600 hidden p-3 rounded-xl bg-red-50"></div>
        </div>

        <p class="text-center text-xs text-marea-gray/60 mt-8">Fondazione Marea ETS</p>
      </div>
    </div>
  `
}

export function initLogin() {
  const form = document.getElementById('login-form')
  const messageEl = document.getElementById('login-message')
  const errorEl = document.getElementById('login-error')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value
    const submitBtn = document.getElementById('login-submit')

    submitBtn.disabled = true
    submitBtn.textContent = 'Invio in corso...'
    messageEl.classList.add('hidden')
    errorEl.classList.add('hidden')

    try {
      await signInWithOtp(email)
      messageEl.textContent = 'Controlla la tua email per il link di accesso!'
      messageEl.classList.remove('hidden')
    } catch (err) {
      errorEl.textContent = err.message || 'Errore durante l\'invio. Riprova.'
      errorEl.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Accedi con magic link'
    }
  })
}
