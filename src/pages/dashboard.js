import { supabase } from '../supabase.js'

export function renderDashboard() {
  return `
    <div id="dashboard-content">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-marea-border p-5">
          <p class="text-sm text-marea-gray mb-1">Pionieri totali</p>
          <p id="stat-pionieri" class="text-3xl font-bold text-marea-black">—</p>
        </div>
        <div class="bg-white rounded-xl border border-marea-border p-5">
          <p class="text-sm text-marea-gray mb-1">Progetti attivi</p>
          <p id="stat-projects" class="text-3xl font-bold text-marea-black">—</p>
        </div>
        <div class="bg-white rounded-xl border border-marea-border p-5">
          <p class="text-sm text-marea-gray mb-1">Match attivi</p>
          <p id="stat-matches" class="text-3xl font-bold text-marea-black">—</p>
        </div>
        <div class="bg-white rounded-xl border border-marea-border p-5">
          <p class="text-sm text-marea-gray mb-1">Ore totali</p>
          <p id="stat-hours" class="text-3xl font-bold text-marea-black">—</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-8">
        <a href="#/pionieri?new=1" class="inline-flex items-center gap-2 bg-marea-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-marea-dark transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Aggiungi Pioniere
        </a>
        <a href="#/progetti?new=1" class="inline-flex items-center gap-2 bg-white text-marea-black px-4 py-2.5 rounded-lg text-sm font-medium border border-marea-border hover:bg-marea-light transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuovo Progetto
        </a>
      </div>

      <div class="bg-white rounded-xl border border-marea-border">
        <div class="px-6 py-4 border-b border-marea-border">
          <h2 class="font-bold text-marea-black">Attività recente</h2>
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
          html: `<span class="font-medium">${m.pioniere?.full_name || '—'}</span> abbinato a <span class="font-medium">${m.need?.project?.name || '—'}</span> <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(m.status)}">${m.status}</span>`
        })
      })
    }

    if (recentEntries?.length) {
      recentEntries.forEach(e => {
        activities.push({
          date: e.date,
          html: `<span class="font-medium">${e.match?.pioniere?.full_name || '—'}</span> — ${e.hours}h per <span class="font-medium">${e.match?.need?.project?.name || '—'}</span>`
        })
      })
    }

    activities.sort((a, b) => new Date(b.date) - new Date(a.date))

    if (activities.length === 0) {
      activityEl.innerHTML = `<p class="text-sm text-marea-gray">Nessuna attività recente. Inizia aggiungendo Pionieri e progetti.</p>`
    } else {
      activityEl.innerHTML = `<div class="space-y-3">${activities.slice(0, 8).map(a => `
        <div class="flex items-start gap-3 text-sm">
          <span class="text-marea-gray whitespace-nowrap">${formatDate(a.date)}</span>
          <span>${a.html}</span>
        </div>
      `).join('')}</div>`
    }
  } catch (err) {
    // Tables may not exist yet — show empty state
    const el = (id) => document.getElementById(id)
    if (el('stat-pionieri')) el('stat-pionieri').textContent = '0'
    if (el('stat-projects')) el('stat-projects').textContent = '0'
    if (el('stat-matches')) el('stat-matches').textContent = '0'
    if (el('stat-hours')) el('stat-hours').textContent = '0'
    const activityEl = el('recent-activity')
    if (activityEl) activityEl.innerHTML = `<p class="text-sm text-marea-gray">Nessuna attività recente. Le tabelle del database devono ancora essere create.</p>`
  }
}

function statusColor(status) {
  const colors = {
    proposed: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}
