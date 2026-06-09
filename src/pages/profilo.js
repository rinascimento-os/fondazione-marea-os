import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { escapeAttr, getInitials, withSubmitLock, renderAvatar } from '../utils/helpers.js'
import { showAlert } from '../utils/confirm-delete.js'
import { renderSkillPicker, initSkillPicker, loadSkills } from '../components/skill-picker.js'
import { getRole } from '../role.js'
import { renderAvailabilitySelect } from '../utils/availability.js'
import { safeUrl } from '../utils/url.js'

let pioniere = null
let allSkills = []
let locationOptions = []

export function renderProfilo() {
  return `
    <div id="profilo-content">
      <p class="text-sm text-marea-gray">Caricamento...</p>
    </div>
  `
}

export async function initProfilo() {
  const role = getRole()
  if (!role?.pioniereId) {
    document.getElementById('profilo-content').innerHTML = `
      <p class="text-sm text-marea-gray">Il tuo profilo non &egrave; ancora associato a un Pioniere.</p>
    `
    return
  }

  try {
    const [{ data: row, error: pErr }, skills, locations] = await Promise.all([
      supabase
        .from('pionieri_public')
        .select('*, pioniere_skills(skill_id, skill:skills(id, name, category))')
        .eq('id', role.pioniereId)
        .single(),
      loadSkills(),
      loadLocationOptions(),
    ])
    if (pErr) throw pErr
    pioniere = row
    allSkills = skills || []
    locationOptions = locations || []
  } catch (err) {
    console.error('Errore nel caricamento profilo:', err)
    document.getElementById('profilo-content').innerHTML = `
      <p class="text-sm text-red-600">Errore nel caricamento del profilo.</p>
    `
    return
  }

  renderForm()
}

function renderForm(feedback = '') {
  const container = document.getElementById('profilo-content')
  if (!container) return

  const currentSkills = pioniere.pioniere_skills?.map(ps => ps.skill).filter(Boolean) || []
  const initialSnapshot = snapshotProfile(pioniere, currentSkills)

  container.innerHTML = `
    <div class="grid min-h-[calc(100vh-9rem)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_23rem] gap-6 items-stretch">
      <form id="profilo-form" class="bg-white rounded-2xl border border-marea-border/60 overflow-hidden self-stretch">
        <section class="p-6 border-b border-marea-border/60">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              ${renderAvatar(pioniere, { sizeClass: 'w-16 h-16', rounded: 'rounded-2xl', textClass: 'text-xl', initialsId: 'profilo-summary-initials' })}
              <div class="flex-1 min-w-0">
                <h2 id="profilo-summary-name" class="text-xl font-bold text-marea-black truncate">${escapeHtml(pioniere.full_name)}</h2>
                <p id="profilo-summary-meta" class="text-sm text-marea-gray mt-1">${escapeHtml(formatRoleCompany(pioniere)) || 'Aggiungi ruolo e azienda per rendere il profilo pi&ugrave; chiaro.'}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="p-6 border-b border-marea-border/60">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Informazioni personali</h3>
          </div>
          <div>
            <label class="block text-sm font-medium text-marea-black mb-1.5">Nome e cognome <span class="text-red-500">*</span></label>
            <input type="text" name="full_name" required value="${escapeAttr(pioniere.full_name)}"
                   class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
            <p id="profilo-name-error" class="hidden text-xs text-red-600 mt-1.5">Nome e cognome sono obbligatori.</p>
          </div>
        </section>

        <section class="p-6 border-b border-marea-border/60">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Lavoro</h3>
            <p class="text-sm text-marea-gray mt-1">Ruolo e organizzazione rendono pi&ugrave; semplice capire dove puoi contribuire.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-marea-black mb-1.5">Azienda / Ente</label>
              <input type="text" name="company" value="${escapeAttr(pioniere.company)}" placeholder="es. Google, Universit&agrave; di Catania"
                     class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
            </div>
            <div>
              <label class="block text-sm font-medium text-marea-black mb-1.5">Ruolo</label>
              <input type="text" name="role" value="${escapeAttr(pioniere.role)}" placeholder="es. Presidente, CEO"
                     class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
            </div>
          </div>
        </section>

        <section class="p-6 border-b border-marea-border/60">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Disponibilit&agrave; e contatti</h3>
            <p class="text-sm text-marea-gray mt-1">Indica dove vivi, la tua disponibilit&agrave; e il link al tuo profilo LinkedIn.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="relative" id="profilo-location-container">
              <label class="block text-sm font-medium text-marea-black mb-1.5">Residenza attuale</label>
              <input type="text" id="profilo-location-input" name="location" value="${escapeAttr(pioniere.location)}" placeholder="es. Milano, Londra"
                     class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" autocomplete="off" />
              <div id="profilo-location-dropdown" class="scrollbar-hidden absolute left-0 right-0 top-full mt-1 hidden max-h-56 overflow-y-auto rounded-xl border border-marea-border/70 bg-white shadow-lg z-30"></div>
            </div>
            <div>
              <label class="block text-sm font-medium text-marea-black mb-1.5">Disponibilit&agrave;</label>
              ${renderAvailabilitySelect({
                name: 'availability',
                value: pioniere.availability,
                selectClass: 'w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all bg-white',
              })}
            </div>
          </div>
          <div class="mt-5">
            <label class="block text-sm font-medium text-marea-black mb-1.5">LinkedIn</label>
            <input type="url" name="linkedin_url" value="${escapeAttr(pioniere.linkedin_url)}" placeholder="https://www.linkedin.com/in/..."
                   class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
          </div>
        </section>

        <section class="p-6 border-b border-marea-border/60">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Bio</h3>
            <p class="text-sm text-marea-gray mt-1">Una breve descrizione aiuta la rete a capire esperienze, interessi e disponibilit&agrave;.</p>
          </div>
          <label class="sr-only">Bio</label>
          <textarea name="bio" rows="5" placeholder="Raccontaci di te in poche righe..."
                    class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-y">${escapeHtml(pioniere.bio || '')}</textarea>
        </section>

        <section class="p-6 border-b border-marea-border/60">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Competenze</h3>
            <p class="text-sm text-marea-gray mt-1">Indica le competenze con cui puoi contribuire alla Fondazione.</p>
          </div>
          ${renderSkillPicker({
            selectedSkills: currentSkills,
            inputId: 'profilo-skills',
            placeholder: 'Cerca una competenza...',
          })}
        </section>

        <section class="p-6 border-b border-marea-border/60 bg-marea-cream/40">
          <div class="mb-5">
            <h3 class="text-lg text-marea-black">Dati gestiti dalla Fondazione</h3>
            <p class="text-sm text-marea-gray mt-1">Per modificare questi campi, contatta un amministratore.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${renderReadOnlyField('Citt&agrave; di origine', pioniere.origin)}
            ${renderReadOnlyField('Genere', pioniere.gender)}
          </div>
        </section>

      </form>

      <aside class="space-y-4 self-start xl:sticky xl:top-0">
        ${renderCompletionSlot(pioniere, currentSkills)}
        <div id="profilo-preview-card">
          ${renderPreviewCard(pioniere, currentSkills)}
        </div>
      </aside>
    </div>
  `
  renderHeaderActions(feedback)

  const form = document.getElementById('profilo-form')
  let picker
  picker = initSkillPicker({
    inputId: 'profilo-skills',
    skills: allSkills,
    selectedSkills: currentSkills,
    allowCreate: false,
    emptyMessage: 'Nessuna competenza trovata.',
    onAdd: () => {
      renderLiveProfile(form, picker)
      updateSaveState(form, picker, initialSnapshot)
    },
    onRemove: () => {
      renderLiveProfile(form, picker)
      updateSaveState(form, picker, initialSnapshot)
    },
  })

  const updateFromForm = () => {
    renderLiveProfile(form, picker)
    updateSaveState(form, picker, initialSnapshot)
  }
  form.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', updateFromForm)
    input.addEventListener('change', updateFromForm)
  })
  initLocationAutocomplete(updateFromForm)
  updateSaveState(form, picker, initialSnapshot)
  if (feedback) showHeaderFeedback()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const unlock = withSubmitLock(form)
    if (!unlock) return

    const fd = new FormData(form)
    const cleanStr = (v) => {
      const s = (v || '').toString().trim()
      return s.length === 0 ? null : s
    }
    const fullName = cleanStr(fd.get('full_name'))
    if (!fullName) {
      updateSaveState(form, picker, initialSnapshot)
      form.querySelector('[name="full_name"]')?.focus()
      showAlert('Nome e cognome sono obbligatori.')
      unlock()
      return
    }

    try {
      const { error: profileErr } = await supabase.rpc('update_my_profile', {
        _full_name: fullName,
        _company: cleanStr(fd.get('company')),
        _role: cleanStr(fd.get('role')),
        _location: normalizeCity(fd.get('location')),
        _availability: cleanStr(fd.get('availability')),
        _bio: cleanStr(fd.get('bio')),
        _linkedin_url: cleanStr(fd.get('linkedin_url')),
      })
      if (profileErr) throw profileErr

      const selectedIds = picker.getSelected().map(s => s.id)
      const currentIds = (pioniere.pioniere_skills || []).map(ps => ps.skill_id)
      const toAdd = selectedIds.filter(id => !currentIds.includes(id))
      const toRemove = currentIds.filter(id => !selectedIds.includes(id))

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('pioniere_skills')
          .delete()
          .eq('pioniere_id', pioniere.id)
          .in('skill_id', toRemove)
        if (error) throw error
      }
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('pioniere_skills')
          .insert(toAdd.map(skillId => ({ pioniere_id: pioniere.id, skill_id: skillId })))
        if (error) throw error
      }

      // Refresh local state and re-render
      const { data: refreshed } = await supabase
        .from('pionieri_public')
        .select('*, pioniere_skills(skill_id, skill:skills(id, name, category))')
        .eq('id', pioniere.id)
        .single()
      if (refreshed) pioniere = refreshed
      const normalizedLocation = normalizeCity(pioniere.location)
      if (normalizedLocation && !locationOptions.some(loc => loc.toLowerCase() === normalizedLocation.toLowerCase())) {
        locationOptions = [...locationOptions, normalizedLocation].sort((a, b) => a.localeCompare(b, 'it'))
      }

      unlock()
      renderForm('Profilo aggiornato.')
    } catch (err) {
      console.error('Errore nel salvataggio del profilo:', err)
      showAlert('Si è verificato un errore. Riprova.')
      unlock()
      updateSaveState(form, picker, initialSnapshot)
    }
  })
}

function cleanStr(v) {
  const s = (v || '').toString().trim()
  return s.length === 0 ? null : s
}

async function loadLocationOptions() {
  try {
    const { data, error } = await supabase
      .from('pionieri_public')
      .select('location')
      .not('location', 'is', null)
    if (error) throw error
    const byKey = new Map()
    ;(data || []).forEach(row => {
      const normalized = normalizeCity(row.location)
      if (!normalized) return
      const key = normalized.toLowerCase()
      if (!byKey.has(key)) byKey.set(key, normalized)
    })
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'it'))
  } catch (err) {
    console.warn('Errore nel caricamento citt&agrave;:', err)
    return []
  }
}

function initLocationAutocomplete(onChange) {
  const container = document.getElementById('profilo-location-container')
  const input = document.getElementById('profilo-location-input')
  const dropdown = document.getElementById('profilo-location-dropdown')
  if (!container || !input || !dropdown || locationOptions.length === 0) return

  const hide = () => {
    dropdown.classList.add('hidden')
    dropdown.innerHTML = ''
  }

  const render = () => {
    const query = input.value.trim().toLocaleLowerCase('it-IT')
    if (!query) {
      hide()
      return
    }
    const matches = locationOptions
      .filter(location => location.toLocaleLowerCase('it-IT').startsWith(query))
      .slice(0, 8)

    if (matches.length === 0) {
      hide()
      return
    }

    dropdown.innerHTML = matches.map(location => `
      <button type="button" class="block w-full px-4 py-2.5 text-left text-sm font-medium text-marea-black hover:bg-marea-light transition-colors" data-location="${escapeAttr(location)}">
        ${escapeHtml(location)}
      </button>
    `).join('')
    dropdown.classList.remove('hidden')

    dropdown.querySelectorAll('[data-location]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        input.value = btn.dataset.location
        hide()
        onChange()
      })
    })
  }

  input.addEventListener('input', render)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide()
  })
  document.addEventListener('mousedown', (e) => {
    if (!container.contains(e.target)) hide()
  })
}

function normalizeCity(value) {
  const cleaned = cleanStr(value)
  if (!cleaned) return null
  const compact = cleaned.replace(/\s+/g, ' ')
  return compact.split(' ').map(part => {
    return part
      .split('-')
      .map(piece => {
        if (!piece) return piece
        const lower = piece.toLocaleLowerCase('it-IT')
        return lower.charAt(0).toLocaleUpperCase('it-IT') + lower.slice(1)
      })
      .join('-')
  }).join(' ')
}

function renderHeaderActions(feedback = '') {
  const actions = document.getElementById('page-actions')
  if (!actions) return
  actions.innerHTML = `
    <button id="profilo-save-btn" type="submit" form="profilo-form" class="btn-gold py-2.5 px-5 disabled:opacity-50 disabled:pointer-events-none" disabled>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      Salva
    </button>
  `
  if (feedback) showHeaderFeedback()
}

function showHeaderFeedback() {
  const btn = document.getElementById('profilo-save-btn')
  if (!btn) return
  btn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
    Salvato
  `
  window.setTimeout(() => {
    const currentBtn = document.getElementById('profilo-save-btn')
    if (currentBtn && currentBtn.disabled) {
      currentBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        Salva
      `
    }
  }, 1800)
}

function formatRoleCompany(profile) {
  return [profile.role, profile.company].filter(Boolean).join(' · ')
}

function snapshotProfile(profile, skills) {
  return JSON.stringify({
    full_name: cleanStr(profile.full_name),
    company: cleanStr(profile.company),
    role: cleanStr(profile.role),
    location: normalizeCity(profile.location),
    availability: cleanStr(profile.availability),
    bio: cleanStr(profile.bio),
    linkedin_url: cleanStr(profile.linkedin_url),
    skillIds: (skills || []).map(s => s.id).sort(),
  })
}

function profileFromForm(form, picker) {
  const fd = new FormData(form)
  return {
    ...pioniere,
    full_name: cleanStr(fd.get('full_name')),
    company: cleanStr(fd.get('company')),
    role: cleanStr(fd.get('role')),
    location: normalizeCity(fd.get('location')),
    availability: cleanStr(fd.get('availability')),
    bio: cleanStr(fd.get('bio')),
    linkedin_url: cleanStr(fd.get('linkedin_url')),
    origin: pioniere.origin,
    gender: pioniere.gender,
    pioniere_skills: (picker?.getSelected() || []).map(skill => ({ skill_id: skill.id, skill })),
  }
}

function renderLiveProfile(form, picker) {
  if (!form) return
  const profile = profileFromForm(form, picker)
  const skills = picker?.getSelected() || []
  const summaryName = document.getElementById('profilo-summary-name')
  const summaryInitials = document.getElementById('profilo-summary-initials')
  const summaryMeta = document.getElementById('profilo-summary-meta')
  if (summaryName) summaryName.textContent = profile.full_name || 'Nome non specificato'
  if (summaryInitials) summaryInitials.textContent = getInitials(profile.full_name)
  if (summaryMeta) summaryMeta.textContent = formatRoleCompany(profile) || 'Aggiungi ruolo e azienda per rendere il profilo più chiaro.'

  const preview = document.getElementById('profilo-preview-card')
  if (preview) preview.innerHTML = renderPreviewCard(profile, skills)
  const completion = document.getElementById('profilo-completion-card')
  if (completion) {
    const content = renderCompletionCard(profile, skills)
    if (content) {
      completion.innerHTML = content
      completion.classList.remove('hidden')
    } else {
      completion.innerHTML = ''
      completion.classList.add('hidden')
    }
  }
}

function updateSaveState(form, picker, initialSnapshot) {
  const btn = document.getElementById('profilo-save-btn')
  if (!form || !btn) return
  const profile = profileFromForm(form, picker)
  const isDirty = snapshotProfile(profile, picker?.getSelected() || []) !== initialSnapshot
  const hasRequiredName = Boolean(cleanStr(profile.full_name))
  btn.disabled = !isDirty || !hasRequiredName
  updateNameValidation(form, hasRequiredName)
  if (isDirty) {
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      Salva
    `
  }
}

function updateNameValidation(form, hasRequiredName) {
  const input = form.querySelector('[name="full_name"]')
  const error = document.getElementById('profilo-name-error')
  input?.classList.toggle('border-red-400', !hasRequiredName)
  input?.classList.toggle('focus:border-red-500', !hasRequiredName)
  error?.classList.toggle('hidden', hasRequiredName)
}

function completionItems(profile, skills) {
  return [
    { label: 'Nome e cognome', done: Boolean(cleanStr(profile.full_name)) },
    { label: 'Ruolo', done: Boolean(cleanStr(profile.role)) },
    { label: 'Azienda / Ente', done: Boolean(cleanStr(profile.company)) },
    { label: 'Residenza attuale', done: Boolean(cleanStr(profile.location)) },
    { label: 'Disponibilit&agrave;', done: Boolean(cleanStr(profile.availability)) },
    { label: 'LinkedIn', done: Boolean(safeUrl(profile.linkedin_url)) },
    { label: 'Bio', done: Boolean(cleanStr(profile.bio)) },
    { label: 'Competenze', done: (skills || []).length > 0 },
  ]
}

function renderCompletionCard(profile, skills) {
  const items = completionItems(profile, skills)
  const done = items.filter(item => item.done).length
  const percent = Math.round((done / items.length) * 100)
  if (percent === 100) return ''
  return `
    <div class="bg-white rounded-2xl border border-marea-border/60 p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg text-marea-black">Completezza profilo</h3>
          <p class="text-sm text-marea-gray mt-1">${done} di ${items.length} campi completati</p>
        </div>
        <span class="shrink-0 text-sm font-bold text-marea-teal bg-marea-teal-light rounded-full px-3 py-1">${percent}%</span>
      </div>
      <div class="h-2 rounded-full bg-marea-warm-gray overflow-hidden mt-4">
        <div class="h-full bg-marea-teal rounded-full transition-all" style="width: ${percent}%"></div>
      </div>
      <div class="mt-4 space-y-2">
        ${items.map(item => `
          <div class="flex items-center gap-2 text-sm">
            <span class="w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-marea-teal text-white' : 'bg-marea-warm-gray text-marea-gray'}">
              ${item.done
                ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 13l4 4L19 7"/></svg>'
                : '<span class="w-1.5 h-1.5 rounded-full bg-current"></span>'}
            </span>
            <span class="${item.done ? 'text-marea-black' : 'text-marea-gray'}">${item.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderCompletionSlot(profile, skills) {
  const content = renderCompletionCard(profile, skills)
  return `
    <div id="profilo-completion-card" class="${content ? '' : 'hidden'}">
      ${content}
    </div>
  `
}

function renderPreviewCard(profile, skills) {
  const linkedin = safeUrl(profile.linkedin_url)
  const info = [
    { label: 'Azienda / Ente', value: profile.company },
    { label: 'Ruolo', value: profile.role },
    { label: 'Citt&agrave; di origine', value: profile.origin },
    { label: 'Residenza attuale', value: profile.location },
    { label: 'Disponibilit&agrave;', value: profile.availability },
  ]

  return `
    <div class="bg-white rounded-2xl border border-marea-border/60 p-5">
      <div class="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 class="text-lg text-marea-black">Anteprima pubblica</h3>
          <p class="text-sm text-marea-gray mt-1">Come apparirai nella rete.</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        ${renderAvatar(profile, { sizeClass: 'w-16 h-16', rounded: 'rounded-2xl', textClass: 'text-xl' })}
        <div class="min-w-0">
          <h4 class="text-lg font-bold text-marea-black truncate">${escapeHtml(profile.full_name || 'Nome non specificato')}</h4>
          ${formatRoleCompany(profile)
            ? `<p class="text-sm text-marea-gray mt-0.5">${escapeHtml(formatRoleCompany(profile))}</p>`
            : '<p class="text-sm text-marea-gray/70 italic mt-0.5">Ruolo e azienda non specificati</p>'}
        </div>
      </div>

      <div class="bg-marea-cream/60 rounded-xl p-4 space-y-3 mt-5">
        ${info.map(item => `
          <div>
            <p class="text-xs text-marea-gray">${item.label}</p>
            <p class="text-sm ${item.value ? 'font-medium text-marea-black' : 'text-marea-gray/70 italic'}">${item.value ? escapeHtml(item.value) : 'Non specificato'}</p>
          </div>
        `).join('')}
        ${linkedin ? `
          <div class="min-w-0">
            <p class="text-xs text-marea-gray">LinkedIn</p>
            <a href="${escapeAttr(linkedin)}" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-marea-teal hover:underline truncate block">${escapeHtml(linkedin)}</a>
          </div>
        ` : ''}
      </div>

      ${profile.bio ? `
        <div class="mt-5">
          <p class="text-xs font-medium text-marea-gray uppercase tracking-wide mb-2">Bio</p>
          <p class="text-sm text-marea-black whitespace-pre-wrap leading-relaxed">${escapeHtml(profile.bio)}</p>
        </div>
      ` : ''}

      <div class="mt-5">
        <p class="text-xs font-medium text-marea-gray uppercase tracking-wide mb-2">Competenze</p>
        ${(skills || []).length > 0 ? `
          <div class="flex flex-wrap gap-1.5">
            ${skills.map(s => `<span class="badge bg-marea-teal-light text-marea-teal">${escapeHtml(s.name)}</span>`).join('')}
          </div>
        ` : '<p class="text-sm text-marea-gray/70 italic">Nessuna competenza selezionata</p>'}
      </div>
    </div>
  `
}

function renderReadOnlyField(label, value) {
  return `
    <div class="rounded-xl border border-marea-border/70 bg-white px-4 py-3">
      <p class="text-xs text-marea-gray">${label}</p>
      <p class="text-sm ${value ? 'font-medium text-marea-black' : 'text-marea-gray/70 italic'} mt-0.5">${value ? escapeHtml(value) : 'Non specificato'}</p>
    </div>
  `
}
