import { supabase } from '../supabase.js'
import { escapeHtml } from '../utils/escape.js'
import { renderModal, showModal, closeModal } from '../components/modal.js'
import { renderSearchableSelect, initSearchableSelect } from '../components/searchable-select.js'
import { showAlert, showConfirm } from '../utils/confirm-delete.js'
import { escapeAttr, withSubmitLock } from '../utils/helpers.js'

let allEntries = []
let allMatches = []
let allPionieri = []
let allProjects = []
let filterDateFrom = null
let filterDateTo = null
let filterSearch = ''
let sortColumn = 'date'
let sortDirection = 'desc'
let currentPage = 1
let pageSize = 20
let outsideClickHandler = null

// Numeric/date sort icons
const SORT_ICON_NEUTRAL = `<svg class="w-3 h-3 opacity-40" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>`
const SORT_ICON_ASC = `<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>`
const SORT_ICON_DESC = `<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>`

// Alphabetical sort icons (A-Z / Z-A)
const SORT_ICON_ALPHA_NEUTRAL = `<span class="text-[10px] font-bold leading-none tracking-tight opacity-40">AZ</span>`
const SORT_ICON_ALPHA_ASC = `<span class="text-[10px] font-bold leading-none tracking-tight">A\u2193Z</span>`
const SORT_ICON_ALPHA_DESC = `<span class="text-[10px] font-bold leading-none tracking-tight">Z\u2193A</span>`

const TEXT_COLUMNS = new Set(['pioniere', 'project'])

function sortHeaderTh(col, label) {
  const icon = TEXT_COLUMNS.has(col) ? SORT_ICON_ALPHA_NEUTRAL : SORT_ICON_NEUTRAL
  return `<th class="text-left px-5 py-4 font-medium text-marea-gray text-xs uppercase tracking-wider sort-header hover:text-marea-black transition-colors" data-sort="${col}">
    <span class="inline-flex items-center gap-1">
      ${label}
      <span class="sort-indicator" data-col="${col}">${icon}</span>
    </span>
  </th>`
}

export function renderTimebank() {
  return `
    <div>
      <!-- Summary stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6">
          <div class="flex items-center justify-between mb-2">
            <p id="tb-total-hours-label" class="text-sm font-medium text-marea-gray">Ore totali</p>
            <span class="w-9 h-9 rounded-xl bg-marea-teal-light flex items-center justify-center">
              <svg class="w-4 h-4 text-marea-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
          </div>
          <p id="tb-total-hours" class="text-3xl font-bold text-marea-black">—</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6">
          <div class="flex items-center justify-between mb-2">
            <p id="tb-active-pionieri-label" class="text-sm font-medium text-marea-gray">Pionieri attivi</p>
            <span class="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
          </div>
          <p id="tb-active-pionieri" class="text-3xl font-bold text-marea-black">—</p>
        </div>
        <div class="stat-card bg-white rounded-2xl border border-marea-border/60 p-6">
          <div class="flex items-center justify-between mb-2">
            <p id="tb-projects-served-label" class="text-sm font-medium text-marea-gray">Progetti serviti</p>
            <span class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </span>
          </div>
          <p id="tb-projects-served" class="text-3xl font-bold text-marea-black">—</p>
        </div>
      </div>

      <!-- Filters: search + date + action -->
      <div class="flex flex-wrap items-center gap-2 mb-8">
        <div class="relative flex-1 min-w-[200px] max-w-sm">
          <input type="text" id="tb-search" placeholder="Cerca per nome, progetto, descrizione..."
                 class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm focus-ring transition-all" />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marea-gray pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div class="relative" id="tb-date-range-wrap">
          <button id="tb-date-range-btn" type="button"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marea-border bg-white text-sm text-marea-gray hover:border-marea-teal/40 focus-ring transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span id="tb-date-range-label">Periodo</span>
          </button>
          <div id="tb-date-range-dropdown" class="hidden absolute top-full left-0 mt-2 bg-white rounded-xl border border-marea-border shadow-lg p-4 z-30 space-y-3 min-w-[240px]">
            <div>
              <label for="tb-date-from" class="block text-xs font-medium text-marea-gray uppercase tracking-wide mb-1">Da</label>
              <input type="date" id="tb-date-from"
                     class="w-full px-3 py-2 rounded-xl border border-marea-border bg-white text-sm text-marea-black focus-ring transition-all" />
            </div>
            <div>
              <label for="tb-date-to" class="block text-xs font-medium text-marea-gray uppercase tracking-wide mb-1">A</label>
              <input type="date" id="tb-date-to"
                     class="w-full px-3 py-2 rounded-xl border border-marea-border bg-white text-sm text-marea-black focus-ring transition-all" />
            </div>
          </div>
        </div>
        <button id="tb-clear-filters" class="text-xs text-marea-teal hover:text-marea-dark font-medium transition-colors hidden">
          Cancella filtri
        </button>
        <div class="ml-auto">
          <button id="log-hours-btn" class="btn-gold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Registra ore
          </button>
        </div>
      </div>

      <!-- Desktop Ledger -->
      <div class="hidden sm:block bg-white rounded-2xl border border-marea-border/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-marea-border/60">
                ${sortHeaderTh('date', 'Data')}
                ${sortHeaderTh('pioniere', 'Pioniere')}
                ${sortHeaderTh('project', 'Progetto')}
                ${sortHeaderTh('hours', 'Ore')}
                <th class="text-left px-5 py-4 font-medium text-marea-gray text-xs uppercase tracking-wider">Descrizione</th>
                <th class="text-left px-5 py-4 font-medium text-marea-gray text-xs uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody id="tb-entries">
              <tr><td colspan="6" class="px-5 py-12 text-center text-marea-gray text-sm">Caricamento...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div id="tb-mobile-cards" class="sm:hidden space-y-3">
        <p class="px-1 py-12 text-center text-marea-gray text-sm">Caricamento...</p>
      </div>

      <!-- Pagination -->
      <div id="tb-pagination" class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
        <div class="flex items-center gap-2 text-sm text-marea-gray">
          <span id="tb-page-info"></span>
          <select id="tb-page-size" class="px-2 py-1.5 rounded-lg border border-marea-border bg-white text-xs focus-ring">
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
          </select>
          <span class="text-xs">per pagina</span>
        </div>
        <div id="tb-page-buttons" class="flex items-center gap-1"></div>
      </div>
    </div>
  `
}

export async function initTimebank() {
  // Reset state on navigation
  allEntries = []
  allMatches = []
  allPionieri = []
  allProjects = []
  filterDateFrom = null
  filterDateTo = null
  filterSearch = ''
  sortColumn = 'date'
  sortDirection = 'desc'
  currentPage = 1
  pageSize = 20

  // Clean up previous outside-click handler
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler)
    outsideClickHandler = null
  }

  await Promise.all([loadEntries(), loadFormData()])

  document.getElementById('log-hours-btn')?.addEventListener('click', () => openLogHoursForm())

  // Text search
  document.getElementById('tb-search')?.addEventListener('input', (e) => {
    filterSearch = e.target.value
    currentPage = 1
    renderEntries()
  })

  // Date range dropdown
  const dateBtn = document.getElementById('tb-date-range-btn')
  const dateDropdown = document.getElementById('tb-date-range-dropdown')
  const dateWrap = document.getElementById('tb-date-range-wrap')

  dateBtn?.addEventListener('click', () => {
    dateDropdown?.classList.toggle('hidden')
  })

  // Close on outside click (stored for cleanup)
  outsideClickHandler = (e) => {
    if (dateWrap && !dateWrap.contains(e.target)) {
      dateDropdown?.classList.add('hidden')
    }
  }
  document.addEventListener('click', outsideClickHandler)

  document.getElementById('tb-date-from')?.addEventListener('change', (e) => {
    filterDateFrom = e.target.value || null
    currentPage = 1
    updateDateRangeLabel()
    renderEntries()
  })

  document.getElementById('tb-date-to')?.addEventListener('change', (e) => {
    filterDateTo = e.target.value || null
    currentPage = 1
    updateDateRangeLabel()
    renderEntries()
  })

  // Clear all filters
  document.getElementById('tb-clear-filters')?.addEventListener('click', () => {
    filterDateFrom = null
    filterDateTo = null
    filterSearch = ''
    currentPage = 1

    const searchEl = document.getElementById('tb-search')
    const dateFromEl = document.getElementById('tb-date-from')
    const dateToEl = document.getElementById('tb-date-to')
    if (searchEl) searchEl.value = ''
    if (dateFromEl) dateFromEl.value = ''
    if (dateToEl) dateToEl.value = ''
    updateDateRangeLabel()
    document.getElementById('tb-date-range-dropdown')?.classList.add('hidden')

    renderEntries()
  })

  // Page size
  document.getElementById('tb-page-size')?.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value, 10)
    currentPage = 1
    renderEntries()
  })

  // Sort headers
  document.querySelectorAll('.sort-header').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort
      if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        sortColumn = col
        sortDirection = col === 'date' ? 'desc' : 'asc'
      }
      currentPage = 1
      renderEntries()
    })
  })

  // Page button delegation
  document.getElementById('tb-page-buttons')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]')
    if (!btn || btn.disabled) return
    currentPage = parseInt(btn.dataset.page, 10)
    renderEntries()
  })
}

async function loadFormData() {
  const [matchesRes, pionieriRes, projectsRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, status, pioniere:pionieri(id, full_name), need:project_needs(id, description, project:projects(id, name))')
      .in('status', ['confirmed', 'active'])
      .order('created_at', { ascending: false }),
    supabase
      .from('pionieri')
      .select('id, full_name, location')
      .order('full_name'),
    supabase
      .from('projects')
      .select('id, name, type, status')
      .order('name'),
  ])

  allMatches = matchesRes.data || []
  allPionieri = pionieriRes.data || []
  allProjects = projectsRes.data || []
}

async function loadEntries() {
  try {
    const { data } = await supabase
      .from('time_entries')
      .select('*, match:matches(id, pioniere:pionieri(id, full_name), need:project_needs(id, project:projects(id, name))), pioniere:pionieri(id, full_name), project:projects(id, name)')
      .order('date', { ascending: false })

    allEntries = data || []
  } catch {
    allEntries = []
  }

  renderEntries()
}

// Helper: get pioniere info from an entry (match-based or direct)
function entryPioniere(e) {
  return e.match?.pioniere || e.pioniere || null
}

function entryProject(e) {
  return e.match?.need?.project || e.project || null
}

function getFilteredEntries() {
  let filtered = allEntries
  if (filterDateFrom) {
    filtered = filtered.filter(e => e.date >= filterDateFrom)
  }
  if (filterDateTo) {
    filtered = filtered.filter(e => e.date <= filterDateTo)
  }
  if (filterSearch.trim()) {
    const q = filterSearch.toLowerCase()
    filtered = filtered.filter(e => {
      const pioniereName = entryPioniere(e)?.full_name?.toLowerCase() || ''
      const projectName = entryProject(e)?.name?.toLowerCase() || ''
      const desc = e.description?.toLowerCase() || ''
      return pioniereName.includes(q) || projectName.includes(q) || desc.includes(q)
    })
  }

  return filtered
}

function sortEntries(entries) {
  const sorted = [...entries]
  sorted.sort((a, b) => {
    let valA, valB
    switch (sortColumn) {
      case 'date':
        valA = a.date || ''
        valB = b.date || ''
        break
      case 'pioniere':
        valA = entryPioniere(a)?.full_name?.toLowerCase() || ''
        valB = entryPioniere(b)?.full_name?.toLowerCase() || ''
        break
      case 'project':
        valA = entryProject(a)?.name?.toLowerCase() || ''
        valB = entryProject(b)?.name?.toLowerCase() || ''
        break
      case 'hours':
        valA = parseFloat(a.hours) || 0
        valB = parseFloat(b.hours) || 0
        break
      default:
        return 0
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

function renderStats(entries) {
  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
  const activePionieri = new Set(entries.map(e => entryPioniere(e)?.id).filter(Boolean)).size
  const projectsServed = new Set(entries.map(e => entryProject(e)?.id).filter(Boolean)).size

  const isFiltered = filterDateFrom || filterDateTo || filterSearch.trim()
  const suffix = isFiltered ? ' (filtrato)' : ''

  const el = (id) => document.getElementById(id)
  if (el('tb-total-hours')) el('tb-total-hours').textContent = totalHours > 0 ? totalHours.toFixed(1) : '0'
  if (el('tb-active-pionieri')) el('tb-active-pionieri').textContent = activePionieri
  if (el('tb-projects-served')) el('tb-projects-served').textContent = projectsServed

  if (el('tb-total-hours-label')) el('tb-total-hours-label').textContent = 'Ore totali' + suffix
  if (el('tb-active-pionieri-label')) el('tb-active-pionieri-label').textContent = 'Pionieri attivi' + suffix
  if (el('tb-projects-served-label')) el('tb-projects-served-label').textContent = 'Progetti serviti' + suffix
}

function updateSortIndicators() {
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    const col = indicator.dataset.col
    const isText = TEXT_COLUMNS.has(col)
    if (col === sortColumn) {
      if (isText) {
        indicator.innerHTML = sortDirection === 'asc' ? SORT_ICON_ALPHA_ASC : SORT_ICON_ALPHA_DESC
      } else {
        indicator.innerHTML = sortDirection === 'asc' ? SORT_ICON_ASC : SORT_ICON_DESC
      }
    } else {
      indicator.innerHTML = isText ? SORT_ICON_ALPHA_NEUTRAL : SORT_ICON_NEUTRAL
    }
  })
}

function renderPagination(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageInfo = document.getElementById('tb-page-info')
  const pageButtons = document.getElementById('tb-page-buttons')
  if (!pageInfo || !pageButtons) return

  if (totalItems > 0) {
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)
    pageInfo.textContent = `Mostra ${start}\u2013${end} di ${totalItems}`
  } else {
    pageInfo.textContent = 'Nessun risultato'
  }

  if (totalPages <= 1) {
    pageButtons.innerHTML = ''
    return
  }

  let buttons = ''

  // Prev
  buttons += `<button data-page="${currentPage - 1}" class="p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-marea-gray/60 cursor-not-allowed' : 'text-marea-gray hover:bg-marea-light'}" ${currentPage === 1 ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
  </button>`

  // Page numbers with window
  const windowSize = 2
  const pages = []
  pages.push(1)

  const rangeStart = Math.max(2, currentPage - windowSize)
  const rangeEnd = Math.min(totalPages - 1, currentPage + windowSize)

  if (rangeStart > 2) pages.push('...')
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < totalPages - 1) pages.push('...')

  if (totalPages > 1) pages.push(totalPages)

  for (const p of pages) {
    if (p === '...') {
      buttons += `<span class="px-2 py-1 text-xs text-marea-gray">\u2026</span>`
    } else {
      const isActive = p === currentPage
      buttons += `<button data-page="${p}" class="min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-marea-teal text-white' : 'text-marea-gray hover:bg-marea-light'}">${p}</button>`
    }
  }

  // Next
  buttons += `<button data-page="${currentPage + 1}" class="p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-marea-gray/60 cursor-not-allowed' : 'text-marea-gray hover:bg-marea-light'}" ${currentPage === totalPages ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>`

  pageButtons.innerHTML = buttons
}

const emptyStateHtml = `
  <svg class="w-10 h-10 text-marea-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  <p class="text-sm text-marea-gray">Nessuna registrazione trovata.</p>
  <p class="text-xs text-marea-gray/60 mt-1">Clicca "Registra ore" per iniziare.</p>
`

function renderEntries() {
  const filtered = getFilteredEntries()
  const sorted = sortEntries(filtered)

  renderStats(filtered)
  updateSortIndicators()

  // Toggle clear-filters button
  const hasFilters = filterDateFrom || filterDateTo || filterSearch.trim()
  document.getElementById('tb-clear-filters')?.classList.toggle('hidden', !hasFilters)

  // Paginate
  const totalItems = sorted.length
  const start = (currentPage - 1) * pageSize
  const paged = sorted.slice(start, start + pageSize)

  // Desktop table
  const tbody = document.getElementById('tb-entries')
  if (tbody) {
    if (paged.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-12 text-center">${emptyStateHtml}</td></tr>`
    } else {
      tbody.innerHTML = paged.map(e => {
        const pioniere = entryPioniere(e)
        const project = entryProject(e)
        return `
        <tr class="border-b border-marea-border/40 last:border-0 table-row-hover transition-colors">
          <td class="px-5 py-4 whitespace-nowrap text-marea-gray">${formatDate(e.date)}</td>
          <td class="px-5 py-4 font-medium text-marea-black">${escapeHtml(pioniere?.full_name) || '\u2014'}</td>
          <td class="px-5 py-4 text-marea-gray">
            ${escapeHtml(project?.name) || '\u2014'}          </td>
          <td class="px-5 py-4">
            <span class="badge bg-marea-teal-light text-marea-teal font-semibold">${escapeAttr(e.hours)}h</span>
          </td>
          <td class="px-5 py-4 text-marea-gray max-w-xs truncate">${escapeHtml(e.description) || '\u2014'}</td>
          <td class="px-5 py-4">
            <div class="flex items-center gap-4">
              <button class="entry-edit text-marea-gray hover:text-marea-teal transition-colors" data-entry-id="${escapeAttr(e.id)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="entry-delete text-marea-gray hover:text-red-500 transition-colors" data-entry-id="${escapeAttr(e.id)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        </tr>`
      }).join('')
    }
  }

  // Mobile cards
  const mobileContainer = document.getElementById('tb-mobile-cards')
  if (mobileContainer) {
    if (paged.length === 0) {
      mobileContainer.innerHTML = `<div class="px-1 py-12 text-center">${emptyStateHtml}</div>`
    } else {
      mobileContainer.innerHTML = paged.map(e => {
        const pioniere = entryPioniere(e)
        const project = entryProject(e)
        return `
        <div class="bg-white rounded-2xl border border-marea-border/60 p-4 card-hover">
          <div class="flex items-start justify-between mb-2">
            <div class="min-w-0 flex-1 mr-3">
              <p class="font-medium text-marea-black truncate">${escapeHtml(pioniere?.full_name) || '\u2014'}</p>
              <p class="text-xs text-marea-gray mt-0.5 truncate">
                ${escapeHtml(project?.name) || '\u2014'}              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="badge bg-marea-teal-light text-marea-teal font-semibold">${escapeAttr(e.hours)}h</span>
              <button class="entry-edit text-marea-gray hover:text-marea-teal transition-colors" data-entry-id="${escapeAttr(e.id)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="entry-delete text-marea-gray hover:text-red-500 transition-colors" data-entry-id="${escapeAttr(e.id)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-marea-gray">${formatDate(e.date)}</span>
            ${e.description ? `<p class="text-xs text-marea-gray/80 truncate max-w-[60%] text-right">${escapeHtml(e.description)}</p>` : ''}
          </div>
        </div>`
      }).join('')
    }
  }

  renderPagination(totalItems)
  wireEntryButtons()
}

function wireEntryButtons() {
  document.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Eliminare questa registrazione?', async () => {
        try {
          await supabase.from('time_entries').delete().eq('id', btn.dataset.entryId)
          await loadEntries()
        } catch (err) {
          console.error('Errore:', err)
          showAlert('Si \u00e8 verificato un errore. Riprova.')
        }
      })
    })
  })

  document.querySelectorAll('.entry-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const entry = allEntries.find(e => e.id === btn.dataset.entryId)
      if (entry) openLogHoursForm(entry)
    })
  })
}

function openLogHoursForm(existingEntry = null) {
  const isEdit = !!existingEntry
  const editPioniere = existingEntry ? entryPioniere(existingEntry) : null
  const editProject = existingEntry ? entryProject(existingEntry) : null

  const pioniereOptions = allPionieri.map(p => ({
    id: p.id,
    label: p.full_name,
    sublabel: p.location || undefined,
  }))

  const projectOptions = allProjects.map(p => ({
    id: p.id,
    label: p.name,
    sublabel: p.type === 'onda_project' ? 'Onda' : 'Fondazione',
  }))

  const content = `
    <form id="log-hours-form" class="space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Pioniere *</label>
          ${renderSearchableSelect({ id: 'lh-pioniere', placeholder: 'Cerca pioniere...' })}
          <p id="lh-err-pioniere" class="hidden text-xs text-red-500 mt-1">Seleziona un pioniere.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Progetto *</label>
          ${renderSearchableSelect({ id: 'lh-project', placeholder: 'Cerca progetto...' })}
          <p id="lh-err-project" class="hidden text-xs text-red-500 mt-1">Seleziona un progetto.</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Ore *</label>
          <input type="number" name="hours" min="0.5" step="0.5" placeholder="es. 2"
                 value="${isEdit ? existingEntry.hours : ''}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
          <p id="lh-err-hours" class="hidden text-xs text-red-500 mt-1">Inserisci le ore.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-marea-black mb-1.5">Data *</label>
          <input type="date" name="date" value="${isEdit ? existingEntry.date : new Date().toLocaleDateString('en-CA')}"
                 class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all" />
          <p id="lh-err-date" class="hidden text-xs text-red-500 mt-1">Inserisci la data.</p>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-marea-black mb-1.5">Descrizione</label>
        <textarea name="description" rows="2" placeholder="Che attivit&agrave; &egrave; stata svolta?"
                  oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                  class="w-full px-4 py-2.5 rounded-xl border border-marea-border text-sm focus-ring transition-all resize-none overflow-hidden">${isEdit ? escapeHtml(existingEntry.description || '') : ''}</textarea>
      </div>
      <div class="flex justify-end gap-3 pt-3 border-t border-marea-border/60">
        <button type="button" class="cancel-modal-btn btn-outline py-2 px-5">Annulla</button>
        <button type="submit" class="btn-gold py-2 px-5">${isEdit ? 'Salva modifiche' : 'Registra ore'}</button>
      </div>
    </form>
  `

  showModal(renderModal({ title: isEdit ? 'Modifica registrazione' : 'Registra ore', content }))

  document.querySelector('#log-hours-form .cancel-modal-btn')?.addEventListener('click', () => closeModal())

  const pioniereCtrl = initSearchableSelect({
    id: 'lh-pioniere',
    options: pioniereOptions,
    onSelect: () => {},
  })

  const projectCtrl = initSearchableSelect({
    id: 'lh-project',
    options: projectOptions,
    onSelect: () => {},
  })

  // Pre-fill selects when editing
  if (isEdit) {
    if (editPioniere?.id) pioniereCtrl.setValue(editPioniere.id)
    if (editProject?.id) projectCtrl.setValue(editProject.id)
    // Auto-size the description textarea if it has content
    const ta = document.querySelector('#log-hours-form textarea[name="description"]')
    if (ta && ta.value) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  }

  document.getElementById('log-hours-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)

    const pioniereVal = pioniereCtrl.getValue()
    const projectVal = projectCtrl.getValue()
    const hours = fd.get('hours')
    const date = fd.get('date')

    // Per-field validation
    const errors = {
      pioniere: !pioniereVal,
      project: !projectVal,
      hours: !hours || parseFloat(hours) < 0.5,
      date: !date,
    }

    document.getElementById('lh-err-pioniere')?.classList.toggle('hidden', !errors.pioniere)
    document.getElementById('lh-err-project')?.classList.toggle('hidden', !errors.project)
    document.getElementById('lh-err-hours')?.classList.toggle('hidden', !errors.hours)
    document.getElementById('lh-err-date')?.classList.toggle('hidden', !errors.date)

    if (Object.values(errors).some(Boolean)) return

    const unlock = withSubmitLock(e.target)
    if (!unlock) return

    const entryData = {
      hours: parseFloat(fd.get('hours')),
      date: fd.get('date'),
      description: fd.get('description') || null,
      pioniere_id: pioniereVal.id,
      project_id: projectVal.id,
    }

    try {
      let error
      if (isEdit) {
        ({ error } = await supabase.from('time_entries').update(entryData).eq('id', existingEntry.id))
      } else {
        ({ error } = await supabase.from('time_entries').insert(entryData))
      }
      if (error) throw error
      closeModal()
      await loadEntries()
    } catch (err) {
      unlock()
      console.error('Errore:', err)
      showAlert('Si \u00e8 verificato un errore. Riprova.')
    }
  })
}

function updateDateRangeLabel() {
  const label = document.getElementById('tb-date-range-label')
  const btn = document.getElementById('tb-date-range-btn')
  if (!label || !btn) return

  if (filterDateFrom && filterDateTo) {
    label.textContent = `${formatDateShort(filterDateFrom)} \u2013 ${formatDateShort(filterDateTo)}`
  } else if (filterDateFrom) {
    label.textContent = `Da ${formatDateShort(filterDateFrom)}`
  } else if (filterDateTo) {
    label.textContent = `Fino a ${formatDateShort(filterDateTo)}`
  } else {
    label.textContent = 'Periodo'
  }

  btn.classList.toggle('text-marea-black', !!(filterDateFrom || filterDateTo))
  btn.classList.toggle('border-marea-teal/40', !!(filterDateFrom || filterDateTo))
  btn.classList.toggle('text-marea-gray', !(filterDateFrom || filterDateTo))
}

function parseDateLocal(dateStr) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateStr)
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return parseDateLocal(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  return parseDateLocal(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}
