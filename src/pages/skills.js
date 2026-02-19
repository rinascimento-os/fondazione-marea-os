import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { initDeleteConfirm, showAlert } from '../utils/confirm-delete.js'
import { escapeAttr, withSubmitLock } from '../utils/helpers.js'

let allSkills = []

function getCategories() {
  const cats = [...new Set(allSkills.map(s => s.category).filter(Boolean))].sort()
  if (!cats.includes('Altro')) cats.push('Altro')
  return cats
}

export function renderSkills() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div class="relative flex-1 max-w-md">
          <input type="text" id="skills-search" placeholder="Cerca per nome, categoria o parola chiave..."
                 class="w-full pl-10 pr-4 py-3 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <button id="add-skill-btn" class="btn-gold whitespace-nowrap">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Aggiungi Competenza
        </button>
      </div>

      <div id="skills-list">
        <p class="text-sm text-marea-gray">Caricamento...</p>
      </div>
    </div>
  `
}

export async function initSkills() {
  await loadSkillsList()

  document.getElementById('add-skill-btn')?.addEventListener('click', () => openSkillForm())
  document.getElementById('skills-search')?.addEventListener('input', (e) => renderList(e.target.value))
}

async function loadSkillsList() {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category')
      .order('name')
    if (error) throw error
    allSkills = data || []
  } catch {
    allSkills = []
  }
  renderList()
}

function renderList(filter = '') {
  const container = document.getElementById('skills-list')
  if (!container) return

  let filtered = allSkills
  if (filter.trim()) {
    const q = filter.toLowerCase()
    filtered = allSkills.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.keywords?.toLowerCase().includes(q)
    )
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16">
        <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        <p class="text-marea-gray mb-2">${filter ? 'Nessun risultato trovato.' : 'Nessuna competenza definita.'}</p>
        ${!filter ? '<p class="text-sm text-marea-gray/60">Clicca "Aggiungi Competenza" per iniziare.</p>' : ''}
      </div>
    `
    return
  }

  // Group by category
  const grouped = {}
  for (const skill of filtered) {
    const cat = skill.category || 'Altro'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(skill)
  }

  container.innerHTML = Object.entries(grouped).map(([category, skills]) => `
    <div class="mb-10">
      <h3 class="text-base font-bold text-marea-navy uppercase tracking-wider mb-3">${escapeHtml(category)}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${skills.map(s => `
          <div class="bg-white rounded-xl border border-marea-border/60 p-4 flex flex-col" data-id="${escapeAttr(s.id)}">
            <h4 class="font-medium text-marea-black text-sm">${escapeHtml(s.name)}</h4>
            ${s.keywords ? `
              <div class="mt-2 flex-1">
                <span class="text-xs text-marea-gray font-medium">Keywords:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${s.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => `
                    <span class="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-marea-gray">${escapeHtml(k)}</span>
                  `).join('')}
                </div>
              </div>
            ` : '<p class="text-xs text-marea-gray/70 mt-1 flex-1">Nessuna parola chiave</p>'}
            <div class="mt-3 pt-2 border-t border-marea-border/40 flex items-center justify-between">
              <span class="badge bg-marea-teal-light text-marea-teal text-xs">${escapeHtml(s.category) || 'Altro'}</span>
              <button type="button" class="edit-skill-btn w-8 h-8 rounded-lg flex items-center justify-center text-marea-gray hover:text-marea-navy hover:bg-marea-yellow transition-all" data-id="${escapeAttr(s.id)}" title="Modifica">
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.edit-skill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = allSkills.find(s => s.id === btn.dataset.id)
      if (skill) openSkillForm(skill)
    })
  })
}

function openSkillForm(skill = null) {
  const isEdit = !!skill

  const content = `
    <form id="skill-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Nome competenza *</label>
        <input type="text" name="name" required value="${escapeHtml(skill?.name)}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all"
               placeholder="es. UX Design" />
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Categoria</label>
        <select name="category" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
          ${getCategories().map(c => `<option value="${c}" ${skill?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Parole chiave per matching</label>
        <input type="text" name="keywords" value="${escapeHtml(skill?.keywords)}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all"
               placeholder="es. ux, user experience, usabilit\u00e0" />
        <p class="text-xs text-marea-gray mt-1">Separate da virgola. Usate per suggerire questa competenza durante l'importazione CSV in base al ruolo.</p>
      </div>
    </form>
    <div class="flex items-center justify-end gap-3 pt-4 pb-1 mt-6 border-t border-marea-border/60 sticky bottom-0 bg-white">
      ${isEdit ? `<button type="button" id="delete-skill-btn" class="inline-flex items-center gap-2 py-2.5 px-6 rounded-full text-sm font-semibold bg-orange-500 text-white hover:brightness-110 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Elimina
      </button>` : ''}
      <button type="submit" form="skill-form" class="btn-gold py-2.5 px-6">
        ${isEdit ? 'Salva modifiche' : 'Aggiungi'}
      </button>
    </div>
  `

  showModal(renderModal({
    title: isEdit ? 'Modifica Competenza' : 'Nuova Competenza',
    content
  }))

  const form = document.getElementById('skill-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const name = fd.get('name').trim()
    const duplicate = allSkills.find(s => s.name.toLowerCase() === name.toLowerCase() && (!isEdit || s.id !== skill.id))
    if (duplicate) {
      showAlert(`Esiste già una competenza con il nome "${duplicate.name}".`)
      return
    }

    const unlock = withSubmitLock(form)
    if (!unlock) return

    const record = {
      name,
      category: fd.get('category') || 'Altro',
      keywords: fd.get('keywords') || null,
    }

    try {
      if (isEdit) {
        const { error } = await supabase.from('skills').update(record).eq('id', skill.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('skills').insert(record)
        if (error) throw error
      }
      closeModal()
      await loadSkillsList()
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })

  if (isEdit) {
    initDeleteConfirm('delete-skill-btn', skill.name, async () => {
      try {
        await supabase.from('skills').delete().eq('id', skill.id)
        closeModal()
        await loadSkillsList()
      } catch (err) {
        console.error('Errore:', err)
        showAlert('Si è verificato un errore. Riprova.')
      }
    })
  }
}
