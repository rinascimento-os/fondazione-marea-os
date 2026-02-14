import { supabase } from '../supabase.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { loadSkills } from '../components/skill-picker.js'

let allProjects = []
let allSkills = []
let filterType = ''
let filterStatus = ''
let searchQuery = ''

export function renderProjects() {
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

export async function initProjects() {
  try {
    allSkills = await loadSkills()
  } catch {
    allSkills = []
  }

  await loadProjects()

  document.getElementById('add-project-btn')?.addEventListener('click', () => openProjectForm())
  document.getElementById('projects-search')?.addEventListener('input', (e) => { searchQuery = e.target.value; renderList() })
  document.getElementById('filter-type')?.addEventListener('change', (e) => { filterType = e.target.value; renderList() })
  document.getElementById('filter-status')?.addEventListener('change', (e) => { filterStatus = e.target.value; renderList() })

  if (window.location.hash.includes('new=1')) {
    openProjectForm()
  }
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
    return `
      <div class="bg-white rounded-2xl border border-marea-border/60 p-6 card-hover cursor-pointer project-card" data-id="${p.id}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <h3 class="font-semibold text-marea-black text-base">${p.name}</h3>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="badge ${p.type === 'onda_project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
              ${p.type === 'onda_project' ? 'Onda' : 'Fondazione'}
            </span>
            <span class="badge ${statusBadge(p.status)}">
              ${statusLabel(p.status)}
            </span>
          </div>
        </div>
        ${p.description ? `<p class="text-sm text-marea-gray line-clamp-2 mb-3">${p.description}</p>` : ''}
        <div class="flex items-center gap-2 text-xs text-marea-gray pt-3 border-t border-marea-border/40">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          ${totalNeeds > 0 ? `${openNeeds}/${totalNeeds} esigenze aperte` : 'Nessuna esigenza'}
        </div>
      </div>
    `
  }).join('')

  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = allProjects.find(p => p.id === card.dataset.id)
      if (p) openProjectDetail(p)
    })
  })
}

function statusBadge(status) {
  return { active: 'bg-emerald-100 text-emerald-700', paused: 'bg-amber-100 text-amber-700', completed: 'bg-gray-100 text-gray-600' }[status] || 'bg-gray-100 text-gray-600'
}

function statusLabel(status) {
  return { active: 'Attivo', paused: 'In pausa', completed: 'Completato' }[status] || status
}

function openProjectForm(project = null) {
  const isEdit = !!project
  const content = `
    <form id="project-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Nome progetto *</label>
        <input type="text" name="name" required value="${project?.name || ''}"
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
        <textarea name="description" rows="3" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">${project?.description || ''}</textarea>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-marea-border/60">
        <div>
          ${isEdit ? `<button type="button" id="delete-project-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="btn-outline py-2 px-5">Annulla</button>
          <button type="submit" class="btn-gold py-2 px-5">
            ${isEdit ? 'Salva modifiche' : 'Crea progetto'}
          </button>
        </div>
      </div>
    </form>
  `

  showModal(renderModal({ title: isEdit ? 'Modifica Progetto' : 'Nuovo Progetto', content }))

  const form = document.getElementById('project-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
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
      await loadProjects()
    } catch (err) {
      alert('Errore: ' + err.message)
    }
  })

  if (isEdit) {
    document.getElementById('delete-project-btn')?.addEventListener('click', async () => {
      if (!confirm('Sei sicuro di voler eliminare questo progetto e tutte le sue esigenze?')) return
      try {
        await supabase.from('projects').delete().eq('id', project.id)
        closeModal()
        await loadProjects()
      } catch (err) {
        alert('Errore: ' + err.message)
      }
    })
  }
}

function openProjectDetail(project) {
  const needs = project.project_needs || []

  const content = `
    <div class="space-y-5">
      <div class="flex items-center gap-2">
        <span class="badge ${project.type === 'onda_project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
          ${project.type === 'onda_project' ? 'Progetto Onda' : 'Esigenza Fondazione'}
        </span>
        <span class="badge ${statusBadge(project.status)}">
          ${statusLabel(project.status)}
        </span>
      </div>
      ${project.description ? `<p class="text-sm text-marea-gray leading-relaxed">${project.description}</p>` : ''}

      <div class="flex items-center justify-between pt-2">
        <h3 class="font-semibold text-marea-black">Esigenze</h3>
        <button id="add-need-btn" class="btn-teal py-1.5 px-4 text-xs">+ Aggiungi</button>
      </div>

      <div id="needs-list" class="space-y-2">
        ${needs.length === 0 ? '<p class="text-sm text-marea-gray">Nessuna esigenza ancora definita.</p>' : needs.map(n => `
          <div class="flex items-start justify-between gap-2 p-4 rounded-xl border border-marea-border/60 bg-marea-cream/50">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-marea-black">${n.skill?.name || '—'}</span>
                <span class="badge ${urgencyBadge(n.urgency)}">${urgencyLabel(n.urgency)}</span>
                <span class="badge ${needStatusBadge(n.status)}">${needStatusLabel(n.status)}</span>
              </div>
              ${n.description ? `<p class="text-xs text-marea-gray mt-1">${n.description}</p>` : ''}
              ${n.hours_needed ? `<p class="text-xs text-marea-gray mt-1">${n.hours_needed} ore richieste</p>` : ''}
            </div>
            <button class="need-delete text-marea-gray hover:text-red-500 text-xs transition-colors" data-need-id="${n.id}">Elimina</button>
          </div>
        `).join('')}
      </div>

      <div class="flex justify-between pt-3 border-t border-marea-border/60">
        <button id="edit-project-btn" class="text-sm text-marea-teal hover:text-marea-dark font-medium transition-colors">Modifica progetto</button>
        <button onclick="document.getElementById('modal-container')?.remove()" class="btn-outline py-2 px-5">Chiudi</button>
      </div>
    </div>
  `

  showModal(renderModal({ title: project.name, content }))

  document.getElementById('edit-project-btn')?.addEventListener('click', () => {
    closeModal()
    openProjectForm(project)
  })

  document.getElementById('add-need-btn')?.addEventListener('click', () => {
    closeModal()
    openNeedForm(project)
  })

  document.querySelectorAll('.need-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!confirm('Eliminare questa esigenza?')) return
      try {
        await supabase.from('project_needs').delete().eq('id', btn.dataset.needId)
        closeModal()
        await loadProjects()
        const updatedProject = allProjects.find(p => p.id === project.id)
        if (updatedProject) openProjectDetail(updatedProject)
      } catch (err) {
        alert('Errore: ' + err.message)
      }
    })
  })
}

function openNeedForm(project) {
  const content = `
    <form id="need-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Competenza richiesta *</label>
        <select name="skill_id" required class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
          <option value="">Seleziona...</option>
          ${allSkills.map(s => `<option value="${s.id}">${s.name}${s.category ? ` (${s.category})` : ''}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Descrizione</label>
        <textarea name="description" rows="2" placeholder="Descrivi l'esigenza specifica..."
                  class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all"></textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Ore necessarie</label>
          <input type="number" name="hours_needed" min="1" placeholder="es. 10"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Urgenza</label>
          <select name="urgency" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="low">Bassa</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-3 border-t border-marea-border/60">
        <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="btn-outline py-2 px-5">Annulla</button>
        <button type="submit" class="btn-gold py-2 px-5">Aggiungi esigenza</button>
      </div>
    </form>
  `

  showModal(renderModal({ title: `Nuova esigenza — ${project.name}`, content }))

  document.getElementById('need-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)

    try {
      const { error } = await supabase.from('project_needs').insert({
        project_id: project.id,
        skill_id: fd.get('skill_id'),
        description: fd.get('description') || null,
        hours_needed: fd.get('hours_needed') ? parseInt(fd.get('hours_needed')) : null,
        urgency: fd.get('urgency'),
        status: 'open',
      })
      if (error) throw error
      closeModal()
      await loadProjects()
      const updatedProject = allProjects.find(p => p.id === project.id)
      if (updatedProject) openProjectDetail(updatedProject)
    } catch (err) {
      alert('Errore: ' + err.message)
    }
  })
}

function urgencyBadge(u) {
  return { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' }[u] || 'bg-gray-100 text-gray-600'
}
function urgencyLabel(u) {
  return { high: 'Alta', medium: 'Media', low: 'Bassa' }[u] || u
}
function needStatusBadge(s) {
  return { open: 'bg-blue-100 text-blue-700', matched: 'bg-amber-100 text-amber-700', fulfilled: 'bg-emerald-100 text-emerald-700' }[s] || 'bg-gray-100 text-gray-600'
}
function needStatusLabel(s) {
  return { open: 'Aperta', matched: 'Abbinata', fulfilled: 'Soddisfatta' }[s] || s
}
