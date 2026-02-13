import { supabase } from '../supabase.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { loadSkills } from '../components/skill-picker.js'

let allProjects = []
let allSkills = []
let filterType = ''
let filterStatus = ''

export function renderProjects() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap gap-2">
          <select id="filter-type" class="px-3 py-2 rounded-lg border border-marea-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
            <option value="">Tutti i tipi</option>
            <option value="onda_project">Progetto Onda</option>
            <option value="foundation_need">Fondazione</option>
          </select>
          <select id="filter-status" class="px-3 py-2 rounded-lg border border-marea-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
            <option value="">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="paused">In pausa</option>
            <option value="completed">Completato</option>
          </select>
        </div>
        <button id="add-project-btn" class="inline-flex items-center gap-2 bg-marea-teal text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-marea-dark transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuovo Progetto
        </button>
      </div>

      <div id="projects-list" class="space-y-3">
        <p class="text-sm text-marea-gray">Caricamento...</p>
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
  if (filterType) filtered = filtered.filter(p => p.type === filterType)
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus)

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-marea-gray mb-4">Nessun progetto trovato.</p>
        <p class="text-sm text-marea-gray">Clicca "Nuovo Progetto" per iniziare.</p>
      </div>
    `
    return
  }

  container.innerHTML = filtered.map(p => {
    const openNeeds = (p.project_needs || []).filter(n => n.status === 'open').length
    const totalNeeds = (p.project_needs || []).length
    return `
      <div class="bg-white rounded-xl border border-marea-border p-5 hover:shadow-sm transition-shadow cursor-pointer project-card" data-id="${p.id}">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-marea-black">${p.name}</h3>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'onda_project' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                ${p.type === 'onda_project' ? 'Onda' : 'Fondazione'}
              </span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}">
                ${statusLabel(p.status)}
              </span>
            </div>
            ${p.description ? `<p class="text-sm text-marea-gray mt-1 line-clamp-2">${p.description}</p>` : ''}
          </div>
          <div class="text-sm text-marea-gray whitespace-nowrap">
            ${totalNeeds > 0 ? `${openNeeds}/${totalNeeds} esigenze aperte` : 'Nessuna esigenza'}
          </div>
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
  return { active: 'bg-green-100 text-green-800', paused: 'bg-yellow-100 text-yellow-800', completed: 'bg-gray-100 text-gray-800' }[status] || 'bg-gray-100 text-gray-800'
}

function statusLabel(status) {
  return { active: 'Attivo', paused: 'In pausa', completed: 'Completato' }[status] || status
}

function openProjectForm(project = null) {
  const isEdit = !!project
  const content = `
    <form id="project-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Nome progetto *</label>
        <input type="text" name="name" required value="${project?.name || ''}"
               class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30 focus:border-marea-teal" />
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Tipo *</label>
        <select name="type" required class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
          <option value="onda_project" ${project?.type === 'onda_project' ? 'selected' : ''}>Progetto Onda</option>
          <option value="foundation_need" ${project?.type === 'foundation_need' ? 'selected' : ''}>Esigenza Fondazione</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Stato</label>
        <select name="status" class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
          <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Attivo</option>
          <option value="paused" ${project?.status === 'paused' ? 'selected' : ''}>In pausa</option>
          <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completato</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Descrizione</label>
        <textarea name="description" rows="3" class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">${project?.description || ''}</textarea>
      </div>
      <div class="flex items-center justify-between pt-2">
        <div>
          ${isEdit ? `<button type="button" id="delete-project-btn" class="text-sm text-red-600 hover:text-red-800">Elimina</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="px-4 py-2 rounded-lg text-sm font-medium text-marea-gray hover:bg-gray-100">Annulla</button>
          <button type="submit" class="px-4 py-2 rounded-lg text-sm font-medium bg-marea-teal text-white hover:bg-marea-dark transition-colors">
            ${isEdit ? 'Salva' : 'Crea'}
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
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${project.type === 'onda_project' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
          ${project.type === 'onda_project' ? 'Progetto Onda' : 'Esigenza Fondazione'}
        </span>
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(project.status)}">
          ${statusLabel(project.status)}
        </span>
      </div>
      ${project.description ? `<p class="text-sm text-marea-gray">${project.description}</p>` : ''}

      <div class="flex items-center justify-between">
        <h3 class="font-bold text-marea-black">Esigenze</h3>
        <button id="add-need-btn" class="text-sm text-marea-teal hover:text-marea-dark font-medium">+ Aggiungi</button>
      </div>

      <div id="needs-list" class="space-y-2">
        ${needs.length === 0 ? '<p class="text-sm text-marea-gray">Nessuna esigenza ancora definita.</p>' : needs.map(n => `
          <div class="flex items-start justify-between gap-2 p-3 rounded-lg border border-marea-border bg-marea-cream">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-marea-black">${n.skill?.name || '—'}</span>
                <span class="px-1.5 py-0.5 rounded text-xs font-medium ${urgencyBadge(n.urgency)}">${urgencyLabel(n.urgency)}</span>
                <span class="px-1.5 py-0.5 rounded text-xs font-medium ${needStatusBadge(n.status)}">${needStatusLabel(n.status)}</span>
              </div>
              ${n.description ? `<p class="text-xs text-marea-gray mt-0.5">${n.description}</p>` : ''}
              ${n.hours_needed ? `<p class="text-xs text-marea-gray mt-0.5">${n.hours_needed} ore richieste</p>` : ''}
            </div>
            <button class="need-delete text-marea-gray hover:text-red-600 text-xs" data-need-id="${n.id}">Elimina</button>
          </div>
        `).join('')}
      </div>

      <div class="flex justify-between pt-2 border-t border-marea-border">
        <button id="edit-project-btn" class="text-sm text-marea-teal hover:text-marea-dark font-medium">Modifica progetto</button>
        <button onclick="document.getElementById('modal-container')?.remove()" class="px-4 py-2 rounded-lg text-sm font-medium text-marea-gray hover:bg-gray-100">Chiudi</button>
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
    <form id="need-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Competenza richiesta *</label>
        <select name="skill_id" required class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
          <option value="">Seleziona...</option>
          ${allSkills.map(s => `<option value="${s.id}">${s.name}${s.category ? ` (${s.category})` : ''}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1">Descrizione</label>
        <textarea name="description" rows="2" placeholder="Descrivi l'esigenza specifica..."
                  class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30"></textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1">Ore necessarie</label>
          <input type="number" name="hours_needed" min="1" placeholder="es. 10"
                 class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1">Urgenza</label>
          <select name="urgency" class="w-full px-3 py-2 rounded-lg border border-marea-border text-sm focus:outline-none focus:ring-2 focus:ring-marea-teal/30">
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="low">Bassa</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="px-4 py-2 rounded-lg text-sm font-medium text-marea-gray hover:bg-gray-100">Annulla</button>
        <button type="submit" class="px-4 py-2 rounded-lg text-sm font-medium bg-marea-teal text-white hover:bg-marea-dark transition-colors">Aggiungi</button>
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
  return { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[u] || 'bg-gray-100 text-gray-800'
}
function urgencyLabel(u) {
  return { high: 'Alta', medium: 'Media', low: 'Bassa' }[u] || u
}
function needStatusBadge(s) {
  return { open: 'bg-blue-100 text-blue-800', matched: 'bg-yellow-100 text-yellow-800', fulfilled: 'bg-green-100 text-green-800' }[s] || 'bg-gray-100 text-gray-800'
}
function needStatusLabel(s) {
  return { open: 'Aperta', matched: 'Abbinata', fulfilled: 'Soddisfatta' }[s] || s
}
