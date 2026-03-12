import { escapeHtml } from '../utils/escape.js'

/**
 * Reusable single-select searchable dropdown component.
 *
 * Usage:
 *   const html = renderSearchableSelect({ id: 'my-select', placeholder: 'Cerca...' })
 *   // after inserting into DOM:
 *   const ctrl = initSearchableSelect({ id: 'my-select', options: [...], onSelect, onClear })
 *   ctrl.getValue()   // { id, label } | null
 *   ctrl.setValue(id)  // programmatically select
 *   ctrl.clear()       // programmatically clear
 *   ctrl.setDisabled(bool)
 */

export function renderSearchableSelect({ id, placeholder = 'Cerca...' }) {
  return `
    <div id="${id}-container" class="relative">
      <div class="relative">
        <input type="text" id="${id}-input"
               class="w-full px-4 py-2.5 pr-8 rounded-xl border border-marea-border text-sm focus-ring transition-all"
               placeholder="${placeholder}" autocomplete="off" />
        <button type="button" id="${id}-clear"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-marea-gray/60 hover:text-marea-gray transition-colors hidden">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="${id}-dropdown"
           class="absolute left-0 right-0 top-full mt-1 bg-white border border-marea-border/60 rounded-xl shadow-lg max-h-52 overflow-y-auto z-20 hidden">
      </div>
      <input type="hidden" id="${id}-value" value="" />
    </div>
  `
}

export function initSearchableSelect({ id, options = [], onSelect, onClear }) {
  const input = document.getElementById(`${id}-input`)
  const dropdown = document.getElementById(`${id}-dropdown`)
  const hiddenInput = document.getElementById(`${id}-value`)
  const clearBtn = document.getElementById(`${id}-clear`)
  if (!input || !dropdown) return null

  let allOptions = options  // [{ id, label, sublabel? }]
  let selectedOption = null
  let isOpen = false
  let highlightIdx = -1
  let disabled = false

  function setOptions(opts) {
    allOptions = opts
  }

  function show() {
    if (disabled) return
    isOpen = true
    highlightIdx = -1
    render(input.value)
  }

  function hide() {
    isOpen = false
    dropdown.classList.add('hidden')
  }

  function render(filter = '') {
    const q = filter.toLowerCase().trim()
    const filtered = allOptions.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    )

    if (filtered.length === 0) {
      dropdown.innerHTML = `
        <div class="px-4 py-3 text-sm text-marea-gray/60">Nessun risultato</div>
      `
    } else {
      dropdown.innerHTML = filtered.map((o, i) => `
        <button type="button"
                class="ss-option w-full text-left px-4 py-2.5 text-sm hover:bg-marea-light transition-colors ${i === highlightIdx ? 'bg-marea-light' : ''} ${selectedOption?.id === o.id ? 'bg-marea-teal-light/50' : ''}"
                data-option-id="${o.id}" data-option-idx="${i}">
          <span class="font-medium text-marea-black">${highlight(o.label, q)}</span>
          ${o.sublabel ? `<span class="text-marea-gray ml-1.5 text-xs">· ${escapeHtml(o.sublabel)}</span>` : ''}
        </button>
      `).join('')
    }

    dropdown.classList.remove('hidden')

    dropdown.querySelectorAll('.ss-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const opt = allOptions.find(o => o.id === btn.dataset.optionId)
        if (opt) select(opt)
      })
    })
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text)
    const escaped = escapeHtml(text)
    const idx = escaped.toLowerCase().indexOf(query)
    if (idx === -1) return escaped
    return escaped.slice(0, idx) + '<mark class="bg-yellow-100 rounded px-0.5">' + escaped.slice(idx, idx + query.length) + '</mark>' + escaped.slice(idx + query.length)
  }

  function select(opt) {
    selectedOption = opt
    input.value = opt.label
    hiddenInput.value = opt.id
    clearBtn.classList.remove('hidden')
    input.classList.add('text-marea-black', 'font-medium')
    hide()
    if (onSelect) onSelect(opt)
  }

  function clear() {
    selectedOption = null
    input.value = ''
    hiddenInput.value = ''
    clearBtn.classList.add('hidden')
    input.classList.remove('text-marea-black', 'font-medium')
    if (onClear) onClear()
  }

  function setDisabled(val) {
    disabled = val
    input.disabled = val
    if (val) {
      input.classList.add('bg-gray-50', 'text-marea-gray/60')
    } else {
      input.classList.remove('bg-gray-50', 'text-marea-gray/60')
    }
  }

  // Events
  input.addEventListener('input', () => {
    // If user is typing, they're searching — don't keep a selection active
    if (selectedOption) {
      selectedOption = null
      hiddenInput.value = ''
      clearBtn.classList.add('hidden')
      input.classList.remove('text-marea-black', 'font-medium')
    }
    show()
  })

  input.addEventListener('focus', () => {
    // On focus, if nothing selected show all options; if selected show filtered
    show()
  })

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    clear()
    input.focus()
  })

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (!isOpen) return
    const items = dropdown.querySelectorAll('.ss-option')
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightIdx = Math.min(highlightIdx + 1, items.length - 1)
      updateHighlight(items)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightIdx = Math.max(highlightIdx - 1, 0)
      updateHighlight(items)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && items[highlightIdx]) {
        items[highlightIdx].click()
      }
    } else if (e.key === 'Escape') {
      hide()
    }
  })

  function updateHighlight(items) {
    items.forEach((el, i) => {
      el.classList.toggle('bg-marea-light', i === highlightIdx)
    })
    if (items[highlightIdx]) {
      items[highlightIdx].scrollIntoView({ block: 'nearest' })
    }
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest(`#${id}-container`)) {
      // If dropdown is open and no selection was made, restore previous value
      if (isOpen && !selectedOption && input.value) {
        input.value = ''
      }
      hide()
    }
  })

  return {
    getValue: () => selectedOption,
    setValue: (optId) => {
      const opt = allOptions.find(o => o.id === optId)
      if (opt) select(opt)
    },
    clear,
    setDisabled,
    setOptions,
  }
}
