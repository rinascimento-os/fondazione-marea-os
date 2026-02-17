import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController } from 'chart.js'

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController)

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
  BRAND.teal, BRAND.yellow, BRAND.navy, BRAND.amber, BRAND.emerald,
  BRAND.purple, BRAND.rose, BRAND.sky, BRAND.orange, BRAND.lime, BRAND.indigo,
]

export function renderDashboard() {
  return `
    <div id="dashboard-content">
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Pionieri totali</p>
            <span class="w-10 h-10 rounded-xl bg-marea-teal-light flex items-center justify-center">
              <svg class="w-5 h-5 text-marea-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
          </div>
          <p id="stat-pionieri" class="text-4xl font-bold text-marea-black">&mdash;</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Progetti attivi</p>
            <span class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </span>
          </div>
          <p id="stat-projects" class="text-4xl font-bold text-marea-black">&mdash;</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Match attivi</p>
            <span class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </span>
          </div>
          <p id="stat-matches" class="text-4xl font-bold text-marea-black">&mdash;</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Ore totali</p>
            <span class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
          </div>
          <p id="stat-hours" class="text-4xl font-bold text-marea-black">&mdash;</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="flex flex-wrap gap-3 mb-10">
        <a href="#/pionieri?new=1" class="btn-gold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Aggiungi Pioniere
        </a>
        <a href="#/progetti?new=1" class="btn-outline">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuovo Progetto
        </a>
      </div>

      <!-- Charts row 1: Hours over time + Match status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2 bg-white rounded-2xl border border-marea-border/60 shadow-sm p-6">
          <h3 class="text-lg text-marea-black mb-4">Ore nel tempo</h3>
          <div id="chart-hours-empty" class="hidden text-center py-12">
            <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <p class="text-sm text-marea-gray">Nessuna ora registrata.</p>
          </div>
          <div style="position:relative; height:260px;">
            <canvas id="chart-hours"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-marea-border/60 shadow-sm p-6">
          <h3 class="text-lg text-marea-black mb-4">Stato dei match</h3>
          <div id="chart-matches-empty" class="hidden text-center py-12">
            <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            <p class="text-sm text-marea-gray">Nessun match creato.</p>
          </div>
          <div style="position:relative; max-width:220px; margin:0 auto;">
            <canvas id="chart-matches"></canvas>
          </div>
          <div id="chart-matches-legend" class="mt-4 space-y-2"></div>
        </div>
      </div>

      <!-- Charts row 2: Skills distribution + Needs urgency -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div class="lg:col-span-2 bg-white rounded-2xl border border-marea-border/60 shadow-sm p-6">
          <h3 class="text-lg text-marea-black mb-4">Competenze della rete</h3>
          <div id="chart-skills-empty" class="hidden text-center py-12">
            <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            <p class="text-sm text-marea-gray">Nessuna competenza registrata.</p>
          </div>
          <div style="position:relative; height:260px;">
            <canvas id="chart-skills"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-marea-border/60 shadow-sm p-6">
          <h3 class="text-lg text-marea-black mb-4">Bisogni per urgenza</h3>
          <div id="chart-urgency-empty" class="hidden text-center py-12">
            <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <p class="text-sm text-marea-gray">Nessun bisogno registrato.</p>
          </div>
          <div style="position:relative; max-width:220px; margin:0 auto;">
            <canvas id="chart-urgency"></canvas>
          </div>
          <div id="chart-urgency-legend" class="mt-4 space-y-2"></div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="bg-white rounded-2xl border border-marea-border/60 shadow-sm">
        <div class="px-6 py-5 border-b border-marea-border/60">
          <h2 class="text-lg text-marea-black">Attivit&agrave; recente</h2>
        </div>
        <div id="recent-activity" class="p-6">
          <p class="text-sm text-marea-gray">Caricamento...</p>
        </div>
      </div>
    </div>
  `
}

let chartInstances = []

function destroyCharts() {
  chartInstances.forEach(c => c.destroy())
  chartInstances = []
}

export async function initDashboard() {
  destroyCharts()

  try {
    const [pionieri, projects, matches, timeEntries, allMatches, skills, needs] = await Promise.all([
      supabase.from('pionieri').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).in('status', ['proposed', 'confirmed', 'active']),
      supabase.from('time_entries').select('hours, date'),
      supabase.from('matches').select('status'),
      supabase.from('pioniere_skills').select('skill:skills(name)'),
      supabase.from('project_needs').select('urgency, status').eq('status', 'open'),
    ])

    const el = (id) => document.getElementById(id)

    // --- Stat cards ---
    if (el('stat-pionieri')) el('stat-pionieri').textContent = pionieri.count ?? 0
    if (el('stat-projects')) el('stat-projects').textContent = projects.count ?? 0
    if (el('stat-matches')) el('stat-matches').textContent = matches.count ?? 0

    const totalHours = (timeEntries.data || []).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
    if (el('stat-hours')) el('stat-hours').textContent = totalHours > 0 ? totalHours.toFixed(1) : '0'

    // --- Chart: Hours over time ---
    buildHoursChart(timeEntries.data || [])

    // --- Chart: Match status ---
    buildMatchStatusChart(allMatches.data || [])

    // --- Chart: Skills distribution ---
    buildSkillsChart(skills.data || [])

    // --- Chart: Needs urgency ---
    buildUrgencyChart(needs.data || [])

    // --- Recent activity ---
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id, status, created_at, pioniere:pionieri(full_name), need:project_needs(description, project:projects(name))')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentEntries } = await supabase
      .from('time_entries')
      .select('id, hours, date, description, match:matches(pioniere:pionieri(full_name), need:project_needs(project:projects(name))), pioniere:pionieri(full_name), project:projects(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    const activityEl = el('recent-activity')
    if (!activityEl) return

    const activities = []

    if (recentMatches?.length) {
      recentMatches.forEach(m => {
        activities.push({
          date: m.created_at,
          html: `<span class="font-medium text-marea-black">${escapeHtml(m.pioniere?.full_name) || '—'}</span> abbinato a <span class="font-medium text-marea-black">${escapeHtml(m.need?.project?.name) || '—'}</span> <span class="badge ${statusColor(m.status)}">${statusLabel(m.status)}</span>`
        })
      })
    }

    if (recentEntries?.length) {
      recentEntries.forEach(e => {
        const pioniereName = e.match?.pioniere?.full_name || e.pioniere?.full_name
        const projectName = e.match?.need?.project?.name || e.project?.name
        activities.push({
          date: e.date,
          html: `<span class="font-medium text-marea-black">${escapeHtml(pioniereName) || '—'}</span> — <span class="font-semibold text-marea-teal">${e.hours}h</span> per <span class="font-medium text-marea-black">${escapeHtml(projectName) || '—'}</span>`
        })
      })
    }

    activities.sort((a, b) => new Date(b.date) - new Date(a.date))

    if (activities.length === 0) {
      activityEl.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <p class="text-marea-gray text-sm">Nessuna attivit&agrave; recente.</p>
          <p class="text-marea-gray/60 text-xs mt-1">Inizia aggiungendo Pionieri e progetti.</p>
        </div>
      `
    } else {
      activityEl.innerHTML = `<div class="space-y-4">${activities.slice(0, 8).map(a => `
        <div class="flex items-start gap-4 text-sm group">
          <span class="text-xs text-marea-gray whitespace-nowrap mt-0.5 min-w-[4rem]">${formatDate(a.date)}</span>
          <span class="text-marea-gray/80 leading-relaxed">${a.html}</span>
        </div>
      `).join('')}</div>`
    }
  } catch (err) {
    const el = (id) => document.getElementById(id)
    if (el('stat-pionieri')) el('stat-pionieri').textContent = '0'
    if (el('stat-projects')) el('stat-projects').textContent = '0'
    if (el('stat-matches')) el('stat-matches').textContent = '0'
    if (el('stat-hours')) el('stat-hours').textContent = '0'
    const activityEl = el('recent-activity')
    if (activityEl) activityEl.innerHTML = `
      <div class="text-center py-8">
        <p class="text-sm text-marea-gray">Le tabelle del database devono ancora essere create.</p>
      </div>
    `
  }
}

// --- Chart builders ---

function buildHoursChart(entries) {
  const canvas = document.getElementById('chart-hours')
  const emptyEl = document.getElementById('chart-hours-empty')
  if (!canvas) return

  if (!entries.length) {
    canvas.parentElement.style.display = 'none'
    if (emptyEl) emptyEl.classList.remove('hidden')
    return
  }

  // Group hours by month
  const byMonth = {}
  entries.forEach(e => {
    if (!e.date) return
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] || 0) + (parseFloat(e.hours) || 0)
  })

  const sortedKeys = Object.keys(byMonth).sort()
  // Show up to last 12 months
  const keys = sortedKeys.slice(-12)
  const labels = keys.map(k => {
    const [y, m] = k.split('-')
    return new Date(y, parseInt(m) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
  })
  const data = keys.map(k => Math.round(byMonth[k] * 10) / 10)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ore',
        data,
        backgroundColor: BRAND.teal + 'cc',
        hoverBackgroundColor: BRAND.teal,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 40,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => `${ctx.parsed.y} ore`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#9ca3af' },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { family: 'Inter', size: 11 },
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

function buildMatchStatusChart(matchData) {
  const canvas = document.getElementById('chart-matches')
  const emptyEl = document.getElementById('chart-matches-empty')
  const legendEl = document.getElementById('chart-matches-legend')
  if (!canvas) return

  if (!matchData.length) {
    canvas.parentElement.style.display = 'none'
    if (emptyEl) emptyEl.classList.remove('hidden')
    return
  }

  const counts = {}
  matchData.forEach(m => {
    const s = m.status || 'altro'
    counts[s] = (counts[s] || 0) + 1
  })

  const statusMeta = {
    proposed: { label: 'Proposto', color: BRAND.yellow },
    confirmed: { label: 'Confermato', color: BRAND.sky },
    active: { label: 'Attivo', color: BRAND.emerald },
    completed: { label: 'Completato', color: BRAND.navy },
  }

  const statuses = Object.keys(counts)
  const labels = statuses.map(s => statusMeta[s]?.label || s)
  const data = statuses.map(s => counts[s])
  const colors = statuses.map(s => statusMeta[s]?.color || '#9ca3af')

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c + 'dd'),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 10,
          cornerRadius: 8,
        }
      }
    }
  })
  chartInstances.push(chart)

  // Custom legend
  if (legendEl) {
    legendEl.innerHTML = statuses.map((s, i) => `
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full inline-block" style="background:${colors[i]}"></span>
          <span class="text-marea-gray">${labels[i]}</span>
        </div>
        <span class="font-semibold text-marea-black">${data[i]}</span>
      </div>
    `).join('')
  }
}

function buildSkillsChart(skillData) {
  const canvas = document.getElementById('chart-skills')
  const emptyEl = document.getElementById('chart-skills-empty')
  if (!canvas) return

  if (!skillData.length) {
    canvas.parentElement.style.display = 'none'
    if (emptyEl) emptyEl.classList.remove('hidden')
    return
  }

  // Count skill occurrences
  const counts = {}
  skillData.forEach(s => {
    const name = s.skill?.name || 'Altro'
    counts[name] = (counts[name] || 0) + 1
  })

  // Sort by count desc, take top 10
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const labels = sorted.map(([name]) => name)
  const data = sorted.map(([, count]) => count)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pionieri',
        data,
        backgroundColor: CHART_PALETTE.slice(0, data.length),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 28,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => `${ctx.parsed.x} pionier${ctx.parsed.x === 1 ? 'e' : 'i'}`
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
          ticks: { font: { family: 'Inter', size: 12 }, color: '#4b5563' },
          border: { display: false },
        }
      }
    }
  })
  chartInstances.push(chart)
}

function buildUrgencyChart(needsData) {
  const canvas = document.getElementById('chart-urgency')
  const emptyEl = document.getElementById('chart-urgency-empty')
  const legendEl = document.getElementById('chart-urgency-legend')
  if (!canvas) return

  if (!needsData.length) {
    canvas.parentElement.style.display = 'none'
    if (emptyEl) emptyEl.classList.remove('hidden')
    return
  }

  const counts = { high: 0, medium: 0, low: 0 }
  needsData.forEach(n => {
    const u = n.urgency || 'low'
    if (counts[u] !== undefined) counts[u]++
  })

  const urgencyMeta = {
    high: { label: 'Alta', color: BRAND.rose },
    medium: { label: 'Media', color: BRAND.yellow },
    low: { label: 'Bassa', color: BRAND.emerald },
  }

  const urgencies = Object.keys(counts).filter(u => counts[u] > 0)
  const labels = urgencies.map(u => urgencyMeta[u].label)
  const data = urgencies.map(u => counts[u])
  const colors = urgencies.map(u => urgencyMeta[u].color)

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c + 'dd'),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: BRAND.navy,
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 10,
          cornerRadius: 8,
        }
      }
    }
  })
  chartInstances.push(chart)

  // Custom legend
  if (legendEl) {
    legendEl.innerHTML = urgencies.map((u, i) => `
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full inline-block" style="background:${colors[i]}"></span>
          <span class="text-marea-gray">${labels[i]}</span>
        </div>
        <span class="font-semibold text-marea-black">${data[i]}</span>
      </div>
    `).join('')
  }
}

// --- Helpers ---

function statusColor(status) {
  const colors = {
    proposed: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-600',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

function statusLabel(status) {
  const labels = {
    proposed: 'Proposto',
    confirmed: 'Confermato',
    active: 'Attivo',
    completed: 'Completato',
  }
  return labels[status] || status
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}
