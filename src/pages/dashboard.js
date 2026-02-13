import { supabase } from '../supabase.js'

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
          <p id="stat-pionieri" class="text-4xl font-bold text-marea-black">—</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Progetti attivi</p>
            <span class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </span>
          </div>
          <p id="stat-projects" class="text-4xl font-bold text-marea-black">—</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Match attivi</p>
            <span class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </span>
          </div>
          <p id="stat-matches" class="text-4xl font-bold text-marea-black">—</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6 card-hover">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-marea-gray">Ore totali</p>
            <span class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
          </div>
          <p id="stat-hours" class="text-4xl font-bold text-marea-black">—</p>
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

export async function initDashboard() {
  try {
    const [pionieri, projects, matches, timeEntries] = await Promise.all([
      supabase.from('pionieri').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).in('status', ['proposed', 'confirmed', 'active']),
      supabase.from('time_entries').select('hours'),
    ])

    const el = (id) => document.getElementById(id)
    if (el('stat-pionieri')) el('stat-pionieri').textContent = pionieri.count ?? 0
    if (el('stat-projects')) el('stat-projects').textContent = projects.count ?? 0
    if (el('stat-matches')) el('stat-matches').textContent = matches.count ?? 0

    const totalHours = (timeEntries.data || []).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
    if (el('stat-hours')) el('stat-hours').textContent = totalHours > 0 ? totalHours.toFixed(1) : '0'

    // Recent activity
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id, status, created_at, pioniere:pionieri(full_name), need:project_needs(description, project:projects(name))')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentEntries } = await supabase
      .from('time_entries')
      .select('id, hours, date, description, match:matches(pioniere:pionieri(full_name), need:project_needs(project:projects(name)))')
      .order('created_at', { ascending: false })
      .limit(5)

    const activityEl = el('recent-activity')
    if (!activityEl) return

    const activities = []

    if (recentMatches?.length) {
      recentMatches.forEach(m => {
        activities.push({
          date: m.created_at,
          html: `<span class="font-medium text-marea-black">${m.pioniere?.full_name || '—'}</span> abbinato a <span class="font-medium text-marea-black">${m.need?.project?.name || '—'}</span> <span class="badge ${statusColor(m.status)}">${statusLabel(m.status)}</span>`
        })
      })
    }

    if (recentEntries?.length) {
      recentEntries.forEach(e => {
        activities.push({
          date: e.date,
          html: `<span class="font-medium text-marea-black">${e.match?.pioniere?.full_name || '—'}</span> — <span class="font-semibold text-marea-teal">${e.hours}h</span> per <span class="font-medium text-marea-black">${e.match?.need?.project?.name || '—'}</span>`
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
