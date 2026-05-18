import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { escapeAttr, getInitials, withSubmitLock } from '../utils/helpers.js'
import { showAlert } from '../utils/confirm-delete.js'
import { renderSkillPicker, initSkillPicker, loadSkills } from '../components/skill-picker.js'
import { getRole } from '../role.js'
import { AVAILABILITY_OPTIONS, renderAvailabilitySelect } from '../utils/availability.js'

let pioniere = null
let allSkills = []

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
    const [{ data: row, error: pErr }, skills] = await Promise.all([
      supabase
        .from('pionieri_public')
        .select('*, pioniere_skills(skill_id, skill:skills(id, name, category))')
        .eq('id', role.pioniereId)
        .single(),
      loadSkills(),
    ])
    if (pErr) throw pErr
    pioniere = row
    allSkills = skills || []
  } catch (err) {
    console.error('Errore nel caricamento profilo:', err)
    document.getElementById('profilo-content').innerHTML = `
      <p class="text-sm text-red-600">Errore nel caricamento del profilo.</p>
    `
    return
  }

  renderForm()
}

function renderForm() {
  const container = document.getElementById('profilo-content')
  if (!container) return

  const currentSkills = pioniere.pioniere_skills?.map(ps => ps.skill).filter(Boolean) || []

  container.innerHTML = `
    <div class="max-w-3xl">
      <div class="bg-white rounded-2xl border border-marea-border/60 p-6 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-marea-teal-light flex items-center justify-center flex-shrink-0">
            <span class="text-marea-teal font-bold text-xl">${escapeHtml(getInitials(pioniere.full_name))}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-marea-black">${escapeHtml(pioniere.full_name)}</h2>
            ${pioniere.origin ? `<p class="text-xs text-marea-gray mt-1.5">Citt&agrave; di origine: ${escapeHtml(pioniere.origin)}</p>` : ''}
          </div>
        </div>
        <p class="text-xs text-marea-gray/70 mt-4">Citt&agrave; di origine e dati demografici sono gestiti dalla Fondazione. Per modificarli, contatta un amministratore.</p>
      </div>

      <form id="profilo-form" class="bg-white rounded-2xl border border-marea-border/60 p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Nome completo *</label>
          <input type="text" name="full_name" required value="${escapeAttr(pioniere.full_name)}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-marea-black mb-1.5">Residenza attuale</label>
            <input type="text" name="location" value="${escapeAttr(pioniere.location)}" placeholder="es. Milano, Londra"
                   class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
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

        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">LinkedIn</label>
          <input type="url" name="linkedin_url" value="${escapeAttr(pioniere.linkedin_url)}" placeholder="https://www.linkedin.com/in/..."
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
          <p class="text-xs text-marea-gray/70 mt-1.5">Gli altri Pionieri vedranno questo link nel tuo profilo.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Bio</label>
          <textarea name="bio" rows="4" placeholder="Raccontaci di te in poche righe..."
                    class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-y">${escapeHtml(pioniere.bio || '')}</textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Le mie competenze</label>
          ${renderSkillPicker({ selectedSkills: currentSkills, inputId: 'profilo-skills' })}
        </div>

        <div class="flex items-center justify-end pt-2 border-t border-marea-border/60">
          <button type="submit" class="btn-gold py-2.5 px-6">Salva modifiche</button>
        </div>

        <div id="profilo-message" class="hidden text-sm text-center p-3 rounded-xl bg-marea-light text-marea-teal"></div>
      </form>
    </div>
  `

  const picker = initSkillPicker({
    inputId: 'profilo-skills',
    skills: allSkills,
    selectedSkills: currentSkills,
    allowCreate: false,
  })

  const form = document.getElementById('profilo-form')
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
      showAlert('Il nome completo è obbligatorio.')
      unlock()
      return
    }

    try {
      const { error: profileErr } = await supabase.rpc('update_my_profile', {
        _full_name: fullName,
        _company: cleanStr(fd.get('company')),
        _role: cleanStr(fd.get('role')),
        _location: cleanStr(fd.get('location')),
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

      const msg = document.getElementById('profilo-message')
      if (msg) {
        msg.textContent = 'Profilo aggiornato.'
        msg.classList.remove('hidden')
        setTimeout(() => msg.classList.add('hidden'), 3000)
      }
      unlock()
    } catch (err) {
      console.error('Errore nel salvataggio del profilo:', err)
      showAlert('Si è verificato un errore. Riprova.')
      unlock()
    }
  })
}
