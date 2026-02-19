import { supabase } from '../supabase.js'
import {
  Chart, ArcElement, BarElement, CategoryScale, LinearScale,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, DoughnutController, BarController, RadarController
} from 'chart.js'

Chart.register(
  ArcElement, BarElement, CategoryScale, LinearScale,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, DoughnutController, BarController, RadarController
)

// --- Brand palette ---
const BRAND = {
  teal: '#008eb0',
  tealDark: '#00556d',
  navy: '#1a3a4a',
  yellow: '#f5c542',
  cream: '#faf8f5',
  border: '#e5e2dd',
  amber: '#d97706',
  emerald: '#059669',
  purple: '#7c3aed',
  rose: '#e11d48',
  sky: '#0284c7',
  orange: '#ea580c',
  lime: '#65a30d',
  indigo: '#4f46e5',
}

const CHART_PALETTE = [
  BRAND.teal, BRAND.navy, BRAND.amber, BRAND.emerald,
  BRAND.purple, BRAND.sky, BRAND.orange, BRAND.lime,
  BRAND.indigo, BRAND.rose, '#06b6d4', '#8b5cf6',
  '#0d9488', '#c026d3', '#dc2626',
]

const CATEGORY_COLORS = {
  'Strategia & Leadership': BRAND.navy,
  'Business & Mercato': BRAND.teal,
  'Comunicazione & Media': BRAND.amber,
  'Finanza': BRAND.emerald,
  'Legale': BRAND.indigo,
  'Tecnologia': BRAND.sky,
  'Organizzazione': BRAND.purple,
  'Consulenza': BRAND.orange,
  'Design & Creatività': BRAND.rose,
  'Impatto & Fondazione': BRAND.lime,
  'Formazione & Ricerca': '#06b6d4',
  'Policy & Istituzioni': '#8b5cf6',
  'Settoriale': BRAND.yellow,
}

// --- Chart instances ---
let chartInstances = []

function destroyCharts() {
  chartInstances.forEach(c => c.destroy())
  chartInstances = []
}

// --- Render ---
export function renderVetrina() {
  return `
    <div id="vetrina-page">
      <!-- Navbar -->
      <nav class="vetrina-nav">
        <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_H_W.svg" alt="Fondazione Marea" class="h-7 opacity-90" />
          <a href="#/login" class="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Area Admin
          </a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="vetrina-hero">
        <div class="max-w-6xl mx-auto px-6 pt-28 pb-40 text-center">
          <p class="text-marea-yellow/90 text-sm font-semibold tracking-widest uppercase mb-6 reveal-on-scroll">Banca del Tempo</p>
          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6 reveal-on-scroll">
            La Rete dei Pionieri<br class="hidden sm:block" />
            <span class="text-marea-yellow">Siciliani nel Mondo</span>
          </h1>
          <p class="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed reveal-on-scroll">
            Competenze, tempo e passione al servizio della Sicilia.
            Una rete globale di professionisti che donano il proprio sapere
            per i progetti della Fondazione Marea.
          </p>
        </div>
      </section>

      <!-- Stat cards — overlapping hero bottom -->
      <section class="relative z-10 -mt-20 mb-16 max-w-5xl mx-auto px-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div class="vetrina-stat-card reveal-on-scroll">
            <div class="vetrina-stat-icon bg-marea-teal-light">
              <svg class="w-6 h-6 text-marea-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <p class="vetrina-stat-number" id="v-stat-pionieri" data-target="0">0</p>
            <p class="vetrina-stat-label">Pionieri nella rete</p>
          </div>
          <div class="vetrina-stat-card reveal-on-scroll">
            <div class="vetrina-stat-icon bg-purple-50">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="vetrina-stat-number" id="v-stat-hours" data-target="0">0</p>
            <p class="vetrina-stat-label">Ore donate</p>
          </div>
          <div class="vetrina-stat-card reveal-on-scroll">
            <div class="vetrina-stat-icon bg-amber-50">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <p class="vetrina-stat-number" id="v-stat-projects" data-target="0">0</p>
            <p class="vetrina-stat-label">Progetti supportati</p>
          </div>
          <div class="vetrina-stat-card reveal-on-scroll">
            <div class="vetrina-stat-icon bg-emerald-50">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <p class="vetrina-stat-number" id="v-stat-matches" data-target="0">0</p>
            <p class="vetrina-stat-label">Abbinamenti realizzati</p>
          </div>
        </div>
      </section>

      <!-- Skills section -->
      <section class="py-16 lg:py-24 bg-white">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-14 reveal-on-scroll">
            <p class="text-marea-teal text-sm font-semibold tracking-widest uppercase mb-3">Competenze</p>
            <h2 class="font-heading text-3xl sm:text-4xl text-marea-navy mb-4">Le Competenze della Rete</h2>
            <p class="text-marea-gray max-w-xl mx-auto">Una mappa delle competenze professionali che i Pionieri mettono a disposizione dei progetti della Fondazione.</p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <!-- Top skills horizontal bar -->
            <div class="lg:col-span-3 bg-marea-cream rounded-2xl border border-marea-border/60 p-6 sm:p-8 reveal-on-scroll">
              <h3 class="text-lg text-marea-navy mb-1">Competenze pi&ugrave; diffuse</h3>
              <p class="text-sm text-marea-gray mb-6">Le 15 competenze pi&ugrave; rappresentate nella rete dei Pionieri</p>
              <div id="v-skills-empty" class="hidden text-center py-12">
                <p class="text-sm text-marea-gray">Nessun dato disponibile</p>
              </div>
              <div style="position:relative; height:420px;">
                <canvas id="v-chart-skills"></canvas>
              </div>
            </div>
            <!-- Category radar -->
            <div class="lg:col-span-2 bg-marea-cream rounded-2xl border border-marea-border/60 p-6 sm:p-8 reveal-on-scroll">
              <h3 class="text-lg text-marea-navy mb-1">Aree di competenza</h3>
              <p class="text-sm text-marea-gray mb-6">Copertura per categoria professionale</p>
              <div id="v-radar-empty" class="hidden text-center py-12">
                <p class="text-sm text-marea-gray">Nessun dato disponibile</p>
              </div>
              <div style="position:relative; max-width:340px; margin:0 auto;">
                <canvas id="v-chart-radar"></canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hours over time -->
      <section class="py-16 lg:py-24 bg-marea-cream">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-14 reveal-on-scroll">
            <p class="text-marea-teal text-sm font-semibold tracking-widest uppercase mb-3">Impatto</p>
            <h2 class="font-heading text-3xl sm:text-4xl text-marea-navy mb-4">Il Nostro Impatto nel Tempo</h2>
            <p class="text-marea-gray max-w-xl mx-auto">Le ore di volontariato donate dai Pionieri mese dopo mese, al servizio dei progetti della Fondazione.</p>
          </div>
          <div class="bg-white rounded-2xl border border-marea-border/60 p-6 sm:p-8 reveal-on-scroll">
            <div id="v-hours-empty" class="hidden text-center py-16">
              <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <p class="text-marea-gray">Nessuna ora registrata ancora.</p>
            </div>
            <div style="position:relative; height:320px;">
              <canvas id="v-chart-hours"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- Geography + Projects -->
      <section class="py-16 lg:py-24 bg-white">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-14 reveal-on-scroll">
            <p class="text-marea-teal text-sm font-semibold tracking-widest uppercase mb-3">Rete Globale</p>
            <h2 class="font-heading text-3xl sm:text-4xl text-marea-navy mb-4">Una Diaspora che Restituisce</h2>
            <p class="text-marea-gray max-w-xl mx-auto">I Pionieri sono professionisti siciliani sparsi nel mondo, uniti dalla volont&agrave; di contribuire alla propria terra.</p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <!-- Locations -->
            <div class="lg:col-span-3 bg-marea-cream rounded-2xl border border-marea-border/60 p-6 sm:p-8 reveal-on-scroll">
              <h3 class="text-lg text-marea-navy mb-1">Dove siamo</h3>
              <p class="text-sm text-marea-gray mb-6">Le citt&agrave; e i paesi da cui operano i Pionieri</p>
              <div id="v-locations-empty" class="hidden text-center py-12">
                <p class="text-sm text-marea-gray">Nessun dato disponibile</p>
              </div>
              <div style="position:relative; height:380px;">
                <canvas id="v-chart-locations"></canvas>
              </div>
            </div>
            <!-- Project types -->
            <div class="lg:col-span-2 bg-marea-cream rounded-2xl border border-marea-border/60 p-6 sm:p-8 reveal-on-scroll">
              <h3 class="text-lg text-marea-navy mb-1">Tipologia progetti</h3>
              <p class="text-sm text-marea-gray mb-6">Come si distribuisce il supporto dei Pionieri</p>
              <div id="v-projects-empty" class="hidden text-center py-12">
                <p class="text-sm text-marea-gray">Nessun dato disponibile</p>
              </div>
              <div style="position:relative; max-width:240px; margin:0 auto;">
                <canvas id="v-chart-projects"></canvas>
              </div>
              <div id="v-chart-projects-legend" class="mt-6 space-y-3"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA / about -->
      <section class="vetrina-cta">
        <div class="max-w-4xl mx-auto px-6 py-20 lg:py-28 text-center">
          <h2 class="font-heading text-3xl sm:text-4xl text-white mb-6 reveal-on-scroll">Fai Parte della Rete</h2>
          <p class="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed reveal-on-scroll">
            Se sei un professionista di origine siciliana e vuoi mettere le tue competenze
            al servizio della comunit&agrave;, unisciti ai Pionieri della Fondazione Marea.
          </p>
          <a href="https://fondazionemarea.org/" target="_blank" rel="noopener noreferrer"
             class="btn-gold text-base px-8 py-3.5 reveal-on-scroll">
            Scopri la Fondazione
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-marea-navy text-white/50 py-8">
        <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_H_W.svg" alt="Fondazione Marea" class="h-6 opacity-50" />
          <p class="text-xs">&copy; ${new Date().getFullYear()} Fondazione Marea. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  `
}

// --- Init ---
export async function initVetrina() {
  destroyCharts()

  // Scroll reveal
  initScrollReveal()

  try {
    const { data, error } = await supabase.rpc('get_public_stats')

    if (error) throw error

    // Stat counters
    animateCounter('v-stat-pionieri', data.total_pionieri || 0)
    animateCounter('v-stat-hours', data.total_hours || 0, true)
    animateCounter('v-stat-projects', data.active_projects || 0)
    animateCounter('v-stat-matches', data.total_matches || 0)

    // Charts
    buildTopSkillsChart(data.top_skills || [])
    buildCategoryRadar(data.skills_by_category || [])
    buildHoursChart(data.hours_by_month || [])
    buildLocationsChart(data.locations || [])
    buildProjectsChart(data.projects_by_type || [])

  } catch (err) {
    console.warn('Vetrina: could not load public stats', err)
    // Show friendly fallback — the page still looks good with zeros
    document.querySelectorAll('.vetrina-stat-number').forEach(el => {
      el.textContent = '—'
    })
    showEmpty('v-skills-empty', 'v-chart-skills')
    showEmpty('v-radar-empty', 'v-chart-radar')
    showEmpty('v-hours-empty', 'v-chart-hours')
    showEmpty('v-locations-empty', 'v-chart-locations')
    showEmpty('v-projects-empty', 'v-chart-projects')
  }
}

// --- Animated counter ---
function animateCounter(id, target, isDecimal = false) {
  const el = document.getElementById(id)
  if (!el) return

  if (target === 0) {
    el.textContent = '0'
    return
  }

  const duration = 2000
  const startTime = performance.now()

  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = eased * target

    if (isDecimal) {
      el.textContent = current.toFixed(1).replace('.', ',')
    } else {
      el.textContent = Math.round(current).toLocaleString('it-IT')
    }

    if (progress < 1) requestAnimationFrame(update)
  }

  // Start animation when element is visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(update)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.3 })

  observer.observe(el)
}

// --- Scroll reveal ---
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('#vetrina-page .reveal-on-scroll').forEach(el => {
    observer.observe(el)
  })
}

// --- Show empty state ---
function showEmpty(emptyId, canvasId) {
  const emptyEl = document.getElementById(emptyId)
  const canvas = document.getElementById(canvasId)
  if (emptyEl) emptyEl.classList.remove('hidden')
  if (canvas) canvas.parentElement.style.display = 'none'
}

// --- Chart: Top Skills (horizontal bar) ---
function buildTopSkillsChart(skillsData) {
  const canvas = document.getElementById('v-chart-skills')
  if (!canvas || !skillsData.length) {
    showEmpty('v-skills-empty', 'v-chart-skills')
    return
  }

  const labels = skillsData.map(s => s.name)
  const data = skillsData.map(s => s.count)
  const colors = skillsData.map(s => CATEGORY_COLORS[s.category] || BRAND.teal)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pionieri',
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        hoverBackgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 22,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} pionier${ctx.parsed.x === 1 ? 'e' : 'i'}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#9ca3af',
            stepSize: 1,
          },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#4b5563',
          },
          border: { display: false },
        }
      }
    }
  })
  chartInstances.push(chart)
}

// --- Chart: Category Radar ---
function buildCategoryRadar(categoryData) {
  const canvas = document.getElementById('v-chart-radar')
  if (!canvas || !categoryData.length) {
    showEmpty('v-radar-empty', 'v-chart-radar')
    return
  }

  // Shorten long labels for radar readability
  const labelMap = {
    'Strategia & Leadership': 'Strategia',
    'Business & Mercato': 'Business',
    'Comunicazione & Media': 'Media',
    'Finanza': 'Finanza',
    'Legale': 'Legale',
    'Tecnologia': 'Tech',
    'Organizzazione': 'Org.',
    'Consulenza': 'Consulenza',
    'Design & Creatività': 'Design',
    'Impatto & Fondazione': 'Impatto',
    'Formazione & Ricerca': 'Formazione',
    'Policy & Istituzioni': 'Policy',
    'Settoriale': 'Settoriale',
  }

  const labels = categoryData.map(c => labelMap[c.category] || c.category)
  const data = categoryData.map(c => c.pionieri_count)

  const chart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Pionieri',
        data,
        backgroundColor: BRAND.teal + '25',
        borderColor: BRAND.teal,
        borderWidth: 2,
        pointBackgroundColor: BRAND.teal,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex
              return categoryData[idx].category
            },
            label: ctx => ` ${ctx.parsed.r} pionier${ctx.parsed.r === 1 ? 'e' : 'i'}`
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          angleLines: { color: '#e5e7eb' },
          pointLabels: {
            font: { family: 'Inter', size: 11 },
            color: '#6b7280',
          },
          ticks: {
            display: false,
            stepSize: Math.max(1, Math.ceil(Math.max(...data) / 4)),
          },
        }
      }
    }
  })
  chartInstances.push(chart)
}

// --- Chart: Hours over time ---
function buildHoursChart(hoursData) {
  const canvas = document.getElementById('v-chart-hours')
  if (!canvas || !hoursData.length) {
    showEmpty('v-hours-empty', 'v-chart-hours')
    return
  }

  const labels = hoursData.map(h => {
    const [y, m] = h.month.split('-')
    return new Date(y, parseInt(m) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
  })
  const data = hoursData.map(h => Math.round(parseFloat(h.hours) * 10) / 10)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ore',
        data,
        backgroundColor: createGradientBar(canvas, BRAND.teal),
        hoverBackgroundColor: BRAND.teal,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 48,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} ore`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#9ca3af',
            callback: v => v + 'h',
          },
          border: { display: false },
        }
      }
    }
  })
  chartInstances.push(chart)
}

// --- Chart: Locations (horizontal bar) ---
function buildLocationsChart(locationsData) {
  const canvas = document.getElementById('v-chart-locations')
  if (!canvas || !locationsData.length) {
    showEmpty('v-locations-empty', 'v-chart-locations')
    return
  }

  const labels = locationsData.map(l => l.location)
  const data = locationsData.map(l => l.count)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pionieri',
        data,
        backgroundColor: CHART_PALETTE.slice(0, data.length).map(c => c + 'cc'),
        hoverBackgroundColor: CHART_PALETTE.slice(0, data.length),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 22,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} pionier${ctx.parsed.x === 1 ? 'e' : 'i'}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#9ca3af',
            stepSize: 1,
          },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 12 },
            color: '#4b5563',
          },
          border: { display: false },
        }
      }
    }
  })
  chartInstances.push(chart)
}

// --- Chart: Project types (doughnut) ---
function buildProjectsChart(projectsData) {
  const canvas = document.getElementById('v-chart-projects')
  const legendEl = document.getElementById('v-chart-projects-legend')
  if (!canvas || !projectsData.length) {
    showEmpty('v-projects-empty', 'v-chart-projects')
    return
  }

  const typeMeta = {
    'onda_project': { label: 'Progetti Onda', color: BRAND.teal },
    'foundation_need': { label: 'Bisogni Fondazione', color: BRAND.navy },
  }

  const labels = projectsData.map(p => typeMeta[p.type]?.label || p.type)
  const data = projectsData.map(p => p.count)
  const colors = projectsData.map(p => typeMeta[p.type]?.color || '#9ca3af')

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c + 'dd'),
        borderWidth: 3,
        borderColor: '#faf8f5',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
        }
      }
    }
  })
  chartInstances.push(chart)

  // Custom legend
  if (legendEl) {
    legendEl.innerHTML = projectsData.map((p, i) => {
      const meta = typeMeta[p.type] || { label: p.type, color: '#9ca3af' }
      return `
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <span class="w-3.5 h-3.5 rounded-full inline-block flex-shrink-0" style="background:${colors[i]}"></span>
            <span class="text-marea-gray">${meta.label}</span>
          </div>
          <span class="font-semibold text-marea-navy">${data[i]}</span>
        </div>
      `
    }).join('')
  }
}

// --- Helpers ---
function createGradientBar(canvas, baseColor) {
  try {
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight || 320)
    gradient.addColorStop(0, baseColor + 'ee')
    gradient.addColorStop(1, baseColor + '66')
    return gradient
  } catch {
    return baseColor + 'cc'
  }
}
