import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'

let allSkills = []

const CATEGORIES = ['Tech', 'Business', 'Creative', 'Operations', 'Altro']

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
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-marea-gray uppercase tracking-wider mb-3">${escapeHtml(category)}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${skills.map(s => `
          <div class="bg-white rounded-xl border border-marea-border/60 p-4 card-hover cursor-pointer skill-card" data-id="${s.id}">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-marea-black text-sm">${escapeHtml(s.name)}</h4>
                ${s.keywords ? `
                  <div class="flex flex-wrap gap-1 mt-2">
                    ${s.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => `
                      <span class="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-marea-gray">${escapeHtml(k)}</span>
                    `).join('')}
                  </div>
                ` : '<p class="text-xs text-marea-gray/50 mt-1">Nessuna parola chiave</p>'}
              </div>
              <span class="badge bg-marea-teal-light text-marea-teal text-xs">${escapeHtml(s.category) || 'Altro'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => {
      const skill = allSkills.find(s => s.id === card.dataset.id)
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
          ${CATEGORIES.map(c => `<option value="${c}" ${skill?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Parole chiave per matching</label>
        <input type="text" name="keywords" value="${escapeHtml(skill?.keywords)}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all"
               placeholder="es. ux, user experience, usabilit\u00e0" />
        <p class="text-xs text-marea-gray mt-1">Separate da virgola. Usate per suggerire questa competenza durante l'importazione CSV in base al ruolo/bio.</p>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-marea-border/60">
        <div>
          ${isEdit ? `<button type="button" id="delete-skill-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina</button>` : ''}
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="document.getElementById('modal-container')?.remove()" class="btn-outline py-2 px-5">Annulla</button>
          <button type="submit" class="btn-gold py-2 px-5">
            ${isEdit ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </form>
  `

  showModal(renderModal({
    title: isEdit ? 'Modifica Competenza' : 'Nuova Competenza',
    content
  }))

  const form = document.getElementById('skill-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const record = {
      name: fd.get('name'),
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
      console.error('Errore:', err)
      alert('Si è verificato un errore. Riprova.')
    }
  })

  if (isEdit) {
    document.getElementById('delete-skill-btn')?.addEventListener('click', async () => {
      if (!confirm('Sei sicuro di voler eliminare questa competenza? Verr\u00e0 rimossa anche da tutti i Pionieri associati.')) return
      try {
        await supabase.from('skills').delete().eq('id', skill.id)
        closeModal()
        await loadSkillsList()
      } catch (err) {
        console.error('Errore:', err)
      alert('Si è verificato un errore. Riprova.')
      }
    })
  }
}
