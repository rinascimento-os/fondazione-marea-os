import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { loadSkills } from '../components/skill-picker.js'
import { showAlert, showConfirm } from '../utils/confirm-delete.js'
import { escapeAttr, urgencyBadge, urgencyLabel, withSubmitLock } from '../utils/helpers.js'

let allProjects = []
let allSkills = []
let filterType = ''
let filterStatus = ''
let searchQuery = ''

function getDetailId() {
  const match = window.location.hash.match(/^#\/progetti\/(.+)$/)
  return match ? match[1] : null
}

export function renderProjects() {
  const detailId = getDetailId()
  if (detailId) return renderProjectDetail()
  return renderProjectList()
}

export async function initProjects() {
  // Reset state on navigation
  allProjects = []
  filterType = ''
  filterStatus = ''
  searchQuery = ''

  try {
    allSkills = await loadSkills()
  } catch {
    allSkills = []
  }

  const detailId = getDetailId()
  if (detailId) {
    await initProjectDetail(detailId)
    return
  }

  await loadProjects()

  const pageActions = document.getElementById('page-actions')
  if (pageActions) {
    const legend = document.createElement('div')
    legend.className = 'flex items-center gap-4 text-xs text-marea-gray'
    legend.innerHTML = `
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-emerald-500"></span>Attivo</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-orange-400"></span>In pausa</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-marea-teal"></span>Completato</span>
    `
    pageActions.prepend(legend)
  }

  document.getElementById('add-project-btn')?.addEventListener('click', () => openProjectForm())
  document.getElementById('projects-search')?.addEventListener('input', (e) => { searchQuery = e.target.value; renderList() })
  document.getElementById('filter-type')?.addEventListener('change', (e) => { filterType = e.target.value; renderList() })
  document.getElementById('filter-status')?.addEventListener('change', (e) => { filterStatus = e.target.value; renderList() })

  if (window.location.hash.includes('new=1')) {
    openProjectForm()
  }
}

// --- List view ---

function renderProjectList() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <div class="relative flex-1 max-w-md">
            <input type="text" id="projects-search" placeholder="Cerca per nome o descrizione..."
                   class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <select id="filter-type" class="px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all">
            <option value="">Tutti i tipi</option>
            <option value="onda_project">Progetto Onda</option>
            <option value="foundation_need">Fondazione</option>
          </select>
          <select id="filter-status" class="px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all">
            <option value="">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="paused">In pausa</option>
            <option value="completed">Completato</option>
          </select>
        </div>
        <button id="add-project-btn" class="btn-gold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuovo Progetto
        </button>
      </div>

      <div id="projects-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <p class="text-sm text-marea-gray col-span-full">Caricamento...</p>
      </div>
    </div>
  `
}

async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_needs(id, skill_id, description, hours_needed, urgency, status, skill:skills(id, name))')
      .order('created_at', { ascending: false })

    if (error) throw error
    allProjects = data || []
  } catch {
    allProjects = []
  }
  renderList()
}

function renderList() {
  const container = document.getElementById('projects-list')
  if (!container) return

  let filtered = allProjects
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.project_needs?.some(n => n.skill?.name?.toLowerCase().includes(q))
    )
  }
  if (filterType) filtered = filtered.filter(p => p.type === filterType)
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus)

  const statusOrder = { active: 0, paused: 1, completed: 2 }
  const urgentCount = p => (p.project_needs || []).filter(n => n.urgency === 'high' && n.status === 'open').length
  filtered.sort((a, b) => (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1) || urgentCount(b) - urgentCount(a))

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <p class="text-marea-gray mb-2">Nessun progetto trovato.</p>
        <p class="text-sm text-marea-gray/60">Clicca "Nuovo Progetto" per iniziare.</p>
      </div>
    `
    return
  }

  container.innerHTML = filtered.map(p => {
    const openNeeds = (p.project_needs || []).filter(n => n.status === 'open').length
    const totalNeeds = (p.project_needs || []).length
    const coveredNeeds = totalNeeds - openNeeds
    const pct = totalNeeds > 0 ? Math.round((coveredNeeds / totalNeeds) * 100) : 0
    const barColor = pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-marea-teal' : 'bg-marea-border'
    const highUrgentOpen = (p.project_needs || []).filter(n => n.urgency === 'high' && n.status === 'open').length
    const uniqueSkills = [...new Map((p.project_needs || []).filter(n => n.skill?.name).map(n => [n.skill.id, n.skill.name])).values()]
    const visibleSkills = uniqueSkills.slice(0, 4)
    const extraCount = uniqueSkills.length - 4
    const skillTags = visibleSkills.map(name => `<span class="badge bg-marea-teal-light text-marea-teal text-[0.65rem]">${escapeHtml(name)}</span>`).join('') + (extraCount > 0 ? `<span class="badge bg-marea-border/40 text-marea-gray text-[0.65rem]">+${extraCount}</span>` : '')
    const statusStripe = { active: 'border-l-emerald-500', paused: 'border-l-orange-400', completed: 'border-l-marea-teal' }[p.status] || 'border-l-marea-teal'
    return `
      <div class="bg-white rounded-2xl border border-marea-border/60 border-l-[3px] ${statusStripe} p-6 card-hover cursor-pointer project-card flex flex-col" data-id="${escapeAttr(p.id)}">
        <div class="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 class="font-semibold text-marea-black text-lg">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-marea-gray mt-0.5">${p.type === 'onda_project' ? 'Onda' : 'Fondazione'}</p>
          </div>
          ${highUrgentOpen > 0 ? `<span class="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium flex-shrink-0"><span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>${highUrgentOpen} ${highUrgentOpen > 1 ? 'urgenti' : 'urgente'}</span>` : ''}
        </div>
        ${p.description ? `<p class="text-sm text-marea-gray line-clamp-2 mb-3 mt-2">${escapeHtml(p.description)}</p>` : '<div class="mt-2"></div>'}
        <div class="pt-3 border-t border-marea-border/40 space-y-3 flex-1 flex flex-col">
          ${totalNeeds > 0 ? `
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[0.65rem] text-marea-gray uppercase tracking-wide">Esigenze</span>
                <span class="text-xs text-marea-gray">${coveredNeeds} di ${totalNeeds} coperte</span>
              </div>
              <div class="h-1.5 bg-marea-border/30 rounded-full overflow-hidden">
                <div class="${barColor} h-full rounded-full transition-all" style="width:${pct}%"></div>
              </div>
            </div>
          ` : `<span class="text-xs text-marea-gray">Nessuna esigenza</span>`}
          ${skillTags ? `<div class="flex items-center gap-1.5 flex-wrap">${skillTags}</div>` : ''}
          <div class="flex justify-end mt-auto pt-1">
            <select class="status-select text-sm px-3 py-2 rounded-xl border border-marea-border bg-white text-marea-black font-medium focus-ring cursor-pointer" data-project-id="${escapeAttr(p.id)}">
              <option value="active" ${p.status === 'active' ? 'selected' : ''}>Attivo</option>
              <option value="paused" ${p.status === 'paused' ? 'selected' : ''}>In pausa</option>
              <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Completato</option>
            </select>
          </div>
        </div>
      </div>
    `
  }).join('')

  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.status-select')) return
      window.location.hash = `#/progetti/${card.dataset.id}`
    })
  })

  container.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const id = e.target.dataset.projectId
      const newStatus = e.target.value
      const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id)
      if (error) {
        showAlert('Errore nell\'aggiornamento dello stato')
        return
      }
      const proj = allProjects.find(p => p.id === id)
      if (proj) proj.status = newStatus
      renderList()
    })
  })
}

// --- Detail view ---

function renderProjectDetail() {
  return `
    <div>
      <div id="project-detail-content">
        <p class="text-sm text-marea-gray">Caricamento...</p>
      </div>
    </div>
  `
}

function updatePageTitle(projectName) {
  // If already replaced, just update the text
  const existing = document.getElementById('project-detail-header')
  if (existing) {
    const h1 = existing.querySelector('h1')
    if (h1) h1.textContent = projectName
    return
  }

  const titleArea = document.getElementById('page-title-area')
  const headerRow = titleArea?.parentElement?.parentElement
  if (!headerRow) return

  // Replace the default left-aligned header with centered layout + back link
  headerRow.classList.add('relative')
  headerRow.id = 'project-detail-header'
  headerRow.innerHTML = `
    <div class="flex items-center gap-3 relative z-10">
      <button id="menu-btn" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <a href="#/progetti" class="inline-flex items-center gap-1 text-sm text-marea-gray hover:text-marea-black font-medium transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Indietro
      </a>
    </div>
    <div id="page-title-area" class="absolute left-0 right-0 text-center pointer-events-none">
      <h1 class="text-2xl font-bold text-marea-black">${escapeHtml(projectName)}</h1>
    </div>
    <div id="page-actions" class="flex flex-wrap gap-3 relative z-10"></div>
  `

  // Wire up mobile menu button
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('-translate-x-full')
    document.getElementById('sidebar-overlay')?.classList.remove('hidden')
  })
}

async function initProjectDetail(projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_needs(id, skill_id, description, hours_needed, urgency, status, skill:skills(id, name))')
      .eq('id', projectId)
      .single()

    if (error) throw error
    updatePageTitle(data.name)
    renderDetailContent(data)
  } catch {
    updatePageTitle('Progetto non trovato')
    const container = document.getElementById('project-detail-content')
    if (container) {
      container.innerHTML = `
        <div class="text-center py-16">
          <p class="text-marea-gray mb-2">Progetto non trovato.</p>
          <a href="#/progetti" class="text-sm text-marea-teal hover:text-marea-dark font-medium">Torna ai progetti</a>
        </div>
      `
    }
  }
}

function renderDetailContent(project) {
  const container = document.getElementById('project-detail-content')
  if (!container) return

  const needs = project.project_needs || []
  const openNeeds = needs.filter(n => n.status === 'open').length
  const matchedNeeds = needs.filter(n => n.status === 'matched').length
  const fulfilledNeeds = needs.filter(n => n.status === 'fulfilled').length
  const totalHours = needs.reduce((sum, n) => sum + (n.hours_needed || 0), 0)

  const statusDot = { active: 'bg-emerald-500', paused: 'bg-orange-400', completed: 'bg-marea-teal' }[project.status] || 'bg-gray-400'

  container.innerHTML = `
    <div id="project-info" class="bg-white rounded-2xl border border-marea-border/60 p-6 mb-8">
      <div class="grid grid-cols-3 gap-y-5 gap-x-6">
        <div>
          <p class="text-xs text-marea-gray uppercase tracking-wide mb-1">Tipo</p>
          <p class="text-sm font-medium text-marea-black">${project.type === 'onda_project' ? 'Progetto Onda' : 'Esigenza Fondazione'}</p>
        </div>
        <div>
          <p class="text-xs text-marea-gray uppercase tracking-wide mb-1">Stato</p>
          <p class="text-sm font-medium text-marea-black flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            ${statusLabel(project.status)}
          </p>
        </div>
        <div>
          <p class="text-xs text-marea-gray uppercase tracking-wide mb-1">Ore totali richieste</p>
          <p class="text-sm font-medium text-marea-black">${totalHours > 0 ? totalHours : '—'}</p>
        </div>
      </div>
      ${project.description ? `
        <div class="mt-5 pt-5 border-t border-marea-border/40">
          <p class="text-xs text-marea-gray uppercase tracking-wide mb-1.5">Descrizione</p>
          <p class="text-sm text-marea-black/80 leading-relaxed">${escapeHtml(project.description)}</p>
        </div>
      ` : ''}
      <div class="mt-5 pt-4 border-t border-marea-border/40 flex justify-end">
        <button id="toggle-edit-btn" class="inline-flex items-center gap-1.5 text-sm text-marea-gray hover:text-marea-black font-medium transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Modifica progetto
        </button>
      </div>
    </div>

    <div id="project-edit" class="hidden bg-white rounded-2xl border border-marea-border/60 p-6 mb-8">
      <form id="project-detail-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-marea-gray mb-1.5 uppercase tracking-wide">Nome</label>
            <input type="text" name="name" required value="${escapeHtml(project.name)}"
                   class="w-full px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
          </div>
          <div>
            <label class="block text-xs font-medium text-marea-gray mb-1.5 uppercase tracking-wide">Tipo</label>
            <select name="type" required class="w-full px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all">
              <option value="onda_project" ${project.type === 'onda_project' ? 'selected' : ''}>Progetto Onda</option>
              <option value="foundation_need" ${project.type === 'foundation_need' ? 'selected' : ''}>Esigenza Fondazione</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-marea-gray mb-1.5 uppercase tracking-wide">Stato</label>
            <select name="status" class="w-full px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all">
              <option value="active" ${project.status === 'active' ? 'selected' : ''}>Attivo</option>
              <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>In pausa</option>
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completato</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-marea-gray mb-1.5 uppercase tracking-wide">Descrizione</label>
          <textarea name="description" rows="3" placeholder="Descrivi il progetto..."
                    oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                    class="w-full px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all resize-none overflow-hidden">${escapeHtml(project.description)}</textarea>
        </div>
        <div class="flex items-center justify-between pt-2">
          <button type="button" id="delete-project-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina progetto</button>
          <div class="flex items-center gap-3">
            <button type="button" id="cancel-edit-btn" class="text-sm text-marea-gray hover:text-marea-black font-medium transition-colors">Annulla</button>
            <button type="submit" class="btn-gold py-2 px-5 text-sm">Salva modifiche</button>
          </div>
        </div>
      </form>
    </div>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-heading font-semibold text-marea-black">Esigenze${needs.length > 0 ? ` <span class="text-sm font-sans font-normal text-marea-gray">(${needs.length})</span>` : ''}</h3>
        <button id="add-need-btn" class="btn-teal py-1.5 px-4 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Aggiungi esigenza
        </button>
      </div>

      <div id="needs-list" class="space-y-4">
        ${needs.length === 0 ? `
          <div class="text-center py-12 bg-white rounded-2xl border border-marea-border/60">
            <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p class="text-sm text-marea-gray">Nessuna esigenza ancora definita.</p>
          </div>
        ` : renderNeedsGrouped(needs)}
      </div>
    </div>
  `

  // Wire up event listeners
  const reloadDetail = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, project_needs(id, skill_id, description, hours_needed, urgency, status, skill:skills(id, name))')
      .eq('id', project.id)
      .single()
    if (data) {
      updatePageTitle(data.name)
      renderDetailContent(data)
    }
  }

  // Toggle edit mode
  const infoEl = document.getElementById('project-info')
  const editEl = document.getElementById('project-edit')
  const toggleEdit = (show) => {
    infoEl?.classList.toggle('hidden', show)
    editEl?.classList.toggle('hidden', !show)
  }

  document.getElementById('toggle-edit-btn')?.addEventListener('click', () => toggleEdit(true))
  document.getElementById('cancel-edit-btn')?.addEventListener('click', () => toggleEdit(false))

  // Save form
  const form = document.getElementById('project-detail-form')
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(form)
    if (!unlock) return
    const fd = new FormData(form)
    const record = {
      name: fd.get('name'),
      type: fd.get('type'),
      status: fd.get('status'),
      description: fd.get('description') || null,
      updated_at: new Date().toISOString(),
    }
    try {
      const { error } = await supabase.from('projects').update(record).eq('id', project.id)
      if (error) throw error
      await reloadDetail()
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })

  document.getElementById('delete-project-btn')?.addEventListener('click', () => {
    showConfirm('Sei sicuro di voler eliminare questo progetto e tutte le sue esigenze?', async () => {
      try {
        await supabase.from('projects').delete().eq('id', project.id)
        window.location.hash = '#/progetti'
      } catch (err) {
        console.error('Errore:', err)
        showAlert('Si è verificato un errore. Riprova.')
      }
    })
  })

  document.getElementById('add-need-btn')?.addEventListener('click', () => {
    openNeedForm(project, reloadDetail)
  })

  document.querySelectorAll('.needs-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling
      const chevron = btn.querySelector('svg')
      content?.classList.toggle('hidden')
      chevron?.classList.toggle('rotate-90')
    })
  })

  document.querySelectorAll('.need-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const need = needs.find(n => n.id === btn.dataset.needId)
      if (need) openNeedForm(project, reloadDetail, need)
    })
  })
}

function renderNeedsGrouped(needs) {
  const groups = [
    { key: 'open', label: 'Aperte', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600' },
    { key: 'matched', label: 'Matched', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: 'text-amber-600' },
    { key: 'fulfilled', label: 'Soddisfatte', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600' },
  ]

  return groups.map(g => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 }
    const items = needs.filter(n => n.status === g.key).sort((a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3))
    const isOpen = items.length > 0
    return `
      <div class="needs-group" data-status="${g.key}">
        <button type="button" class="needs-group-toggle w-full flex items-center gap-2 py-2 px-1 text-left group">
          <svg class="w-4 h-4 text-marea-gray transition-transform ${isOpen ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <svg class="w-4 h-4 ${g.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${g.icon}"/></svg>
          <span class="text-sm font-semibold text-marea-black">${g.label}</span>
          <span class="text-xs font-semibold text-marea-black bg-gray-200 rounded-full px-2 py-0.5">${items.length}</span>
        </button>
        <div class="needs-group-content ${isOpen ? '' : 'hidden'} mt-2 space-y-2 pl-6">
          ${items.length === 0
            ? `<p class="text-xs text-marea-gray/50 italic py-2">Nessuna esigenza</p>`
            : items.map(n => renderNeedCard(n)).join('')}
        </div>
      </div>
    `
  }).join('')
}

function renderNeedCard(need) {
  const borderColor = { high: 'border-l-red-400', medium: 'border-l-amber-400', low: 'border-l-gray-300' }[need.urgency] || 'border-l-gray-300'
  return `
    <div class="need-card flex items-center gap-3 p-3 rounded-xl border border-marea-border/60 border-l-[3px] ${borderColor} bg-white" data-need-id="${escapeAttr(need.id)}">
      <div class="flex-1 min-w-0">
        <span class="text-sm font-medium text-marea-black">${escapeHtml(need.skill?.name) || '—'}</span>
        ${need.description ? `<p class="text-xs text-marea-gray mt-0.5 truncate">${escapeHtml(need.description)}</p>` : ''}
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="badge ${urgencyBadge(need.urgency)}">${urgencyLabel(need.urgency)}</span>
        ${need.hours_needed ? `<span class="text-xs font-medium text-marea-gray">${need.hours_needed}h</span>` : ''}
        <button type="button" class="need-edit w-8 h-8 rounded-lg flex items-center justify-center text-marea-gray hover:text-marea-navy hover:bg-marea-yellow transition-all flex-shrink-0" data-need-id="${escapeAttr(need.id)}" title="Modifica">
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
      </div>
    </div>
  `
}


// --- Forms ---

function openProjectForm(project = null, onSave = null) {
  const isEdit = !!project
  const content = `
    <form id="project-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Nome progetto *</label>
        <input type="text" name="name" required value="${escapeHtml(project?.name)}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Tipo *</label>
          <select name="type" required class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="onda_project" ${project?.type === 'onda_project' ? 'selected' : ''}>Progetto Onda</option>
            <option value="foundation_need" ${project?.type === 'foundation_need' ? 'selected' : ''}>Esigenza Fondazione</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Stato</label>
          <select name="status" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Attivo</option>
            <option value="paused" ${project?.status === 'paused' ? 'selected' : ''}>In pausa</option>
            <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completato</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Descrizione</label>
        <textarea name="description" rows="3"
                  oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                  class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-none overflow-hidden">${escapeHtml(project?.description)}</textarea>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-marea-border/60">
        <div>
          ${isEdit ? `<button type="button" id="delete-project-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" class="cancel-modal-btn btn-outline py-2 px-5">Annulla</button>
          <button type="submit" class="btn-gold py-2 px-5">
            ${isEdit ? 'Salva modifiche' : 'Crea progetto'}
          </button>
        </div>
      </div>
    </form>
  `

  showModal(renderModal({ title: isEdit ? 'Modifica Progetto' : 'Nuovo Progetto', content }))

  const form = document.getElementById('project-form')

  form.querySelector('.cancel-modal-btn')?.addEventListener('click', () => closeModal())

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(form)
    if (!unlock) return
    const fd = new FormData(form)
    const record = {
      name: fd.get('name'),
      type: fd.get('type'),
      status: fd.get('status'),
      description: fd.get('description') || null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (isEdit) {
        const { error } = await supabase.from('projects').update(record).eq('id', project.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('projects').insert(record)
        if (error) throw error
      }
      closeModal()
      if (onSave) {
        await onSave()
      } else {
        await loadProjects()
      }
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })

  if (isEdit) {
    document.getElementById('delete-project-btn')?.addEventListener('click', () => {
      showConfirm('Sei sicuro di voler eliminare questo progetto e tutte le sue esigenze?', async () => {
        try {
          await supabase.from('projects').delete().eq('id', project.id)
          closeModal()
          window.location.hash = '#/progetti'
        } catch (err) {
          console.error('Errore:', err)
          showAlert('Si è verificato un errore. Riprova.')
        }
      })
    })
  }
}

function openNeedForm(project, onSave = null, existingNeed = null) {
  const isEdit = !!existingNeed
  const content = `
    <form id="need-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Competenza richiesta *</label>
        <select name="skill_id" required class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
          <option value="">Seleziona...</option>
          ${allSkills.map(s => `<option value="${s.id}" ${existingNeed?.skill_id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}${s.category ? ` (${escapeHtml(s.category)})` : ''}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Descrizione</label>
        <textarea name="description" rows="2" placeholder="Descrivi l'esigenza specifica..."
                  class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" style="overflow:hidden;resize:none"
                  oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'">${escapeHtml(existingNeed?.description)}</textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Ore necessarie</label>
          <input type="number" name="hours_needed" min="1" placeholder="es. 10" value="${existingNeed?.hours_needed || ''}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Urgenza</label>
          <select name="urgency" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="medium" ${existingNeed?.urgency === 'medium' ? 'selected' : ''}>Media</option>
            <option value="high" ${existingNeed?.urgency === 'high' ? 'selected' : ''}>Alta</option>
            <option value="low" ${existingNeed?.urgency === 'low' ? 'selected' : ''}>Bassa</option>
          </select>
        </div>
      </div>
      ${isEdit ? `
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Stato</label>
          <select name="status" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="open" ${existingNeed?.status === 'open' ? 'selected' : ''}>Aperta</option>
            <option value="matched" ${existingNeed?.status === 'matched' ? 'selected' : ''}>Abbinata</option>
            <option value="fulfilled" ${existingNeed?.status === 'fulfilled' ? 'selected' : ''}>Soddisfatta</option>
          </select>
        </div>
      ` : ''}
      <div class="flex justify-end gap-3 pt-3 border-t border-marea-border/60">
        ${isEdit ? `<button type="button" id="delete-need-btn" class="inline-flex items-center gap-2 py-2.5 px-6 rounded-full text-sm font-semibold bg-orange-500 text-white hover:brightness-110 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Elimina
        </button>` : `<button type="button" class="cancel-modal-btn btn-outline py-2 px-5">Annulla</button>`}
        <button type="submit" class="btn-gold py-2 px-5">${isEdit ? 'Salva modifiche' : 'Aggiungi esigenza'}</button>
      </div>
    </form>
  `

  showModal(renderModal({ title: isEdit ? `Modifica esigenza — ${escapeHtml(project.name)}` : `Nuova esigenza — ${escapeHtml(project.name)}`, content }))

  const ta = document.querySelector('#need-form textarea[name="description"]')
  if (ta && ta.value) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }

  document.querySelector('#need-form .cancel-modal-btn')?.addEventListener('click', () => closeModal())

  document.getElementById('need-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(e.target)
    if (!unlock) return
    const fd = new FormData(e.target)

    const record = {
      skill_id: fd.get('skill_id'),
      description: fd.get('description') || null,
      hours_needed: fd.get('hours_needed') ? parseInt(fd.get('hours_needed')) : null,
      urgency: fd.get('urgency'),
    }

    try {
      if (isEdit) {
        record.status = fd.get('status')
        const { error } = await supabase.from('project_needs').update(record).eq('id', existingNeed.id)
        if (error) throw error
      } else {
        record.project_id = project.id
        record.status = 'open'
        const { error } = await supabase.from('project_needs').insert(record)
        if (error) throw error
      }
      closeModal()
      if (onSave) {
        await onSave()
      } else {
        await loadProjects()
      }
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })

  if (isEdit) {
    document.getElementById('delete-need-btn')?.addEventListener('click', () => {
      showConfirm('Eliminare questa esigenza?', async () => {
        try {
          await supabase.from('project_needs').delete().eq('id', existingNeed.id)
          closeModal()
          if (onSave) {
            await onSave()
          } else {
            await loadProjects()
          }
        } catch (err) {
          console.error('Errore:', err)
          showAlert('Si è verificato un errore. Riprova.')
        }
      })
    })
  }
}

// --- Helpers ---

function statusLabel(status) {
  return { active: 'Attivo', paused: 'In pausa', completed: 'Completato' }[status] || status
}
