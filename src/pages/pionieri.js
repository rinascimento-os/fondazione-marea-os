import { supabase } from '../supabase.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { renderSkillPicker, initSkillPicker, loadSkills } from '../components/skill-picker.js'

let allPionieri = []
let allSkills = []

export function renderPionieri() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div class="relative flex-1 max-w-md">
          <input type="text" id="pionieri-search" placeholder="Cerca per nome, luogo o competenza..."
                 class="w-full pl-10 pr-4 py-3 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <button id="add-pioniere-btn" class="btn-gold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Aggiungi Pioniere
        </button>
      </div>

      <div id="pionieri-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <p class="text-sm text-marea-gray col-span-full">Caricamento...</p>
      </div>
    </div>
  `
}

export async function initPionieri() {
  try {
    allSkills = await loadSkills()
  } catch {
    allSkills = []
  }

  await loadPionieri()

  document.getElementById('add-pioniere-btn')?.addEventListener('click', () => openPioniereForm())
  document.getElementById('pionieri-search')?.addEventListener('input', (e) => renderList(e.target.value))

  if (window.location.hash.includes('new=1')) {
    openPioniereForm()
  }
}

async function loadPionieri() {
  try {
    const { data, error } = await supabase
      .from('pionieri')
      .select('*, pioniere_skills(skill_id, proficiency, skill:skills(id, name, category))')
      .order('full_name')

    if (error) throw error
    allPionieri = data || []
  } catch {
    allPionieri = []
  }
  renderList()
}

function renderList(filter = '') {
  const container = document.getElementById('pionieri-list')
  if (!container) return

  let filtered = allPionieri
  if (filter.trim()) {
    const q = filter.toLowerCase()
    filtered = allPionieri.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.pioniere_skills?.some(ps => ps.skill?.name?.toLowerCase().includes(q))
    )
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-marea-gray mb-2">${filter ? 'Nessun risultato trovato.' : 'Nessun Pioniere ancora registrato.'}</p>
        ${!filter ? '<p class="text-sm text-marea-gray/60">Clicca "Aggiungi Pioniere" per iniziare.</p>' : ''}
      </div>
    `
    return
  }

  container.innerHTML = filtered.map(p => `
    <div class="bg-white rounded-2xl border border-marea-border/60 p-6 card-hover cursor-pointer pioniere-card" data-id="${p.id}">
      <div class="flex items-start gap-4">
        <div class="w-11 h-11 rounded-full bg-marea-teal-light flex items-center justify-center flex-shrink-0">
          <span class="text-marea-teal font-bold text-sm">${getInitials(p.full_name)}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-marea-black text-base">${p.full_name}</h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-marea-gray">
            ${p.location ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>${p.location}</span>` : ''}
            ${p.email ? `<span class="truncate">${p.email}</span>` : ''}
            ${p.availability ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${p.availability}</span>` : ''}
          </div>
          ${(p.pioniere_skills || []).length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${(p.pioniere_skills || []).map(ps => `
                <span class="badge bg-marea-teal-light text-marea-teal">${ps.skill?.name || '—'}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('')

  container.querySelectorAll('.pioniere-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = allPionieri.find(p => p.id === card.dataset.id)
      if (p) openPioniereForm(p)
    })
  })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function openPioniereForm(pioniere = null) {
  const isEdit = !!pioniere
  const currentSkills = pioniere?.pioniere_skills?.map(ps => ps.skill).filter(Boolean) || []

  const content = `
    <form id="pioniere-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Nome completo *</label>
        <input type="text" name="full_name" required value="${pioniere?.full_name || ''}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Email</label>
        <input type="email" name="email" value="${pioniere?.email || ''}"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Luogo</label>
          <input type="text" name="location" value="${pioniere?.location || ''}" placeholder="es. San Francisco"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Disponibilit&agrave;</label>
          <input type="text" name="availability" value="${pioniere?.availability || ''}" placeholder="es. 5 ore/mese"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Bio</label>
        <textarea name="bio" rows="3" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">${pioniere?.bio || ''}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Competenze</label>
        ${renderSkillPicker({ selectedSkills: currentSkills, inputId: 'pioniere-skills' })}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-marea-border/60">
        <div>
          ${isEdit ? `<button type="button" id="delete-pioniere-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina</button>` : ''}
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
    title: isEdit ? 'Modifica Pioniere' : 'Nuovo Pioniere',
    content
  }))

  const picker = initSkillPicker({
    inputId: 'pioniere-skills',
    skills: allSkills,
    selectedSkills: currentSkills,
  })

  const form = document.getElementById('pioniere-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const record = {
      full_name: fd.get('full_name'),
      email: fd.get('email') || null,
      location: fd.get('location') || null,
      bio: fd.get('bio') || null,
      availability: fd.get('availability') || null,
      updated_at: new Date().toISOString(),
    }

    try {
      let pioniereId
      if (isEdit) {
        const { error } = await supabase.from('pionieri').update(record).eq('id', pioniere.id)
        if (error) throw error
        pioniereId = pioniere.id
      } else {
        const { data, error } = await supabase.from('pionieri').insert(record).select().single()
        if (error) throw error
        pioniereId = data.id
      }

      // Update skills
      const selectedSkillIds = picker.getSelected().map(s => s.id)
      await supabase.from('pioniere_skills').delete().eq('pioniere_id', pioniereId)
      if (selectedSkillIds.length > 0) {
        await supabase.from('pioniere_skills').insert(
          selectedSkillIds.map(skillId => ({ pioniere_id: pioniereId, skill_id: skillId }))
        )
      }

      closeModal()
      await loadPionieri()
    } catch (err) {
      alert('Errore nel salvataggio: ' + err.message)
    }
  })

  if (isEdit) {
    document.getElementById('delete-pioniere-btn')?.addEventListener('click', async () => {
      if (!confirm('Sei sicuro di voler eliminare questo Pioniere?')) return
      try {
        await supabase.from('pionieri').delete().eq('id', pioniere.id)
        closeModal()
        await loadPionieri()
      } catch (err) {
        alert('Errore nell\'eliminazione: ' + err.message)
      }
    })
  }
}
