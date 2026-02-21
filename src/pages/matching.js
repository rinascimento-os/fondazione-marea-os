import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { showAlert, showConfirm } from '../utils/confirm-delete.js'
import { escapeAttr, getInitials, urgencyBadge, urgencyLabel, withSubmitLock } from '../utils/helpers.js'

let openNeeds = []
let pionieri = []
let allMatches = []
let selectedNeed = null
let needsSearchQuery = ''
let matchesSearchQuery = ''
let pionieriSearchQuery = ''

export function renderMatching() {
  return `
    <div>
      <div id="match-create-view" class="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-16rem)]">
        <!-- Left: Open needs -->
        <div class="flex flex-col min-h-0 lg:border-r lg:border-marea-border/60 lg:pr-6">
          <h2 class="text-lg text-marea-black mb-4">Esigenze aperte</h2>
          <div class="relative mb-4">
            <input type="text" id="needs-search" placeholder="Cerca per progetto, competenza..."
                   class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div id="open-needs-list" class="space-y-3 overflow-y-auto flex-1 min-h-0 p-1 scrollbar-hidden">
            <p class="text-sm text-marea-gray">Caricamento...</p>
          </div>
        </div>

        <!-- Right: Available Pionieri -->
        <div class="flex flex-col min-h-0 lg:pl-6">
          <h2 class="text-lg text-marea-black mb-4">Pionieri disponibili</h2>
          <div id="pionieri-search-container" class="hidden relative mb-4">
            <input type="text" id="pionieri-manual-search" placeholder="Cerca un Pioniere per nome..."
                   class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div id="available-pionieri-list" class="space-y-3 overflow-y-auto flex-1 min-h-0 p-1 scrollbar-hidden">
            <div class="text-center py-12">
              <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <p class="text-sm text-marea-gray">Seleziona un'esigenza per vedere i Pionieri compatibili.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible existing matches -->
      <div class="mt-6 border-t border-marea-border/60 pt-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg text-marea-black">Match esistenti</h2>
          <span id="matches-count-badge" class="text-xs font-semibold text-marea-black bg-gray-200 rounded-full px-2.5 py-0.5"><svg class="w-4 h-4 animate-spin text-marea-navy/40" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
        </div>
        <div id="match-manage-view" class="mt-4">
          <div class="flex flex-wrap items-center gap-2 mb-6">
            <div class="relative flex-1 max-w-md">
              <input type="text" id="matches-search" placeholder="Cerca per pioniere, progetto o competenza..."
                     class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
              <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <select id="match-status-filter" class="px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all">
              <option value="">Tutti gli stati</option>
              <option value="proposed">Proposto</option>
              <option value="confirmed">Confermato</option>
              <option value="active">In corso</option>
              <option value="completed">Completato</option>
            </select>
          </div>
          <div id="matches-list" class="space-y-3 min-h-[60vh]">
            <p class="text-sm text-marea-gray">Caricamento...</p>
          </div>
        </div>
      </div>
    </div>
  `
}

export async function initMatching() {
  // Reset state on navigation
  openNeeds = []
  pionieri = []
  allMatches = []
  selectedNeed = null
  needsSearchQuery = ''
  matchesSearchQuery = ''
  pionieriSearchQuery = ''

  await Promise.all([loadOpenNeeds(), loadPionieri(), loadMatches()])

  document.getElementById('needs-search')?.addEventListener('input', (e) => { needsSearchQuery = e.target.value; renderNeedsList() })
  document.getElementById('pionieri-manual-search')?.addEventListener('input', (e) => { pionieriSearchQuery = e.target.value; renderPionieriList() })
  document.getElementById('matches-search')?.addEventListener('input', (e) => { matchesSearchQuery = e.target.value; renderMatchesList() })
  document.getElementById('match-status-filter')?.addEventListener('change', renderMatchesList)
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
      .select('*, pioniere_skills(skill_id, skill:skills(id, name)), matches(id, status)')
      .order('full_name')

    pionieri = (data || []).map(p => ({
      ...p,
      active_matches_count: (p.matches || []).filter(m => ['proposed', 'confirmed', 'active'].includes(m.status)).length,
    }))
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

  const urgencyOrder = { high: 0, medium: 1, low: 2 }
  let filtered = [...openNeeds].sort((a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3))
  if (needsSearchQuery.trim()) {
    const q = needsSearchQuery.toLowerCase()
    filtered = filtered.filter(n =>
      n.project?.name?.toLowerCase().includes(q) ||
      n.skill?.name?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q)
    )
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-sm text-marea-gray">${needsSearchQuery ? 'Nessun risultato trovato.' : 'Nessuna esigenza aperta.'}</p>
        ${!needsSearchQuery ? '<p class="text-xs text-marea-gray/60 mt-1">Crea esigenze nella sezione Progetti.</p>' : ''}
      </div>
    `
    return
  }

  // Group by project
  const grouped = {}
  for (const n of filtered) {
    const key = n.project?.id || 'unknown'
    if (!grouped[key]) grouped[key] = { name: n.project?.name || '—', needs: [] }
    grouped[key].needs.push(n)
  }

  const renderNeedCard = (n, showProject) => {
    return `
    <div class="need-card bg-white rounded-xl border-2 border-marea-border/60 p-5 cursor-pointer card-hover relative" data-need-id="${escapeAttr(n.id)}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          ${showProject ? `<p class="font-semibold text-sm text-marea-black">${escapeHtml(n.project?.name) || '—'}</p>` : ''}
          <div class="flex items-center gap-2 ${showProject ? 'mt-1.5' : ''}">
            <span class="badge bg-marea-teal-light text-marea-teal">${escapeHtml(n.skill?.name) || '—'}</span>
            ${n.hours_needed ? `<span class="text-xs text-marea-gray">${n.hours_needed} ore</span>` : ''}
          </div>
          ${n.description ? `<p class="text-xs text-marea-gray mt-2 leading-relaxed">${escapeHtml(n.description)}</p>` : ''}
        </div>
        <span class="badge ${urgencyBadge(n.urgency)}">${urgencyLabel(n.urgency)}</span>
      </div>
    </div>
  `}

  container.innerHTML = Object.values(grouped).map(group => {
    if (group.needs.length > 1) {
      return `
        <div>
          <p class="text-sm font-semibold text-marea-black mb-2 px-1">${escapeHtml(group.name)}</p>
          <div class="space-y-2">
            ${group.needs.map(n => renderNeedCard(n, false)).join('')}
          </div>
        </div>
      `
    }
    return renderNeedCard(group.needs[0], true)
  }).join('')

  // If selected need is no longer in the visible list, clear selection
  if (selectedNeed && !filtered.find(n => n.id === selectedNeed.id)) {
    selectedNeed = null
    renderPionieriList()
  }
  lockNeedsPanel()

  container.querySelectorAll('.need-card').forEach(card => {
    card.addEventListener('click', () => {
      const clickedNeed = openNeeds.find(n => n.id === card.dataset.needId) || filtered.find(n => n.id === card.dataset.needId)
      if (selectedNeed?.id === clickedNeed?.id) {
        selectedNeed = null
      } else {
        selectedNeed = clickedNeed
      }
      pionieriSearchQuery = ''
      lockNeedsPanel()
      renderPionieriList()
    })
  })
}

function lockNeedsPanel() {
  const needsList = document.getElementById('open-needs-list')
  if (!needsList) return

  const selectedClasses = ['border-marea-teal', 'bg-marea-teal/5', 'ring-2', 'ring-marea-teal/30', 'shadow-md']
  const defaultClasses = ['border-marea-border/60']

  needsList.querySelectorAll('.need-card').forEach(c => {
    if (selectedNeed) {
      if (c.dataset.needId === selectedNeed.id) {
        c.classList.remove('opacity-40', ...defaultClasses)
        c.classList.add(...selectedClasses)
      } else {
        c.classList.add('opacity-40', ...defaultClasses)
        c.classList.remove(...selectedClasses)
      }
    } else {
      c.classList.remove('opacity-40', ...selectedClasses)
      c.classList.add(...defaultClasses)
    }
  })
}

function renderPionieriList() {
  const container = document.getElementById('available-pionieri-list')
  if (!container) return

  const searchContainer = document.getElementById('pionieri-search-container')
  const searchInput = document.getElementById('pionieri-manual-search')

  if (!selectedNeed) {
    searchContainer?.classList.add('hidden')
    container.innerHTML = `
      <div class="text-center py-12">
        <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        <p class="text-sm text-marea-gray">Seleziona un'esigenza per vedere i Pionieri compatibili.</p>
      </div>
    `
    return
  }

  searchContainer?.classList.remove('hidden')
  if (searchInput) searchInput.value = pionieriSearchQuery

  const skillId = selectedNeed.skill_id
  const alreadyMatchedIds = new Set(
    allMatches
      .filter(m => m.project_need_id === selectedNeed.id && ['proposed', 'confirmed', 'active'].includes(m.status))
      .map(m => m.pioniere_id)
  )
  const matching = pionieri.filter(p =>
    !alreadyMatchedIds.has(p.id) && p.pioniere_skills?.some(ps => ps.skill_id === skillId)
  )
  const others = pionieri.filter(p =>
    !alreadyMatchedIds.has(p.id) && !p.pioniere_skills?.some(ps => ps.skill_id === skillId)
  )
  const alreadyMatched = pionieri.filter(p => alreadyMatchedIds.has(p.id))

  if (pionieri.length === 0) {
    container.innerHTML = '<p class="text-sm text-marea-gray">Nessun Pioniere registrato.</p>'
    return
  }

  const renderPioniere = (p, isMatch) => {
    const roleCompany = [p.role, p.company].filter(Boolean).map(s => escapeHtml(s)).join(' · ')
    const isAvailable = p.active_matches_count === 0
    return `
    <div class="${!isAvailable ? 'bg-white border-amber-300' : 'bg-white border-marea-teal/50'} rounded-xl border p-5 cursor-pointer card-hover pioniere-match-card" data-pioniere-id="${escapeAttr(p.id)}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-marea-teal/10 flex items-center justify-center flex-shrink-0">
            <span class="text-marea-teal font-bold text-xs">${escapeHtml(getInitials(p.full_name))}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="font-semibold text-sm text-marea-black">${escapeHtml(p.full_name)}</p>
              ${!isAvailable ? (() => {
                const activeMatchDetails = allMatches
                  .filter(m => m.pioniere_id === p.id && ['proposed', 'confirmed', 'active'].includes(m.status))
                  .map(m => [m.need?.project?.name, m.need?.skill?.name].filter(Boolean).join(' — '))
                return `<span class="relative text-[11px] text-amber-700 font-medium match-info-trigger" data-details="${escapeAttr(activeMatchDetails.join('|||'))}">Impegnato in ${p.active_matches_count} match</span>`
              })() : ''}
            </div>
            ${roleCompany ? `<p class="text-xs text-marea-gray mt-0.5">${roleCompany}</p>` : ''}
            <p class="text-xs text-marea-gray ${roleCompany ? '' : 'mt-0.5'}">${escapeHtml(p.location) || ''}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              ${(p.pioniere_skills || []).map(ps => `
                <span class="badge ${ps.skill_id === skillId ? 'bg-marea-teal-light text-marea-teal' : 'bg-marea-warm-gray text-marea-gray'}">${escapeHtml(ps.skill?.name) || ''}</span>
              `).join('')}
              ${p.availability ? `<span class="badge bg-emerald-100 text-emerald-700">${escapeHtml(p.availability)}</span>` : ''}
            </div>
          </div>
        </div>
        ${isMatch ? '<span class="badge bg-marea-yellow text-marea-navy font-semibold">Compatibile</span>' : ''}
      </div>
    </div>
  `}

  // When searching, search ALL pionieri; otherwise show only matching
  const q = pionieriSearchQuery.trim().toLowerCase()
  let displayMatching, displayOthers, displayAlready

  if (q) {
    displayMatching = matching.filter(p => p.full_name?.toLowerCase().includes(q))
    displayOthers = others.filter(p => p.full_name?.toLowerCase().includes(q))
    displayAlready = alreadyMatched.filter(p => p.full_name?.toLowerCase().includes(q))
  } else {
    displayMatching = matching
    displayOthers = []
    displayAlready = alreadyMatched
  }

  container.innerHTML = [
    ...displayMatching.map(p => renderPioniere(p, true)),
    !q && matching.length === 0 ? '<p class="text-sm text-marea-gray py-3">Nessun Pioniere con questa competenza.</p>' : '',
    ...displayOthers.map(p => renderPioniere(p, false)),
    displayAlready.length > 0 ? `<div class="opacity-50 pointer-events-none space-y-3 mt-2">${displayAlready.map(p => renderPioniere(p, false)).join('')}</div>` : '',
    q && displayMatching.length === 0 && displayOthers.length === 0 && displayAlready.length === 0 ? '<p class="text-sm text-marea-gray py-3">Nessun risultato.</p>' : '',
  ].join('')

  container.querySelectorAll('.pioniere-match-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = pionieri.find(p => p.id === card.dataset.pioniereId)
      if (p && selectedNeed && !alreadyMatchedIds.has(p.id)) openCreateMatchModal(p, selectedNeed)
    })
  })

  container.querySelectorAll('.match-info-trigger').forEach(el => {
    let tooltip = null
    el.addEventListener('mouseenter', () => {
      const details = el.dataset.details.split('|||')
      tooltip = document.createElement('div')
      tooltip.className = 'absolute z-50 bg-marea-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap'
      tooltip.innerHTML = details.map(d => escapeHtml(d)).join('<br>')
      el.style.position = 'relative'
      el.appendChild(tooltip)
      tooltip.style.top = `${el.offsetHeight + 4}px`
      tooltip.style.left = '0'
    })
    el.addEventListener('mouseleave', () => {
      tooltip?.remove()
      tooltip = null
    })
  })
}

function openCreateMatchModal(pioniere, need) {
  const content = `
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 rounded-xl bg-marea-teal-light/50 border border-marea-teal/10">
          <p class="text-xs text-marea-gray mb-1.5 uppercase tracking-wide">Pioniere</p>
          <p class="font-semibold text-sm text-marea-black">${escapeHtml(pioniere.full_name)}</p>
          <p class="text-xs text-marea-gray mt-0.5">${escapeHtml(pioniere.location) || ''}</p>
        </div>
        <div class="p-4 rounded-xl bg-amber-50/50 border border-amber-200/30">
          <p class="text-xs text-marea-gray mb-1.5 uppercase tracking-wide">Esigenza</p>
          <p class="font-semibold text-sm text-marea-black">${escapeHtml(need.project?.name) || ''}</p>
          <p class="text-xs text-marea-gray mt-0.5">${escapeHtml(need.skill?.name) || ''}${need.hours_needed ? ' · ' + need.hours_needed + ' ore' : ''}</p>
          ${need.description ? `<p class="text-xs text-marea-gray mt-2 leading-relaxed line-clamp-3">${escapeHtml(need.description)}</p>` : ''}
        </div>
      </div>
      <form id="create-match-form">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Note</label>
          <textarea name="notes" rows="2" placeholder="Note opzionali sull'abbinamento..."
                    oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                    class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-none overflow-hidden"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="cancel-modal-btn btn-outline py-2 px-5">Annulla</button>
          <button type="submit" class="btn-gold py-2 px-5">Crea abbinamento</button>
        </div>
      </form>
    </div>
  `

  showModal(renderModal({ title: 'Nuovo abbinamento', content }))

  document.querySelector('#create-match-form .cancel-modal-btn')?.addEventListener('click', () => closeModal())

  document.getElementById('create-match-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(e.target)
    if (!unlock) return
    const notes = new FormData(e.target).get('notes') || null

    try {
      const { error } = await supabase.from('matches').insert({
        pioniere_id: pioniere.id,
        project_need_id: need.id,
        status: 'proposed',
        notes,
      })
      if (error) throw error

      closeModal()
      await Promise.all([loadOpenNeeds(), loadPionieri(), loadMatches()])
      renderPionieriList()
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })
}

function renderMatchesList() {
  const container = document.getElementById('matches-list')
  if (!container) return

  const countBadge = document.getElementById('matches-count-badge')
  if (countBadge) countBadge.textContent = allMatches.length

  const statusFilter = document.getElementById('match-status-filter')?.value || ''
  let filtered = allMatches
  if (matchesSearchQuery.trim()) {
    const q = matchesSearchQuery.toLowerCase()
    filtered = filtered.filter(m =>
      m.pioniere?.full_name?.toLowerCase().includes(q) ||
      m.need?.project?.name?.toLowerCase().includes(q) ||
      m.need?.skill?.name?.toLowerCase().includes(q) ||
      m.need?.description?.toLowerCase().includes(q) ||
      m.notes?.toLowerCase().includes(q)
    )
  }
  if (statusFilter) filtered = filtered.filter(m => m.status === statusFilter)

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-sm text-marea-gray">Nessun abbinamento trovato.</p>
      </div>
    `
    return
  }

  // Group matches by project, then by need
  const grouped = {}
  for (const m of filtered) {
    const projKey = m.need?.project?.id || 'unknown'
    if (!grouped[projKey]) grouped[projKey] = { name: m.need?.project?.name || '—', needs: {} }
    const needKey = m.need?.id || 'unknown'
    if (!grouped[projKey].needs[needKey]) {
      grouped[projKey].needs[needKey] = {
        skill: m.need?.skill?.name || '—',
        description: m.need?.description || '',
        urgency: m.need?.urgency,
        matches: [],
      }
    }
    grouped[projKey].needs[needKey].matches.push(m)
  }

  const renderMatchRow = (m) => `
    <div class="flex items-center justify-between gap-3 py-2.5 px-4 hover:bg-marea-cream/30 transition-colors">
      <div class="flex items-center gap-2.5 flex-1 min-w-0">
        <div class="w-7 h-7 rounded-full bg-marea-teal-light flex items-center justify-center flex-shrink-0">
          <span class="text-marea-teal font-bold text-[10px]">${escapeHtml(getInitials(m.pioniere?.full_name))}</span>
        </div>
        <span class="font-semibold text-sm text-marea-black">${escapeHtml(m.pioniere?.full_name) || '—'}</span>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <select class="match-status-select px-3 py-1.5 rounded-lg border border-marea-border text-xs focus-ring transition-all" data-match-id="${escapeAttr(m.id)}">
          <option value="proposed" ${m.status === 'proposed' ? 'selected' : ''}>Proposto</option>
          <option value="confirmed" ${m.status === 'confirmed' ? 'selected' : ''}>Confermato</option>
          <option value="active" ${m.status === 'active' ? 'selected' : ''}>In corso</option>
          <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Completato</option>
        </select>
        <button class="match-delete text-marea-gray hover:text-red-500 transition-colors" data-match-id="${escapeAttr(m.id)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  `

  container.innerHTML = Object.values(grouped).map(group => {
    const needs = Object.values(group.needs)
    const totalPionieri = new Set(needs.flatMap(n => n.matches.map(m => m.pioniere_id))).size
    return `
    <div class="rounded-2xl border border-marea-border/60 bg-marea-cream/30 overflow-hidden">
      <button type="button" class="project-group-toggle flex items-center gap-2 w-full text-left px-4 py-3">
        <svg class="w-4 h-4 text-marea-gray transition-transform rotate-90 project-group-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="font-semibold text-base text-marea-black">${escapeHtml(group.name)}</span>
        <span class="badge bg-marea-navy/10 text-marea-navy font-semibold">${needs.length} esigenz${needs.length === 1 ? 'a' : 'e'}</span>
        <span class="badge bg-marea-navy/10 text-marea-navy font-semibold">${totalPionieri} pionier${totalPionieri === 1 ? 'e' : 'i'}</span>
      </button>
      <div class="project-group-content">
        ${needs.map(need => {
          const count = need.matches.length
          return `
          <div class="border-t border-marea-border/40">
            <div class="flex items-center justify-between gap-2 px-4 py-2.5 bg-white/60">
              <div class="flex items-center gap-2 min-w-0">
                <span class="badge bg-marea-teal-light text-marea-teal">${escapeHtml(need.skill)}</span>
                ${need.description ? `<span class="text-xs text-marea-gray truncate">${escapeHtml(need.description)}</span>` : ''}
              </div>
            </div>
            <div class="divide-y divide-marea-border/20 bg-white">
              ${need.matches.map(renderMatchRow).join('')}
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `}).join('')

  // Project group accordion toggle
  container.querySelectorAll('.project-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling
      const chevron = btn.querySelector('.project-group-chevron')
      content?.classList.toggle('hidden')
      chevron?.classList.toggle('rotate-90')
    })
  })

  container.querySelectorAll('.match-status-select').forEach(select => {
    select.addEventListener('change', async () => {
      try {
        await supabase.from('matches').update({ status: select.value }).eq('id', select.dataset.matchId)

        const match = allMatches.find(m => m.id === select.dataset.matchId)
        if (match?.need?.id) {
          const { data: active } = await supabase
            .from('matches')
            .select('id')
            .eq('project_need_id', match.need.id)
            .in('status', ['proposed', 'confirmed', 'active'])
            .neq('id', match.id)
            .limit(1)
          const hasActive = (active && active.length > 0) || ['proposed', 'confirmed', 'active'].includes(select.value)
          await supabase.from('project_needs').update({ status: hasActive ? 'open' : 'fulfilled' }).eq('id', match.need.id)

          // If match went back to a non-completed state, revert the parent project to active
          if (['proposed', 'confirmed', 'active'].includes(select.value) && match.need?.project?.id) {
            await supabase.from('projects').update({ status: 'active' }).eq('id', match.need.project.id).eq('status', 'completed')
          }
        }

        await Promise.all([loadMatches(), loadOpenNeeds(), loadPionieri()])
        renderPionieriList()
      } catch (err) {
        console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
      }
    })
  })

  container.querySelectorAll('.match-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Eliminare questo abbinamento?', async () => {
        try {
          const match = allMatches.find(m => m.id === btn.dataset.matchId)
          await supabase.from('matches').delete().eq('id', btn.dataset.matchId)

          // Only revert need to 'open' if no other active matches remain for it
          if (match?.need?.id) {
            const { data: remaining } = await supabase
              .from('matches')
              .select('id')
              .eq('project_need_id', match.need.id)
              .in('status', ['proposed', 'confirmed', 'active'])
              .limit(1)
            if (!remaining || remaining.length === 0) {
              await supabase.from('project_needs').update({ status: 'open' }).eq('id', match.need.id)
            }
          }

          await Promise.all([loadMatches(), loadOpenNeeds(), loadPionieri()])
          renderPionieriList()
        } catch (err) {
          console.error('Errore:', err)
          showAlert('Si è verificato un errore. Riprova.')
        }
      })
    })
  })
}

