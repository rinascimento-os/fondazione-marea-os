import './styles/main.css'
import { supabase } from './supabase.js'
import { onAuthStateChange } from './auth.js'
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

function renderBootLoader() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-marea-cream">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-marea-teal/30 border-t-marea-teal rounded-full animate-spin"></div>
      </div>
    </div>
  `
}

// Shown in the original login tab once the user completes sign-in in another
// tab (the magic link opens a fresh tab). Keeps this tab on a calm end state
// instead of silently jumping it into the app too.
function renderLoggedInElsewhere() {
  return `
    <div class="min-h-screen flex flex-col bg-marea-cream">
      <div class="pt-10 flex justify-center">
        <img src="/brand_assets/logo/Rema_Logo_Wordmark_C.svg" alt="Rema" class="h-9" />
      </div>
      <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <svg class="h-16 w-16 text-marea-teal mb-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        <h1 class="font-heading text-4xl text-marea-black mb-3">Accesso effettuato</h1>
        <p class="text-marea-gray text-lg max-w-md mx-auto">Hai effettuato l'accesso in un'altra scheda. Ora puoi chiudere questa scheda.</p>
      </div>
    </div>
  `
}

// Resolve the initial auth state reliably, even in fresh tabs (e.g. when a
// hash-routed link is opened with target="_blank"). supabase.auth.getSession()
// can return null before the client has finished hydrating from localStorage;
// listening for the INITIAL_SESSION event is the authoritative signal.
function getInitialSession({ timeoutMs = 4000 } = {}) {
  return new Promise((resolve) => {
    let done = false
    const finish = (session) => {
      if (done) return
      done = true
      sub?.unsubscribe()
      clearTimeout(timer)
      resolve(session ?? null)
    }
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') finish(session)
    })
    // Fast path: if supabase already has a hydrated session, resolve early.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) finish(data.session)
    }).catch(() => {})
    const timer = setTimeout(() => finish(null), timeoutMs)
  })
}

const routes = {
  '#/dashboard': { render: renderDashboard, init: initDashboard, adminOnly: true },
  '#/pionieri': { render: renderPionieri, init: initPionieri },
  '#/competenze': { render: renderSkills, init: initSkills, adminOnly: true },
  '#/progetti': { render: renderProjects, init: initProjects, adminOnly: true },
  '#/matching': { render: renderMatching, init: initMatching, adminOnly: true },
  '#/timebank': { render: renderTimebank, init: initTimebank, adminOnly: true },
  '#/vetrina': { render: renderShowcase, init: initShowcase, fullscreen: true, public: true },
  '#/profilo': { render: renderProfilo, init: initProfilo, pioniereOnly: true },
}

let currentSession = null
// True only in the tab that actually processed the magic-link token. Lets us
// tell apart "I just logged in here" from "another tab logged in" (cross-tab
// session broadcast), so a waiting login tab doesn't get yanked into the app.
let processedAuthInThisTab = false

function isPublicHash(hash) {
  return Object.keys(routes).some(key => hash.startsWith(key) && routes[key].public)
}

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

  // Public routes — reachable without auth, skip role-resolution and view-select.
  // They render fullscreen (no sidebar) and never read the database directly.
  const publicRouteKey = Object.keys(routes).find(key => hash.startsWith(key) && routes[key].public)
  if (publicRouteKey) {
    const route = routes[publicRouteKey]
    app.innerHTML = route.render()
    if (route.init) await route.init()
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
  // Show a boot loader immediately so the user never sees a blank page
  // (and so a redirect to #/login can't flash before auth is resolved).
  app.innerHTML = renderBootLoader()

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
        processedAuthInThisTab = true
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

  // Wait for supabase to definitively know the initial session — this prevents
  // fresh tabs (target="_blank" deep links) from racing the router and being
  // bounced to #/login before the persisted session is read from storage.
  currentSession = await getInitialSession()
  await resolveRole(currentSession)

  onAuthStateChange(async (session, event) => {
    // Token refresh fires periodically (and on tab focus). The user hasn't
    // changed — keep the cached session current but don't re-render the app,
    // which would otherwise flash the boot loader / refetch every page.
    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      currentSession = session
      return
    }
    const wasSignedIn = !!currentSession
    const sameUser = Boolean(
      session?.user?.id && currentSession?.user?.id && session.user.id === currentSession.user.id
    )
    if (event === 'SIGNED_IN' && wasSignedIn && sameUser) {
      currentSession = session
      return
    }
    // Cross-tab sign-in: this tab is still on the login screen waiting for the
    // magic link, but the user opened the link in a different (fresh) tab.
    // Don't pull this tab into the app; show a calm "you're in, close this" end
    // state instead.
    if (event === 'SIGNED_IN' && !wasSignedIn && !processedAuthInThisTab && window.location.hash === '#/login') {
      currentSession = session
      await resolveRole(session)
      app.innerHTML = renderLoggedInElsewhere()
      return
    }
    currentSession = session
    if (!session) {
      clearViewMode()
      await resolveRole(null)
      // Public routes (e.g. #/vetrina) stay reachable without auth — boot
      // already rendered them; don't bounce to login or re-init the page.
      if (isPublicHash(window.location.hash)) return
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
