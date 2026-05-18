import './styles/main.css'
import { getSession, onAuthStateChange } from './auth.js'
import { renderLayout, initLayoutListeners } from './components/layout.js'
import { renderLogin, initLogin } from './pages/login.js'
import { renderDashboard, initDashboard } from './pages/dashboard.js'
import { renderPionieri, initPionieri } from './pages/pionieri.js'
import { renderProjects, initProjects } from './pages/projects.js'
import { renderMatching, initMatching } from './pages/matching.js'
import { renderTimebank, initTimebank } from './pages/timebank.js'
import { renderSkills, initSkills } from './pages/skills.js'
import { renderShowcase, initShowcase } from './pages/showcase.js'
import { renderProfilo, initProfilo } from './pages/profilo.js'
import { renderViewSelect, initViewSelect } from './pages/view-select.js'
import { resolveRole, getRole, clearViewMode, canVisit, defaultRouteFor } from './role.js'

const app = document.getElementById('app')

const routes = {
  '#/dashboard': { render: renderDashboard, init: initDashboard, adminOnly: true },
  '#/pionieri': { render: renderPionieri, init: initPionieri },
  '#/competenze': { render: renderSkills, init: initSkills, adminOnly: true },
  '#/progetti': { render: renderProjects, init: initProjects, adminOnly: true },
  '#/matching': { render: renderMatching, init: initMatching, adminOnly: true },
  '#/timebank': { render: renderTimebank, init: initTimebank, adminOnly: true },
  '#/vetrina': { render: renderShowcase, init: initShowcase, fullscreen: true },
  '#/profilo': { render: renderProfilo, init: initProfilo, pioniereOnly: true },
}

let currentSession = null

async function router() {
  const hash = window.location.hash || '#/login'

  // Login page — no auth required
  if (hash === '#/login') {
    if (currentSession) {
      window.location.hash = defaultRouteFor(getRole()?.viewMode)
      return
    }
    app.innerHTML = renderLogin()
    initLogin()
    return
  }

  // All other pages require auth
  if (!currentSession) {
    window.location.hash = '#/login'
    return
  }

  const role = getRole()

  // No role assigned yet (race during init) — defer
  if (!role) return

  // User has authenticated but is neither admin nor a known pioniere → kick out
  if (role.kind === 'none') {
    app.innerHTML = renderUnauthorized()
    return
  }

  // Dual-role user hasn't picked a view yet → show splash
  if (role.kind === 'dual' && !role.viewMode) {
    app.innerHTML = renderViewSelect()
    initViewSelect()
    return
  }

  // Find route
  const routeKey = Object.keys(routes).find(key => hash.startsWith(key))
  const route = routeKey ? routes[routeKey] : null

  if (!route) {
    window.location.hash = defaultRouteFor(role.viewMode)
    return
  }

  // Role-based route gating. canVisit() encodes pioniere whitelist.
  if (!canVisit(routeKey)) {
    window.location.hash = defaultRouteFor(role.viewMode)
    return
  }

  // Fullscreen pages render without the sidebar layout
  if (route.fullscreen) {
    app.innerHTML = route.render()
    if (route.init) await route.init()
    return
  }

  const pageContent = route.render()
  app.innerHTML = renderLayout(pageContent, hash)
  initLayoutListeners()
  if (route.init) await route.init()
}

function renderUnauthorized() {
  return `
    <div class="min-h-screen flex flex-col items-center justify-center bg-marea-cream p-4 text-center">
      <h1 class="font-heading text-3xl text-marea-black mb-3">Accesso non autorizzato</h1>
      <p class="text-marea-gray mb-6 max-w-md">Il tuo indirizzo email non &egrave; abilitato. Contatta un amministratore della Fondazione.</p>
      <button id="unauth-logout" class="btn-outline px-5 py-2.5 text-sm rounded-lg">Esci</button>
    </div>
  `
}

async function init() {
  // Supabase puts auth tokens in the URL hash (e.g. #access_token=...&type=invite)
  // Detect and handle these before routing
  const hash = window.location.hash
  if (hash && (hash.includes('access_token=') || hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('error='))) {
    // Check for error in the URL fragment (expired/used link)
    const params = new URLSearchParams(hash.substring(hash.indexOf('#') + 1))
    const hashError = params.get('error_description') || params.get('error')

    if (hashError) {
      window.location.hash = '#/login'
      sessionStorage.setItem('login_error', 'Il link di accesso è scaduto o è già stato utilizzato. Richiedine uno nuovo.')
    } else {
      const { data } = await import('./supabase.js').then(m =>
        m.supabase.auth.getSession()
      )
      if (data?.session) {
        currentSession = data.session
        // Splash always shows on fresh login for dual-role users
        clearViewMode()
        await resolveRole(currentSession)
        window.location.hash = defaultRouteFor(getRole()?.viewMode)
      } else {
        window.location.hash = '#/login'
        sessionStorage.setItem('login_error', 'Il link di accesso è scaduto o è già stato utilizzato. Richiedine uno nuovo.')
      }
    }
  }

  currentSession = await getSession()
  await resolveRole(currentSession)

  onAuthStateChange(async (session) => {
    const wasSignedIn = !!currentSession
    currentSession = session
    if (!session) {
      clearViewMode()
      await resolveRole(null)
      if (window.location.hash !== '#/login') window.location.hash = '#/login'
      return
    }
    // Fresh sign-in: clear view mode so dual-role users get the splash again
    if (!wasSignedIn) clearViewMode()
    await resolveRole(session)
    if (window.location.hash === '#/login' || window.location.hash === '') {
      window.location.hash = defaultRouteFor(getRole()?.viewMode)
    } else {
      router()
    }
  })

  window.addEventListener('hashchange', router)

  // Wire logout from the unauthorized screen
  document.addEventListener('click', async (e) => {
    if (e.target?.id === 'unauth-logout') {
      const { signOut } = await import('./auth.js')
      await signOut()
    }
  })

  // Default route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = currentSession ? defaultRouteFor(getRole()?.viewMode) : '#/login'
  } else {
    router()
  }
}

init()
