import { supabase } from '../supabase.js'

export async function loadSkills() {
  const { data, error } = await supabase.from('skills').select('*').order('category').order('name')
  if (error) throw error
  return data || []
}

export function renderSkillPicker({ selectedSkills = [], inputId = 'skill-picker' }) {
  return `
    <div id="${inputId}-container" class="space-y-2">
      <div id="${inputId}-tags" class="flex flex-wrap gap-2">
        ${selectedSkills.map(s => `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-marea-teal-light text-marea-teal" data-skill-id="${s.id}">
            ${s.name}
            <button type="button" class="skill-remove hover:text-red-500" data-remove-skill="${s.id}">&times;</button>
          </span>
        `).join('')}
      </div>
      <div class="relative">
        <input type="text" id="${inputId}-input"
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all"
               placeholder="Cerca o aggiungi competenza..." autocomplete="off" />
        <div id="${inputId}-dropdown" class="absolute left-0 right-0 top-full mt-1 bg-white border border-marea-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 hidden"></div>
      </div>
      <input type="hidden" id="${inputId}-values" value='${JSON.stringify(selectedSkills.map(s => s.id))}' />
    </div>
  `
}

export function initSkillPicker({ inputId = 'skill-picker', skills = [], selectedSkills = [], onAdd, onRemove }) {
  const input = document.getElementById(`${inputId}-input`)
  const dropdown = document.getElementById(`${inputId}-dropdown`)
  const tagsContainer = document.getElementById(`${inputId}-tags`)
  if (!input || !dropdown) return

  let selected = [...selectedSkills]

  function updateDropdown(filter = '') {
    const available = skills.filter(s =>
      !selected.find(sel => sel.id === s.id) &&
      s.name.toLowerCase().includes(filter.toLowerCase())
    )

    if (available.length === 0 && filter.trim()) {
      dropdown.innerHTML = `
        <button type="button" class="w-full text-left px-3 py-2 text-sm text-marea-teal hover:bg-marea-light skill-create">
          + Crea "${filter.trim()}"
        </button>
      `
      dropdown.classList.remove('hidden')
      dropdown.querySelector('.skill-create').addEventListener('click', async () => {
        const { data, error } = await supabase.from('skills').insert({ name: filter.trim(), category: 'Altro' }).select().single()
        if (!error && data) {
          skills.push(data)
          addSkill(data)
          input.value = ''
          dropdown.classList.add('hidden')
        }
      })
    } else if (available.length === 0) {
      dropdown.classList.add('hidden')
    } else {
      dropdown.innerHTML = available.map(s => `
        <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-marea-light skill-option" data-skill-id="${s.id}">
          <span class="font-medium">${s.name}</span>
          ${s.category ? `<span class="text-marea-gray ml-1">· ${s.category}</span>` : ''}
        </button>
      `).join('')
      dropdown.classList.remove('hidden')

      dropdown.querySelectorAll('.skill-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const skill = skills.find(s => s.id === btn.dataset.skillId)
          if (skill) {
            addSkill(skill)
            input.value = ''
            dropdown.classList.add('hidden')
          }
        })
      })
    }
  }

  function addSkill(skill) {
    selected.push(skill)
    renderTags()
    if (onAdd) onAdd(skill)
  }

  function removeSkill(skillId) {
    selected = selected.filter(s => s.id !== skillId)
    renderTags()
    if (onRemove) onRemove(skillId)
  }

  function renderTags() {
    tagsContainer.innerHTML = selected.map(s => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-marea-teal-light text-marea-teal" data-skill-id="${s.id}">
        ${s.name}
        <button type="button" class="skill-remove hover:text-red-500" data-remove-skill="${s.id}">&times;</button>
      </span>
    `).join('')

    tagsContainer.querySelectorAll('.skill-remove').forEach(btn => {
      btn.addEventListener('click', () => removeSkill(btn.dataset.removeSkill))
    })

    const hiddenInput = document.getElementById(`${inputId}-values`)
    if (hiddenInput) hiddenInput.value = JSON.stringify(selected.map(s => s.id))
  }

  input.addEventListener('input', () => updateDropdown(input.value))
  input.addEventListener('focus', () => updateDropdown(input.value))
  document.addEventListener('click', (e) => {
    if (!e.target.closest(`#${inputId}-container`)) {
      dropdown.classList.add('hidden')
    }
  })

  // Init remove buttons on existing tags
  tagsContainer.querySelectorAll('.skill-remove').forEach(btn => {
    btn.addEventListener('click', () => removeSkill(btn.dataset.removeSkill))
  })

  return { getSelected: () => selected }
}
