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
import { renderShowcase, initShowcase, destroyShowcase } from './pages/showcase.js'

const app = document.getElementById('app')

const routes = {
  '#/dashboard': { render: renderDashboard, init: initDashboard },
  '#/pionieri': { render: renderPionieri, init: initPionieri },
  '#/competenze': { render: renderSkills, init: initSkills },
  '#/progetti': { render: renderProjects, init: initProjects },
  '#/matching': { render: renderMatching, init: initMatching },
  '#/timebank': { render: renderTimebank, init: initTimebank },
  '#/vetrina': { render: renderShowcase, init: initShowcase, fullscreen: true },
}

let currentSession = null

async function router() {
  const hash = window.location.hash || '#/login'

  // Login page — no auth required
  if (hash === '#/login') {
    if (currentSession) {
      window.location.hash = '#/dashboard'
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

  // Find route
  const routeKey = Object.keys(routes).find(key => hash.startsWith(key))
  const route = routeKey ? routes[routeKey] : routes['#/dashboard']

  if (!route) {
    window.location.hash = '#/dashboard'
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
      // Store the error so the login page can display it
      sessionStorage.setItem('login_error', 'Il link di accesso è scaduto o è già stato utilizzato. Richiedine uno nuovo.')
    } else {
      // Let Supabase client pick up the tokens from the URL
      const { data, error } = await import('./supabase.js').then(m =>
        m.supabase.auth.getSession()
      )
      if (data?.session) {
        currentSession = data.session
        window.location.hash = '#/dashboard'
      } else {
        window.location.hash = '#/login'
        sessionStorage.setItem('login_error', 'Il link di accesso è scaduto o è già stato utilizzato. Richiedine uno nuovo.')
      }
    }
  }

  currentSession = await getSession()

  onAuthStateChange((session) => {
    currentSession = session
    if (!session && window.location.hash !== '#/login') {
      window.location.hash = '#/login'
    } else if (session && (window.location.hash === '#/login' || window.location.hash === '')) {
      window.location.hash = '#/dashboard'
    }
  })

  window.addEventListener('hashchange', router)

  // Default route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = currentSession ? '#/dashboard' : '#/login'
  } else {
    router()
  }
}

init()
