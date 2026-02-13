import { signInWithOtp } from '../auth.js'

export function renderLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-marea-cream p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_MAIN_C.svg" alt="Fondazione Marea" class="h-20 mx-auto mb-6" />
          <h1 class="text-2xl font-bold text-marea-black mb-2">Banca del Tempo</h1>
          <p class="text-marea-gray">Accedi con il tuo indirizzo email</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-marea-border p-8">
          <form id="login-form" class="space-y-4">
            <div>
              <label for="login-email" class="block text-sm font-medium text-marea-black mb-1.5">Email</label>
              <input type="email" id="login-email" required
                     class="w-full px-4 py-2.5 rounded-lg border border-marea-border bg-white text-marea-black placeholder-marea-gray focus:outline-none focus:ring-2 focus:ring-marea-teal/30 focus:border-marea-teal transition-colors"
                     placeholder="nome@esempio.it" />
            </div>
            <button type="submit" id="login-submit"
                    class="w-full bg-marea-teal text-white font-medium py-2.5 px-4 rounded-lg hover:bg-marea-dark transition-colors focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
              Accedi con magic link
            </button>
          </form>

          <div id="login-message" class="mt-4 text-sm text-center hidden"></div>
          <div id="login-error" class="mt-4 text-sm text-center text-red-600 hidden"></div>
        </div>
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
      messageEl.classList.add('text-marea-teal')
    } catch (err) {
      errorEl.textContent = err.message || 'Errore durante l\'invio. Riprova.'
      errorEl.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Accedi con magic link'
    }
  })
}
