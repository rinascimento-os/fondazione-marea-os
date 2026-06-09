import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { renderSkillPicker, initSkillPicker, loadSkills } from '../components/skill-picker.js'
import { renderSearchableSelect, initSearchableSelect } from '../components/searchable-select.js'
import { openCsvImport } from '../components/csv-import.js'
import { initDeleteConfirm, showAlert } from '../utils/confirm-delete.js'
import { escapeAttr, withSubmitLock, renderAvatar } from '../utils/helpers.js'
import { getRole } from '../role.js'
import { renderAvailabilitySelect } from '../utils/availability.js'
import { safeUrl } from '../utils/url.js'
import { signAvatars } from '../utils/avatar.js'
import { createIcons, ChevronLeft, ChevronRight, Search, X } from 'lucide'

let allPionieri = []
let allSkills = []
let currentPioniere = null
let filters = { search: '', skillIds: [], residenza: '', origine: '' }

function isAdminView() {
  return getRole()?.viewMode === 'admin'
}

function computeMatchScore(p, anchor) {
  if (!anchor || !p || p.id === anchor.id) return 0
  const anchorSkillIds = new Set((anchor.pioniere_skills || []).map(ps => ps.skill_id))
  const overlap = (p.pioniere_skills || []).filter(ps => anchorSkillIds.has(ps.skill_id)).length
  let score = overlap * 3
  if (p.location && anchor.location && p.location.trim().toLowerCase() === anchor.location.trim().toLowerCase()) score += 4
  if (p.origin && anchor.origin && p.origin.trim().toLowerCase() === anchor.origin.trim().toLowerCase()) score += 1
  return score
}

function hasMeaningfulMatch(p, anchor) {
  if (!anchor || !p || p.id === anchor.id) return false
  const anchorSkillIds = new Set((anchor.pioniere_skills || []).map(ps => ps.skill_id))
  const hasSharedSkill = (p.pioniere_skills || []).some(ps => anchorSkillIds.has(ps.skill_id))
  const hasSameResidence = Boolean(
    p.location && anchor.location && p.location.trim().toLowerCase() === anchor.location.trim().toLowerCase()
  )
  return hasSharedSkill || hasSameResidence
}

function hasOriginOnlyMatch(p, anchor) {
  if (!anchor || !p || p.id === anchor.id || hasMeaningfulMatch(p, anchor)) return false
  return Boolean(
    p.origin && anchor.origin && p.origin.trim().toLowerCase() === anchor.origin.trim().toLowerCase()
  )
}

function matchExplanation(p, anchor) {
  const parts = []
  const anchorSkillIds = new Set((anchor?.pioniere_skills || []).map(ps => ps.skill_id))
  const overlap = (p.pioniere_skills || []).filter(ps => anchorSkillIds.has(ps.skill_id)).length
  if (overlap > 0) parts.push(`${overlap} ${overlap === 1 ? 'competenza' : 'competenze'} in comune`)
  if (p.location && anchor?.location && p.location.trim().toLowerCase() === anchor.location.trim().toLowerCase()) parts.push('stessa residenza')
  if (p.origin && anchor?.origin && p.origin.trim().toLowerCase() === anchor.origin.trim().toLowerCase()) parts.push('stessa origine')
  return parts.join(' · ')
}

function applyFilters(list) {
  const tokens = filters.search.toLowerCase().split(/\s+/).filter(Boolean)
  return list.filter(p => {
    if (tokens.length > 0) {
      const haystack = [
        p.full_name,
        p.company,
        p.location,
        isAdminView() ? p.email : null,
        ...(p.pioniere_skills?.map(ps => ps.skill?.name) || []),
      ].filter(Boolean).join(' ').toLowerCase()
      if (!tokens.every(t => haystack.includes(t))) return false
    }
    if (filters.skillIds.length > 0) {
      const ps = new Set((p.pioniere_skills || []).map(s => s.skill_id))
      if (!filters.skillIds.every(id => ps.has(id))) return false
    }
    if (filters.residenza && p.location !== filters.residenza) return false
    if (filters.origine && p.origin !== filters.origine) return false
    return true
  })
}

function uniqueValues(field) {
  const set = new Set()
  allPionieri.forEach(p => {
    const v = p[field]?.trim()
    if (v) set.add(v)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'))
}

// Best-effort: ask the server to create an auth.users row for this pioniere
// so they can sign in via magic link. Idempotent and non-fatal — if it fails,
// the admin can still save the pioniere row; only login is blocked.
async function provisionAuthForPioniere(email) {
  if (!email) return
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    await fetch('/.netlify/functions/provision-pioniere-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    })
  } catch (err) {
    console.warn('Auth provisioning failed (non-fatal):', err)
  }
}

export function renderPionieri() {
  const adminControls = isAdminView() ? `
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
  ` : ''
  const countLoader = '<svg class="w-3 h-3 inline animate-spin text-marea-navy/40" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>'
  const matchSectionInitialClass = isAdminView() ? 'hidden mb-12' : 'mb-12'
  const matchSkeleton = Array.from({ length: 3 }).map(() => `
    <div class="shrink-0 w-[20rem] sm:w-[22rem] snap-start">
      <div class="h-[14.75rem] rounded-lg border border-marea-border bg-white p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 flex-shrink-0 rounded-xl bg-marea-light"></div>
          <div class="min-w-0 flex-1 space-y-2 pt-1">
            <div class="h-4 w-36 rounded bg-marea-warm-gray"></div>
            <div class="h-3 w-28 rounded bg-marea-warm-gray"></div>
          </div>
        </div>
        <div class="ml-14 mt-4 space-y-2">
          <div class="h-3 w-20 rounded bg-marea-warm-gray"></div>
          <div class="flex gap-1.5">
            <div class="h-6 w-28 rounded-full bg-marea-light"></div>
            <div class="h-6 w-24 rounded-full bg-marea-light"></div>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <div class="h-7 w-7 rounded-lg bg-marea-warm-gray"></div>
        </div>
      </div>
    </div>
  `).join('')

  return `
    <div>
      ${adminControls ? `<div class="flex justify-end mb-6">${adminControls}</div>` : ''}

      <div id="pionieri-match-section" class="${matchSectionInitialClass}">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <h2 class="font-heading text-xl text-marea-black">Affini a te</h2>
            <span id="pionieri-match-count" class="text-xs font-semibold text-marea-navy bg-marea-navy/10 px-2.5 py-1 rounded-full whitespace-nowrap">${isAdminView() ? '' : countLoader}</span>
          </div>
          <div id="pionieri-match-controls" class="hidden items-center gap-1">
            <button type="button" id="pionieri-match-prev" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-marea-border bg-white text-marea-navy shadow-sm transition hover:border-marea-teal/40 hover:text-marea-teal disabled:pointer-events-none disabled:opacity-35" aria-label="Pionieri precedenti">
              <i data-lucide="chevron-left" class="h-4 w-4"></i>
            </button>
            <button type="button" id="pionieri-match-next" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-marea-border bg-white text-marea-navy shadow-sm transition hover:border-marea-teal/40 hover:text-marea-teal disabled:pointer-events-none disabled:opacity-35" aria-label="Pionieri successivi">
              <i data-lucide="chevron-right" class="h-4 w-4"></i>
            </button>
          </div>
        </div>
        <div class="relative pt-2">
          <div id="pionieri-match-list" class="scrollbar-hidden flex items-stretch gap-3 overflow-x-auto scroll-smooth pb-1 pt-2 snap-x">${isAdminView() ? '' : matchSkeleton}</div>
          <div id="pionieri-match-fade" class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-marea-cream to-transparent"></div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-3 mb-3 flex-wrap">
          <h2 class="font-heading text-xl text-marea-black">Tutti i Pionieri (A-Z)</h2>
          <span id="pionieri-count" class="text-xs font-semibold text-marea-navy bg-marea-navy/10 px-2.5 py-1 rounded-full whitespace-nowrap">${countLoader}</span>
        </div>
        <div id="pionieri-filters" class="mb-4">
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative shrink-0">
              <input type="text" id="pionieri-search" placeholder="Cerca..."
                     class="w-40 pl-8 pr-3 py-2 rounded-lg border border-marea-border bg-white text-sm focus-ring" />
              <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-marea-gray pointer-events-none"></i>
            </div>
            <div class="shrink-0 w-40">${renderSearchableSelect({ id: 'filter-skill', placeholder: 'Competenza' })}</div>
            <div class="shrink-0 w-40">${renderSearchableSelect({ id: 'filter-residenza', placeholder: 'Residenza' })}</div>
            <div class="shrink-0 w-40">${renderSearchableSelect({ id: 'filter-origine', placeholder: 'Origine' })}</div>
          </div>
          <div id="filter-skill-tags" class="flex flex-wrap gap-1.5 mt-2"></div>
        </div>

        <div id="pionieri-list" class="columns-1 lg:columns-2 gap-4 space-y-4">
          <p class="text-sm text-marea-gray col-span-full">Caricamento...</p>
        </div>
      </div>
    </div>
  `
}

export async function initPionieri() {
  filters = { search: '', skillIds: [], residenza: '', origine: '' }
  createIcons({ icons: { ChevronLeft, ChevronRight, Search, X } })

  try {
    allSkills = await loadSkills()
  } catch {
    allSkills = []
  }

  await loadPionieri({ render: false })

  // Resolve the logged-in pioniere's row (anchor for match scoring).
  const role = getRole()
  currentPioniere = role?.pioniereId
    ? allPionieri.find(p => p.id === role.pioniereId) || null
    : null

  initSearchableFilters()
  renderLists()

  if (isAdminView()) {
    document.getElementById('add-pioniere-btn')?.addEventListener('click', () => openPioniereForm())
    document.getElementById('import-csv-btn')?.addEventListener('click', () => {
      openCsvImport({
        skills: allSkills,
        existingPionieri: allPionieri,
        onComplete: () => loadPionieri(),
      })
    })
  }

  document.getElementById('pionieri-search')?.addEventListener('input', (e) => {
    filters.search = e.target.value
    renderLists()
  })
  if (isAdminView() && window.location.hash.includes('new=1')) {
    openPioniereForm()
  }
}

function initSearchableFilters() {
  // Skill filter: each pick is added as a chip; the combobox clears so the
  // user can keep picking. Selected skills hide from the option list.
  const usedSkillIds = new Set(allPionieri.flatMap(p => (p.pioniere_skills || []).map(ps => ps.skill_id)))
  const skillOptions = allSkills
    .filter(s => usedSkillIds.has(s.id))
    .filter(s => !filters.skillIds.includes(s.id))
    .map(s => ({ id: s.id, label: s.name, sublabel: s.category }))
    .sort((a, b) => a.label.localeCompare(b.label, 'it'))

  const skillCtrl = initSearchableSelect({
    id: 'filter-skill',
    options: skillOptions,
    onSelect: (opt) => {
      if (!filters.skillIds.includes(opt.id)) filters.skillIds.push(opt.id)
      skillCtrl.clear()
      // Refresh options to drop the now-selected skill
      const remaining = allSkills
        .filter(s => usedSkillIds.has(s.id))
        .filter(s => !filters.skillIds.includes(s.id))
        .map(s => ({ id: s.id, label: s.name, sublabel: s.category }))
        .sort((a, b) => a.label.localeCompare(b.label, 'it'))
      skillCtrl.setOptions(remaining)
      renderSkillFilterTags()
      updateFilterChrome()
      renderLists()
    },
  })

  const residenzaOptions = uniqueValues('location').map(v => ({ id: v, label: v }))
  initSearchableSelect({
    id: 'filter-residenza',
    options: residenzaOptions,
    onSelect: (opt) => {
      filters.residenza = opt.id
      updateFilterChrome()
      renderLists()
    },
    onClear: () => {
      filters.residenza = ''
      updateFilterChrome()
      renderLists()
    },
  })

  const origineOptions = uniqueValues('origin').map(v => ({ id: v, label: v }))
  initSearchableSelect({
    id: 'filter-origine',
    options: origineOptions,
    onSelect: (opt) => {
      filters.origine = opt.id
      updateFilterChrome()
      renderLists()
    },
    onClear: () => {
      filters.origine = ''
      updateFilterChrome()
      renderLists()
    },
  })
}

function updateFilterChrome() {
  // No-op now that filters are inline; kept for the call-site signature.
}

function renderSkillFilterTags() {
  const container = document.getElementById('filter-skill-tags')
  if (!container) return
  container.innerHTML = filters.skillIds.map(id => {
    const skill = allSkills.find(s => s.id === id)
    if (!skill) return ''
    return `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-marea-teal-light text-marea-teal">
        ${escapeHtml(skill.name)}
        <button type="button" class="hover:text-red-500 inline-flex" data-remove-skill-filter="${escapeAttr(id)}" aria-label="Rimuovi">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </span>
    `
  }).join('')
  createIcons({ icons: { X } })
  container.querySelectorAll('[data-remove-skill-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.removeSkillFilter
      filters.skillIds = filters.skillIds.filter(x => x !== id)
      renderSkillFilterTags()
      renderLists()
    })
  })
}

async function loadPionieri({ render = true } = {}) {
  // Admins query the base table (includes email). Pionieri can't read the
  // base table — they go through pionieri_public (no email column).
  const table = isAdminView() ? 'pionieri' : 'pionieri_public'
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*, pioniere_skills(skill_id, proficiency, skill:skills(id, name, category))')
      .order('full_name')

    if (error) throw error
    allPionieri = data || []
    await signAvatars(allPionieri)
  } catch (err) {
    console.error('Errore nel caricamento Pionieri:', err)
    allPionieri = []
  }
  if (render) renderLists()
}

function renderCard(p, { matchHint } = {}) {
  return `
    <div class="bg-white rounded-2xl border border-marea-border/60 p-6 card-hover cursor-pointer pioniere-card break-inside-avoid" data-id="${escapeAttr(p.id)}">
      <div class="flex items-start gap-4">
        ${renderAvatar(p, { sizeClass: 'w-11 h-11', rounded: 'rounded-xl', textClass: 'text-sm' })}
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-marea-black text-base">${escapeHtml(p.full_name)}</h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-marea-gray">
            ${p.company ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>${escapeHtml(p.company)}</span>` : ''}
            ${p.location ? `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>${escapeHtml(p.location)}</span>` : ''}
          </div>
          ${matchHint ? `<p class="text-xs text-marea-teal font-medium mt-2">${escapeHtml(matchHint)}</p>` : ''}
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
  `
}

function renderMatchCard(p, anchor) {
  const skills = p.pioniere_skills || []
  const anchorSkillIds = new Set((anchor?.pioniere_skills || []).map(ps => ps.skill_id))
  const sharedSkills = skills.filter(ps => anchorSkillIds.has(ps.skill_id))
  const sameResidence = Boolean(
    p.location && anchor?.location && p.location.trim().toLowerCase() === anchor.location.trim().toLowerCase()
  )
  const sameOrigin = Boolean(
    p.origin && anchor?.origin && p.origin.trim().toLowerCase() === anchor.origin.trim().toLowerCase()
  )
  const commonChips = [
    ...sharedSkills
      .map(ps => ps.skill?.name)
      .filter(Boolean)
      .map(value => ({ value, type: 'skill' })),
    sameResidence ? { label: 'Residenza', value: p.location, type: 'place' } : null,
    sameOrigin ? { label: 'Origine', value: p.origin, type: 'place' } : null,
  ].filter(Boolean)
  const visibleChips = commonChips.slice(0, 3)
  const hiddenChipCount = Math.max(0, commonChips.length - visibleChips.length)
  const openProfileIcon = `
    <span class="absolute bottom-4 right-4 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-marea-border bg-white text-marea-gray transition group-hover:border-marea-teal/30 group-hover:text-marea-teal" aria-hidden="true">
      <i data-lucide="chevron-right" class="h-3.5 w-3.5"></i>
    </span>
  `

  return `
    <div class="group relative flex h-[14.75rem] cursor-pointer flex-col overflow-hidden rounded-lg border border-marea-border bg-white p-4 pb-14 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md pioniere-card" data-id="${escapeAttr(p.id)}">
      <div class="flex items-start gap-3">
        ${renderAvatar(p, { sizeClass: 'h-11 w-11', rounded: 'rounded-xl', textClass: 'text-sm', extraClass: 'ring-1 ring-marea-teal/10' })}
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-base font-semibold leading-snug text-marea-black">${escapeHtml(p.full_name)}</p>
          ${p.company ? `
            <p class="mt-1 truncate text-sm leading-snug text-marea-gray">${escapeHtml(p.company)}</p>
          ` : ''}
        </div>
      </div>

      <div class="ml-14 mt-4 pr-2">
        <p class="text-[0.68rem] font-semibold uppercase tracking-wide text-marea-gray/75">In comune</p>
        <div class="mt-2 flex flex-wrap gap-1.5 overflow-hidden">
          ${visibleChips.map(chip => `
            <span class="inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-snug ${chip.type === 'skill' ? 'bg-marea-teal-light text-marea-teal' : 'bg-marea-dark/10 text-marea-dark'}">
              ${chip.label ? `<span>${escapeHtml(chip.label)}:</span>` : ''}
              <span class="truncate">${escapeHtml(chip.value)}</span>
            </span>
          `).join('')}
          ${hiddenChipCount > 0 ? `
            <span class="inline-flex items-center rounded-full bg-marea-dark/10 px-2.5 py-1 text-xs font-semibold leading-snug text-marea-dark">
              +${hiddenChipCount}
            </span>
          ` : ''}
        </div>
      </div>

      ${openProfileIcon}
    </div>
  `
}

function initMatchCarouselControls(matchCount) {
  const matchList = document.getElementById('pionieri-match-list')
  const controls = document.getElementById('pionieri-match-controls')
  const countEl = document.getElementById('pionieri-match-count')
  const fadeEl = document.getElementById('pionieri-match-fade')
  const prevBtn = document.getElementById('pionieri-match-prev')
  const nextBtn = document.getElementById('pionieri-match-next')
  if (!matchList || !controls || !countEl || !prevBtn || !nextBtn) return

  countEl.textContent = `${matchCount} suggeriti`
  controls.classList.toggle('hidden', matchCount < 2)
  controls.classList.toggle('flex', matchCount >= 2)

  const updateButtons = () => {
    const maxScroll = matchList.scrollWidth - matchList.clientWidth
    const hasOverflow = maxScroll > 4
    const hasMoreRight = hasOverflow && matchList.scrollLeft < maxScroll - 4
    prevBtn.disabled = !hasOverflow || matchList.scrollLeft <= 4
    nextBtn.disabled = !hasMoreRight
    fadeEl?.classList.toggle('hidden', !hasMoreRight)
  }

  const scrollByCard = (direction) => {
    const firstCard = matchList.querySelector('[data-carousel-card]')
    const gap = 12
    const distance = (firstCard?.getBoundingClientRect().width || 344) + gap
    matchList.scrollBy({ left: direction * distance, behavior: 'smooth' })
    window.setTimeout(updateButtons, 240)
  }

  prevBtn.onclick = () => scrollByCard(-1)
  nextBtn.onclick = () => scrollByCard(1)
  matchList.onscroll = updateButtons
  createIcons({ icons: { ChevronLeft, ChevronRight } })
  window.requestAnimationFrame(updateButtons)
}

function attachCardClicks(containerEl) {
  containerEl.querySelectorAll('.pioniere-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = allPionieri.find(p => p.id === card.dataset.id)
      if (p) openPioniereDetail(p)
    })
  })
}

function renderLists() {
  const countEl = document.getElementById('pionieri-count')
  if (countEl) countEl.textContent = `${allPionieri.length} Pionieri`

  // ── Match section (pioniere view only) — fixed top 6, NOT affected by filters ──
  const matchSection = document.getElementById('pionieri-match-section')
  const matchList = document.getElementById('pionieri-match-list')
  if (matchSection && matchList) {
    if (!isAdminView() && currentPioniere) {
      const MAX_MATCHES = 12
      const MIN_MATCH_SCORE = 3
      const scoredMatches = allPionieri
        .filter(p => p.id !== currentPioniere.id)
        .map(p => ({ p, score: computeMatchScore(p, currentPioniere) }))

      const strongMatches = scoredMatches
        .filter(({ p, score }) => score >= MIN_MATCH_SCORE && hasMeaningfulMatch(p, currentPioniere))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_MATCHES)
      const fallbackMatches = scoredMatches
        .filter(({ p }) => hasOriginOnlyMatch(p, currentPioniere))
        .sort((a, b) => (a.p.full_name || '').localeCompare(b.p.full_name || '', 'it'))
        .slice(0, Math.min(6, MAX_MATCHES))
      const matches = strongMatches.length > 0 ? strongMatches : fallbackMatches
      if (matches.length > 0) {
        matchSection.classList.remove('hidden')
        matchList.innerHTML = matches.map(({ p }) =>
          `<div data-carousel-card class="shrink-0 w-[20rem] sm:w-[22rem] snap-start">${renderMatchCard(p, currentPioniere)}</div>`
        ).join('')
        attachCardClicks(matchList)
        initMatchCarouselControls(matches.length)
      } else {
        matchSection.classList.add('hidden')
      }
    } else {
      matchSection.classList.add('hidden')
    }
  }

  // ── A-Z section (everyone visible to this user, filtered) ──
  const filtered = applyFilters(allPionieri)
  const container = document.getElementById('pionieri-list')
  if (!container) return

  if (filtered.length === 0) {
    const anyFilter = filters.search || filters.skillIds.length || filters.residenza || filters.origine
    container.innerHTML = `
      <div class="text-center py-16" style="column-span: all">
        <svg class="w-12 h-12 text-marea-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-marea-gray mb-2">${anyFilter ? 'Nessun risultato trovato.' : 'Nessun Pioniere ancora registrato.'}</p>
        ${!anyFilter && isAdminView() ? '<p class="text-sm text-marea-gray/60">Clicca "Aggiungi Pioniere" per iniziare.</p>' : ''}
      </div>
    `
    return
  }

  const sorted = [...filtered].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'it'))
  container.innerHTML = sorted.map(p => renderCard(p)).join('')
  attachCardClicks(container)
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
        ${renderAvatar(pioniere, { sizeClass: 'w-16 h-16', rounded: 'rounded-2xl', textClass: 'text-xl' })}
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold text-marea-black">${escapeHtml(pioniere.full_name)}</h3>
          ${pioniere.role || pioniere.company ? `<p class="text-sm text-marea-gray mt-0.5">${[pioniere.role, pioniere.company].filter(Boolean).map(v => escapeHtml(v)).join(' · ')}</p>` : ''}
          ${pioniere.gender ? `<p class="text-xs text-marea-gray mt-1.5">Genere: ${escapeHtml(pioniere.gender)}</p>` : ''}
        </div>
      </div>

      <!-- Info -->
      <div class="bg-marea-cream/50 rounded-xl p-4 space-y-3">
        ${isAdminView() ? `
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
        ` : ''}
        ${(() => {
          const href = safeUrl(pioniere.linkedin_url)
          if (!href) return ''
          return `
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-marea-gray" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-marea-gray">LinkedIn</p>
            <a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-marea-teal hover:underline truncate block">${escapeHtml(href)}</a>
          </div>
        </div>
          `
        })()}
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
        ${iconField(
          '<svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
          'Disponibilit&agrave;', pioniere.availability
        )}
        ${pioniere.bio ? `
        <div class="flex items-start gap-3 pt-1">
          <span class="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-4 h-4 text-marea-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </span>
          <div>
            <p class="text-xs text-marea-gray">Bio</p>
            <p class="text-sm font-medium text-marea-black whitespace-pre-wrap">${escapeHtml(pioniere.bio)}</p>
          </div>
        </div>
        ` : ''}
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

    ${isAdminView() ? `
    <div class="flex items-center justify-between pt-4 pb-1 mt-6 border-t border-marea-border/60 sticky bottom-0 bg-white">
      <button type="button" id="delete-pioniere-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina pioniere</button>
      <button type="button" id="edit-pioniere-btn" class="btn-gold py-2.5 px-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        Modifica
      </button>
    </div>
    ` : ''}
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
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Disponibilit&agrave;</label>
          ${renderAvailabilitySelect({
            name: 'availability',
            value: pioniere?.availability,
            selectClass: 'w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all bg-white',
          })}
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">LinkedIn</label>
        <input type="url" name="linkedin_url" value="${escapeAttr(pioniere?.linkedin_url)}" placeholder="https://www.linkedin.com/in/..."
               class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Bio</label>
        <textarea name="bio" rows="3" placeholder="Breve biografia..."
                  class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-y">${escapeHtml(pioniere?.bio || '')}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Competenze</label>
        ${renderSkillPicker({ selectedSkills: currentSkills, inputId: 'pioniere-skills' })}
      </div>
    </form>
    <div class="flex items-center ${isEdit ? 'justify-between' : 'justify-end'} pt-4 pb-1 mt-6 border-t border-marea-border/60 sticky bottom-0 bg-white">
      ${isEdit ? `<button type="button" id="delete-pioniere-btn" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Elimina pioniere</button>` : ''}
      <button type="submit" form="pioniere-form" class="btn-gold py-2.5 px-6">
        ${isEdit ? 'Salva modifiche' : 'Salva'}
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
    const emailRaw = (fd.get('email') || '').toString().trim().toLowerCase()
    const record = {
      full_name: fd.get('full_name'),
      email: emailRaw || null,
      company: fd.get('company') || null,
      role: fd.get('role') || null,
      origin: fd.get('origin') || null,
      location: fd.get('location') || null,
      gender: fd.get('gender') || null,
      availability: fd.get('availability') || null,
      linkedin_url: (fd.get('linkedin_url') || '').toString().trim() || null,
      bio: (fd.get('bio') || '').toString().trim() || null,
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

      // Auto-provision a Supabase auth user so the pioniere can sign in via
      // magic link. Idempotent; safe to call on every save.
      if (record.email) {
        provisionAuthForPioniere(record.email)
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
