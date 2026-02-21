import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { renderSkillPicker, initSkillPicker, loadSkills } from '../components/skill-picker.js'
import { openCsvImport } from '../components/csv-import.js'
import { initDeleteConfirm, showAlert } from '../utils/confirm-delete.js'
import { escapeAttr, getInitials, withSubmitLock } from '../utils/helpers.js'

let allPionieri = []
let allSkills = []

export function renderPionieri() {
  return `
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-3 flex-1 max-w-md">
          <span id="pionieri-count" class="text-sm font-semibold text-marea-navy bg-marea-navy/10 px-3 py-1.5 rounded-full whitespace-nowrap"><svg class="w-4 h-4 animate-spin text-marea-navy/40" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
          <div class="relative flex-1">
          <input type="text" id="pionieri-search" placeholder="Cerca per nome, luogo o competenza..."
                 class="w-full pl-10 pr-4 py-3 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
        <div class="flex gap-2">
          <button id="import-csv-btn" class="btn-outline">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            Importa CSV
          </button>
          <button id="add-pioniere-btn" class="btn-gold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Aggiungi Pioniere
          </button>
        </div>
      </div>

      <div id="pionieri-list" class="columns-1 lg:columns-2 gap-4 space-y-4">
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
  document.getElementById('import-csv-btn')?.addEventListener('click', () => {
    openCsvImport({
      skills: allSkills,
      existingPionieri: allPionieri,
      onComplete: () => loadPionieri(),
    })
  })
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
      p.company?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.pioniere_skills?.some(ps => ps.skill?.name?.toLowerCase().includes(q))
    )
  }

  const countEl = document.getElementById('pionieri-count')
  if (countEl) countEl.textContent = `${allPionieri.length} Pionieri`

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16" style="column-span: all">
        <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-marea-gray mb-2">${filter ? 'Nessun risultato trovato.' : 'Nessun Pioniere ancora registrato.'}</p>
        ${!filter ? '<p class="text-sm text-marea-gray/60">Clicca "Aggiungi Pioniere" per iniziare.</p>' : ''}
      </div>
    `
    return
  }

  container.innerHTML = filtered.map(p => `
    <div class="bg-white rounded-2xl border border-marea-border/60 p-6 card-hover cursor-pointer pioniere-card break-inside-avoid" data-id="${escapeAttr(p.id)}">
      <div class="flex items-start gap-4">
        <div class="w-11 h-11 rounded-full bg-marea-teal-light flex items-center justify-center flex-shrink-0">
          <span class="text-marea-teal font-bold text-sm">${escapeHtml(getInitials(p.full_name))}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-marea-black text-base">${escapeHtml(p.full_name)}</h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-marea-gray">
            ${p.company ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>${escapeHtml(p.company)}</span>` : ''}
            ${p.location ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>${escapeHtml(p.location)}</span>` : ''}

          </div>
          ${(p.pioniere_skills || []).length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${(p.pioniere_skills || []).map(ps => `
                <span class="badge bg-marea-teal-light text-marea-teal">${escapeHtml(ps.skill?.name) || '—'}</span>
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
      if (p) openPioniereDetail(p)
    })
  })
}


function openPioniereDetail(pioniere) {
  const skills = pioniere.pioniere_skills?.map(ps => ps.skill).filter(Boolean) || []

  const iconField = (icon, label, value) => {
    return `
      <div class="flex items-start gap-3">
        <span class="w-8 h-8 rounded-lg ${value ? 'bg-white' : 'bg-gray-50'} flex items-center justify-center flex-shrink-0 mt-0.5">
          ${icon}
        </span>
        <div>
          <p class="text-xs text-marea-gray">${label}</p>
          <p class="text-sm ${value ? 'font-medium text-marea-black' : 'text-marea-gray/70 italic'}">${value ? escapeHtml(value) : 'Non specificato'}</p>
        </div>
      </div>
    `
  }

  const content = `
    <div class="space-y-5">
      <!-- Identity -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-marea-teal-light flex items-center justify-center flex-shrink-0">
          <span class="text-marea-teal font-bold text-xl">${escapeHtml(getInitials(pioniere.full_name))}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-marea-black">${escapeHtml(pioniere.full_name)}</h3>
          ${pioniere.role || pioniere.company ? `<p class="text-sm text-marea-gray mt-0.5">${[pioniere.role, pioniere.company].filter(Boolean).map(v => escapeHtml(v)).join(' · ')}</p>` : ''}
          ${pioniere.gender ? `<p class="text-xs text-marea-gray mt-1.5">Genere: ${escapeHtml(pioniere.gender)}</p>` : ''}
        </div>
      </div>

      <!-- Info -->
      <div class="bg-marea-cream/50 rounded-xl p-4 space-y-3">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-lg ${pioniere.email ? 'bg-white' : 'bg-gray-50'} flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </span>
          <div>
            <p class="text-xs text-marea-gray">Email</p>
            <div class="flex items-center gap-1.5">
              <p class="text-sm ${pioniere.email ? 'font-medium text-marea-black' : 'text-marea-gray/70 italic'}">${pioniere.email ? escapeHtml(pioniere.email) : 'Non specificato'}</p>
              ${pioniere.email ? `
                <button type="button" id="copy-email-btn" class="text-marea-gray hover:text-marea-teal transition-colors" title="Copia email">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        ${iconField(
          '<svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
          'Azienda / Ente', pioniere.company
        )}
        ${iconField(
          '<svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
          'Ruolo', pioniere.role
        )}
        ${iconField(
          '<svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>',
          'Citt&agrave; di origine', pioniere.origin
        )}
        ${iconField(
          '<svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
          'Residenza attuale', pioniere.location
        )}
      </div>

      <!-- Skills -->
      ${skills.length > 0 ? `
        <div>
          <p class="text-xs font-medium text-marea-gray uppercase tracking-wide mb-2">Competenze</p>
          <div class="flex flex-wrap gap-1.5">
            ${skills.map(s => `<span class="badge bg-marea-teal-light text-marea-teal">${escapeHtml(s.name)}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="flex items-center justify-between pt-4 pb-1 mt-6 border-t border-marea-border/60 sticky bottom-0 bg-white">
      <button type="button" id="delete-pioniere-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina pioniere</button>
      <button type="button" id="edit-pioniere-btn" class="btn-gold py-2.5 px-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        Modifica
      </button>
    </div>
  `

  showModal(renderModal({
    title: 'Dettaglio Pioniere',
    content,
    size: '2xl'
  }))

  document.getElementById('copy-email-btn')?.addEventListener('click', (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(pioniere.email).then(() => {
      const btn = document.getElementById('copy-email-btn')
      btn.innerHTML = '<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
      setTimeout(() => {
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>'
      }, 1500)
    })
  })

  document.getElementById('edit-pioniere-btn')?.addEventListener('click', () => {
    closeModal()
    openPioniereForm(pioniere)
  })

  initDeleteConfirm('delete-pioniere-btn', pioniere.full_name, async () => {
    try {
      await supabase.from('pionieri').delete().eq('id', pioniere.id)
      closeModal()
      await loadPionieri()
    } catch (err) {
      console.error('Errore nell\'eliminazione:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })
}

function openPioniereForm(pioniere = null) {
  const isEdit = !!pioniere
  const currentSkills = pioniere?.pioniere_skills?.map(ps => ps.skill).filter(Boolean) || []

  const content = `
    <form id="pioniere-form" class="space-y-5">
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Nome completo *</label>
          <input type="text" name="full_name" required value="${escapeHtml(pioniere?.full_name)}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Email</label>
          <input type="email" name="email" value="${escapeHtml(pioniere?.email)}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Azienda / Ente</label>
          <input type="text" name="company" value="${escapeHtml(pioniere?.company)}" placeholder="es. Google, Universit&agrave; di Catania"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Ruolo</label>
          <input type="text" name="role" value="${escapeHtml(pioniere?.role)}" placeholder="es. Presidente, CEO"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Citt&agrave; di origine</label>
          <input type="text" name="origin" value="${escapeHtml(pioniere?.origin)}" placeholder="es. Leonforte (Enna)"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Residenza attuale</label>
          <input type="text" name="location" value="${escapeHtml(pioniere?.location)}" placeholder="es. Milano, Londra"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Genere</label>
          <select name="gender" class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all">
            <option value="">—</option>
            <option value="M" ${pioniere?.gender === 'M' ? 'selected' : ''}>M</option>
            <option value="F" ${pioniere?.gender === 'F' ? 'selected' : ''}>F</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Competenze</label>
        ${renderSkillPicker({ selectedSkills: currentSkills, inputId: 'pioniere-skills' })}
      </div>
    </form>
    <div class="flex items-center ${isEdit ? 'justify-between' : 'justify-end'} pt-4 pb-1 mt-6 border-t border-marea-border/60 sticky bottom-0 bg-white">
      ${isEdit ? `<button type="button" id="delete-pioniere-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina pioniere</button>` : ''}
      <button type="submit" form="pioniere-form" class="btn-gold py-2.5 px-6">
        ${isEdit ? 'Salva modifiche' : 'Aggiungi'}
      </button>
    </div>
  `

  showModal(renderModal({
    title: isEdit ? 'Modifica Pioniere' : 'Nuovo Pioniere',
    content,
    size: '2xl'
  }))

  const picker = initSkillPicker({
    inputId: 'pioniere-skills',
    skills: allSkills,
    selectedSkills: currentSkills,
  })

  const form = document.getElementById('pioniere-form')
  form.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
    input.addEventListener('focus', () => {
      const len = input.value.length
      input.setSelectionRange(len, len)
    })
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(form)
    if (!unlock) return
    const fd = new FormData(form)
    const record = {
      full_name: fd.get('full_name'),
      email: fd.get('email') || null,
      company: fd.get('company') || null,
      role: fd.get('role') || null,
      origin: fd.get('origin') || null,
      location: fd.get('location') || null,
      gender: fd.get('gender') || null,
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
      unlock()
      console.error('Errore nel salvataggio:', err)
      showAlert('Si è verificato un errore. Riprova.')
    }
  })

  if (isEdit) {
    initDeleteConfirm('delete-pioniere-btn', pioniere.full_name, async () => {
      try {
        await supabase.from('pionieri').delete().eq('id', pioniere.id)
        closeModal()
        await loadPionieri()
      } catch (err) {
        console.error('Errore nell\'eliminazione:', err)
        showAlert('Si è verificato un errore. Riprova.')
      }
    })
  }
}
