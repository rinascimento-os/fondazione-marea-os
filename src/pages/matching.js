import { supabase } from '../supabase.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'

let openNeeds = []
let pionieri = []
let allMatches = []
let selectedNeed = null

export function renderMatching() {
  return `
    <div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button class="match-tab px-4 py-2 rounded-lg text-sm font-medium bg-marea-teal text-white" data-tab="create">Crea abbinamento</button>
        <button class="match-tab px-4 py-2 rounded-lg text-sm font-medium bg-white text-marea-black border border-marea-border hover:bg-marea-light" data-tab="manage">Gestisci abbinamenti</button>
      </div>

      <div id="match-create-view">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Open needs -->
          <div>
            <h2 class="font-bold text-marea-black mb-3">Esigenze aperte</h2>
            <div id="open-needs-list" class="space-y-2">
              <p class="text-sm text-marea-gray">Caricamento...</p>
            </div>
          </div>

          <!-- Right: Available Pionieri -->
          <div>
            <h2 class="font-bold text-marea-black mb-3">Pionieri disponibili</h2>
            <div id="matching-filter-info" class="text-sm text-marea-gray mb-3 hidden">
              Filtrati per competenza: <span id="filter-skill-name" class="font-medium text-marea-teal"></span>
              <button id="clear-filter" class="ml-2 text-xs text-red-500 hover:text-red-700">Rimuovi filtro</button>
            </div>
            <div id="available-pionieri-list" class="space-y-2">
              <p class="text-sm text-marea-gray">Seleziona un'esigenza per vedere i Pionieri compatibili.</p>
            </div>
          </div>
        </div>
      </div>

      <div id="match-manage-view" class="hidden">
        <div class="flex flex-wrap gap-2 mb-4">
          <select id="match-status-filter" class="px-3 py-2 rounded-lg border border-marea-border bg-white text-sm">
            <option value="">Tutti gli stati</option>
            <option value="proposed">Proposto</option>
            <option value="confirmed">Confermato</option>
            <option value="active">Attivo</option>
            <option value="completed">Completato</option>
          </select>
        </div>
        <div id="matches-list" class="space-y-3">
          <p class="text-sm text-marea-gray">Caricamento...</p>
        </div>
      </div>
    </div>
  `
}

export async function initMatching() {
  await Promise.all([loadOpenNeeds(), loadPionieri(), loadMatches()])

  // Tab switching
  document.querySelectorAll('.match-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.match-tab').forEach(t => {
        t.classList.remove('bg-marea-teal', 'text-white')
        t.classList.add('bg-white', 'text-marea-black', 'border', 'border-marea-border')
      })
      tab.classList.remove('bg-white', 'text-marea-black', 'border', 'border-marea-border')
      tab.classList.add('bg-marea-teal', 'text-white')

      const createView = document.getElementById('match-create-view')
      const manageView = document.getElementById('match-manage-view')
      if (tab.dataset.tab === 'create') {
        createView.classList.remove('hidden')
        manageView.classList.add('hidden')
      } else {
        createView.classList.add('hidden')
        manageView.classList.remove('hidden')
      }
    })
  })

  document.getElementById('match-status-filter')?.addEventListener('change', renderMatchesList)
  document.getElementById('clear-filter')?.addEventListener('click', () => {
    selectedNeed = null
    renderPionieriList()
    document.getElementById('matching-filter-info')?.classList.add('hidden')
    // Deselect need cards
    document.querySelectorAll('.need-card').forEach(c => c.classList.remove('ring-2', 'ring-marea-teal'))
  })
}

async function loadOpenNeeds() {
  try {
    const { data } = await supabase
      .from('project_needs')
      .select('*, skill:skills(id, name), project:projects(id, name)')
      .eq('status', 'open')
      .order('urgency')

    openNeeds = data || []
  } catch {
    openNeeds = []
  }
  renderNeedsList()
}

async function loadPionieri() {
  try {
    const { data } = await supabase
      .from('pionieri')
      .select('*, pioniere_skills(skill_id, skill:skills(id, name))')
      .order('full_name')

    pionieri = data || []
  } catch {
    pionieri = []
  }
}

async function loadMatches() {
  try {
    const { data } = await supabase
      .from('matches')
      .select('*, pioniere:pionieri(id, full_name, email, location), need:project_needs(id, description, hours_needed, skill:skills(name), project:projects(id, name))')
      .order('created_at', { ascending: false })

    allMatches = data || []
  } catch {
    allMatches = []
  }
  renderMatchesList()
}

function renderNeedsList() {
  const container = document.getElementById('open-needs-list')
  if (!container) return

  if (openNeeds.length === 0) {
    container.innerHTML = '<p class="text-sm text-marea-gray">Nessuna esigenza aperta. Crea esigenze nella sezione Progetti.</p>'
    return
  }

  container.innerHTML = openNeeds.map(n => `
    <div class="need-card bg-white rounded-lg border border-marea-border p-4 cursor-pointer hover:shadow-sm transition-all ${selectedNeed?.id === n.id ? 'ring-2 ring-marea-teal' : ''}" data-need-id="${n.id}">
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-medium text-sm text-marea-black">${n.project?.name || '—'}</p>
          <p class="text-xs text-marea-gray mt-0.5">${n.skill?.name || '—'} · ${n.hours_needed ? n.hours_needed + ' ore' : '—'}</p>
          ${n.description ? `<p class="text-xs text-marea-gray mt-1">${n.description}</p>` : ''}
        </div>
        <span class="px-1.5 py-0.5 rounded text-xs font-medium ${urgencyBadge(n.urgency)}">${urgencyLabel(n.urgency)}</span>
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.need-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedNeed = openNeeds.find(n => n.id === card.dataset.needId)
      // Highlight
      container.querySelectorAll('.need-card').forEach(c => c.classList.remove('ring-2', 'ring-marea-teal'))
      card.classList.add('ring-2', 'ring-marea-teal')
      renderPionieriList()
    })
  })
}

function renderPionieriList() {
  const container = document.getElementById('available-pionieri-list')
  const filterInfo = document.getElementById('matching-filter-info')
  const filterSkillName = document.getElementById('filter-skill-name')
  if (!container) return

  if (!selectedNeed) {
    container.innerHTML = '<p class="text-sm text-marea-gray">Seleziona un\'esigenza per vedere i Pionieri compatibili.</p>'
    filterInfo?.classList.add('hidden')
    return
  }

  // Filter pionieri by matching skill
  const skillId = selectedNeed.skill_id
  const matching = pionieri.filter(p =>
    p.pioniere_skills?.some(ps => ps.skill_id === skillId)
  )
  const others = pionieri.filter(p =>
    !p.pioniere_skills?.some(ps => ps.skill_id === skillId)
  )

  if (filterInfo && filterSkillName) {
    filterSkillName.textContent = selectedNeed.skill?.name || ''
    filterInfo.classList.remove('hidden')
  }

  if (pionieri.length === 0) {
    container.innerHTML = '<p class="text-sm text-marea-gray">Nessun Pioniere registrato.</p>'
    return
  }

  const renderPioniere = (p, isMatch) => `
    <div class="bg-white rounded-lg border ${isMatch ? 'border-marea-teal' : 'border-marea-border'} p-4 cursor-pointer hover:shadow-sm transition-all pioniere-match-card" data-pioniere-id="${p.id}">
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="font-medium text-sm text-marea-black">${p.full_name}</p>
          <p class="text-xs text-marea-gray">${p.location || ''} ${p.availability ? '· ' + p.availability : ''}</p>
          <div class="flex flex-wrap gap-1 mt-1.5">
            ${(p.pioniere_skills || []).map(ps => `
              <span class="px-1.5 py-0.5 rounded-full text-xs ${ps.skill_id === skillId ? 'bg-marea-teal text-white font-medium' : 'bg-marea-teal-light text-marea-teal'}">${ps.skill?.name || ''}</span>
            `).join('')}
          </div>
        </div>
        ${isMatch ? '<span class="text-xs font-medium text-marea-teal">Compatibile</span>' : ''}
      </div>
    </div>
  `

  container.innerHTML = [
    ...matching.map(p => renderPioniere(p, true)),
    ...others.map(p => renderPioniere(p, false)),
  ].join('')

  container.querySelectorAll('.pioniere-match-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = pionieri.find(p => p.id === card.dataset.pioniereId)
      if (p && selectedNeed) openCreateMatchModal(p, selectedNeed)
    })
  })
}

function openCreateMatchModal(pioniere, need) {
  const content = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="p-3 rounded-lg bg-marea-light">
          <p class="text-xs text-marea-gray mb-1">Pioniere</p>
          <p class="font-medium text-sm">${pioniere.full_name}</p>
          <p class="text-xs text-marea-gray">${pioniere.location || ''}</p>
        </div>
        <div class="p-3 rounded-lg bg-marea-light">
          <p class="text-xs text-marea-gray mb-1">Esigenza</p>
          <p class="font-medium text-sm">${need.project?.name || ''}</p>
          <p class="text-xs text-marea-gray">${need.skill?.name || ''} · ${need.hours_needed ? need.hours_needed + ' ore' : ''}</p>
        </div>
      </div>
      <form id="create-match-form">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1">Note</label>
          <textarea name="notes" rows="2" placeholder="Note opzionali sull'abbinamento..."
                    class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="px-4 py-2 rounded-lg text-sm font-medium text-marea-gray hover:bg-gray-100">Annulla</button>
          <button type="submit" class="px-4 py-2 rounded-lg text-sm font-medium bg-marea-teal text-white hover:bg-marea-dark transition-colors">Crea abbinamento</button>
        </div>
      </form>
    </div>
  `

  showModal(renderModal({ title: 'Nuovo abbinamento', content }))

  document.getElementById('create-match-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const notes = new FormData(e.target).get('notes') || null

    try {
      const { error } = await supabase.from('matches').insert({
        pioniere_id: pioniere.id,
        project_need_id: need.id,
        status: 'proposed',
        notes,
      })
      if (error) throw error

      // Update need status
      await supabase.from('project_needs').update({ status: 'matched' }).eq('id', need.id)

      closeModal()
      selectedNeed = null
      await Promise.all([loadOpenNeeds(), loadMatches()])
      renderPionieriList()
    } catch (err) {
      alert('Errore: ' + err.message)
    }
  })
}

function renderMatchesList() {
  const container = document.getElementById('matches-list')
  if (!container) return

  const statusFilter = document.getElementById('match-status-filter')?.value || ''
  let filtered = allMatches
  if (statusFilter) filtered = filtered.filter(m => m.status === statusFilter)

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-sm text-marea-gray">Nessun abbinamento trovato.</p>'
    return
  }

  container.innerHTML = filtered.map(m => `
    <div class="bg-white rounded-xl border border-marea-border p-5 hover:shadow-sm transition-shadow">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-marea-black">${m.pioniere?.full_name || '—'}</span>
            <svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            <span class="font-medium text-marea-black">${m.need?.project?.name || '—'}</span>
          </div>
          <p class="text-sm text-marea-gray">${m.need?.skill?.name || ''} ${m.need?.description ? '· ' + m.need.description : ''}</p>
          ${m.notes ? `<p class="text-xs text-marea-gray mt-1 italic">${m.notes}</p>` : ''}
        </div>
        <div class="flex items-center gap-2">
          <select class="match-status-select px-2 py-1 rounded border border-marea-border text-xs focus:outline-none" data-match-id="${m.id}">
            <option value="proposed" ${m.status === 'proposed' ? 'selected' : ''}>Proposto</option>
            <option value="confirmed" ${m.status === 'confirmed' ? 'selected' : ''}>Confermato</option>
            <option value="active" ${m.status === 'active' ? 'selected' : ''}>Attivo</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Completato</option>
          </select>
          <button class="match-delete text-marea-gray hover:text-red-600" data-match-id="${m.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.match-status-select').forEach(select => {
    select.addEventListener('change', async () => {
      try {
        await supabase.from('matches').update({ status: select.value }).eq('id', select.dataset.matchId)

        // If completed, mark need as fulfilled
        if (select.value === 'completed') {
          const match = allMatches.find(m => m.id === select.dataset.matchId)
          if (match?.need?.id) {
            await supabase.from('project_needs').update({ status: 'fulfilled' }).eq('id', match.need.id)
          }
        }

        await loadMatches()
      } catch (err) {
        alert('Errore: ' + err.message)
      }
    })
  })

  container.querySelectorAll('.match-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminare questo abbinamento?')) return
      try {
        // Reset need status to open
        const match = allMatches.find(m => m.id === btn.dataset.matchId)
        if (match?.need?.id) {
          await supabase.from('project_needs').update({ status: 'open' }).eq('id', match.need.id)
        }
        await supabase.from('matches').delete().eq('id', btn.dataset.matchId)
        await Promise.all([loadMatches(), loadOpenNeeds()])
      } catch (err) {
        alert('Errore: ' + err.message)
      }
    })
  })
}

function urgencyBadge(u) {
  return { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[u] || 'bg-gray-100 text-gray-800'
}
function urgencyLabel(u) {
  return { high: 'Alta', medium: 'Media', low: 'Bassa' }[u] || u
}
