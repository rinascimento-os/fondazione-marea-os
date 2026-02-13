import { supabase } from '../supabase.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'

let allEntries = []
let allMatches = []
let filterPioniere = ''
let filterProject = ''

export function renderTimebank() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap gap-2">
          <select id="tb-filter-pioniere" class="px-3 py-2 rounded-lg border border-marea-border bg-white text-sm">
            <option value="">Tutti i Pionieri</option>
          </select>
          <select id="tb-filter-project" class="px-3 py-2 rounded-lg border border-marea-border bg-white text-sm">
            <option value="">Tutti i progetti</option>
          </select>
        </div>
        <button id="log-hours-btn" class="inline-flex items-center gap-2 bg-marea-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-marea-dark transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Registra ore
        </button>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-marea-border p-4">
          <p class="text-sm text-marea-gray">Ore totali</p>
          <p id="tb-total-hours" class="text-2xl font-bold text-marea-black">—</p>
        </div>
        <div class="bg-white rounded-xl border border-marea-border p-4">
          <p class="text-sm text-marea-gray">Pionieri attivi</p>
          <p id="tb-active-pionieri" class="text-2xl font-bold text-marea-black">—</p>
        </div>
        <div class="bg-white rounded-xl border border-marea-border p-4">
          <p class="text-sm text-marea-gray">Progetti serviti</p>
          <p id="tb-projects-served" class="text-2xl font-bold text-marea-black">—</p>
        </div>
      </div>

      <!-- Ledger -->
      <div class="bg-white rounded-xl border border-marea-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-marea-cream border-b border-marea-border">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-marea-gray">Data</th>
                <th class="text-left px-4 py-3 font-medium text-marea-gray">Pioniere</th>
                <th class="text-left px-4 py-3 font-medium text-marea-gray">Progetto</th>
                <th class="text-left px-4 py-3 font-medium text-marea-gray">Ore</th>
                <th class="text-left px-4 py-3 font-medium text-marea-gray">Descrizione</th>
                <th class="text-left px-4 py-3 font-medium text-marea-gray"></th>
              </tr>
            </thead>
            <tbody id="tb-entries">
              <tr><td colspan="6" class="px-4 py-8 text-center text-marea-gray">Caricamento...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

export async function initTimebank() {
  await Promise.all([loadEntries(), loadMatchesForForm()])

  document.getElementById('log-hours-btn')?.addEventListener('click', () => openLogHoursForm())
  document.getElementById('tb-filter-pioniere')?.addEventListener('change', (e) => { filterPioniere = e.target.value; renderEntries() })
  document.getElementById('tb-filter-project')?.addEventListener('change', (e) => { filterProject = e.target.value; renderEntries() })
}

async function loadEntries() {
  try {
    const { data } = await supabase
      .from('time_entries')
      .select('*, match:matches(id, pioniere:pionieri(id, full_name), need:project_needs(id, project:projects(id, name)))')
      .order('date', { ascending: false })

    allEntries = data || []
  } catch {
    allEntries = []
  }

  populateFilters()
  renderEntries()
  renderStats()
}

async function loadMatchesForForm() {
  try {
    const { data } = await supabase
      .from('matches')
      .select('id, status, pioniere:pionieri(full_name), need:project_needs(description, project:projects(name))')
      .in('status', ['confirmed', 'active'])
      .order('created_at', { ascending: false })

    allMatches = data || []
  } catch {
    allMatches = []
  }
}

function populateFilters() {
  const pioniereSelect = document.getElementById('tb-filter-pioniere')
  const projectSelect = document.getElementById('tb-filter-project')
  if (!pioniereSelect || !projectSelect) return

  const pionieri = new Map()
  const projects = new Map()

  allEntries.forEach(e => {
    const p = e.match?.pioniere
    const proj = e.match?.need?.project
    if (p) pionieri.set(p.id, p.full_name)
    if (proj) projects.set(proj.id, proj.name)
  })

  pioniereSelect.innerHTML = '<option value="">Tutti i Pionieri</option>' +
    Array.from(pionieri).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')

  projectSelect.innerHTML = '<option value="">Tutti i progetti</option>' +
    Array.from(projects).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')
}

function renderStats() {
  const totalHours = allEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
  const activePionieri = new Set(allEntries.map(e => e.match?.pioniere?.id).filter(Boolean)).size
  const projectsServed = new Set(allEntries.map(e => e.match?.need?.project?.id).filter(Boolean)).size

  const el = (id) => document.getElementById(id)
  if (el('tb-total-hours')) el('tb-total-hours').textContent = totalHours > 0 ? totalHours.toFixed(1) : '0'
  if (el('tb-active-pionieri')) el('tb-active-pionieri').textContent = activePionieri
  if (el('tb-projects-served')) el('tb-projects-served').textContent = projectsServed
}

function renderEntries() {
  const tbody = document.getElementById('tb-entries')
  if (!tbody) return

  let filtered = allEntries
  if (filterPioniere) filtered = filtered.filter(e => e.match?.pioniere?.id === filterPioniere)
  if (filterProject) filtered = filtered.filter(e => e.match?.need?.project?.id === filterProject)

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-marea-gray">Nessuna registrazione trovata. Clicca "Registra ore" per iniziare.</td></tr>'
    return
  }

  tbody.innerHTML = filtered.map(e => `
    <tr class="border-b border-marea-border last:border-0 hover:bg-marea-cream/50">
      <td class="px-4 py-3 whitespace-nowrap">${formatDate(e.date)}</td>
      <td class="px-4 py-3 font-medium">${e.match?.pioniere?.full_name || '—'}</td>
      <td class="px-4 py-3">${e.match?.need?.project?.name || '—'}</td>
      <td class="px-4 py-3 font-medium text-marea-teal">${e.hours}h</td>
      <td class="px-4 py-3 text-marea-gray max-w-xs truncate">${e.description || '—'}</td>
      <td class="px-4 py-3">
        <button class="entry-delete text-marea-gray hover:text-red-600" data-entry-id="${e.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    </tr>
  `).join('')

  tbody.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminare questa registrazione?')) return
      try {
        await supabase.from('time_entries').delete().eq('id', btn.dataset.entryId)
        await loadEntries()
      } catch (err) {
        alert('Errore: ' + err.message)
      }
    })
  })
}

function openLogHoursForm() {
  const content = `
    <form id="log-hours-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Abbinamento *</label>
        <select name="match_id" required class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
          <option value="">Seleziona...</option>
          ${allMatches.map(m => `
            <option value="${m.id}">${m.pioniere?.full_name || '—'} → ${m.need?.project?.name || '—'}</option>
          `).join('')}
        </select>
        ${allMatches.length === 0 ? '<p class="text-xs text-marea-gray mt-1">Nessun abbinamento confermato/attivo. Crea e conferma abbinamenti nella sezione Matching.</p>' : ''}
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1">Ore *</label>
          <input type="number" name="hours" required min="0.5" step="0.5" placeholder="es. 2"
                 class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1">Data *</label>
          <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}"
                 class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Descrizione</label>
        <textarea name="description" rows="2" placeholder="Che attività è stata svolta?"
                  class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30"></textarea>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="px-4 py-2 rounded-lg text-sm font-medium text-marea-gray hover:bg-gray-100">Annulla</button>
        <button type="submit" class="px-4 py-2 rounded-lg text-sm font-medium bg-marea-teal text-white hover:bg-marea-dark transition-colors">Registra</button>
      </div>
    </form>
  `

  showModal(renderModal({ title: 'Registra ore', content }))

  document.getElementById('log-hours-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)

    try {
      const { error } = await supabase.from('time_entries').insert({
        match_id: fd.get('match_id'),
        hours: parseFloat(fd.get('hours')),
        date: fd.get('date'),
        description: fd.get('description') || null,
      })
      if (error) throw error
      closeModal()
      await loadEntries()
    } catch (err) {
      alert('Errore: ' + err.message)
    }
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}
