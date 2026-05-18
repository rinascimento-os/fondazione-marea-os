import { escapeHtml } from './escape.js'
import { escapeAttr } from './helpers.js'

export const AVAILABILITY_OPTIONS = [
  "Un'ora a trimestre",
  '1-2h/mese',
  '3-5h/mese',
  '5-10h/mese',
  '10h+/mese',
  'Su richiesta',
]

// Renders an availability <select>. Preserves legacy free-text values by
// adding them as a one-off "(esistente)" option pre-selected at the top.
export function renderAvailabilitySelect({ name = 'availability', value = '', selectClass = '' } = {}) {
  const current = (value || '').trim()
  const isLegacy = current && !AVAILABILITY_OPTIONS.includes(current)
  return `
    <select name="${escapeAttr(name)}" class="${escapeAttr(selectClass)}">
      <option value="" ${current === '' ? 'selected' : ''}>—</option>
      ${isLegacy ? `<option value="${escapeAttr(current)}" selected>${escapeHtml(current)} (esistente)</option>` : ''}
      ${AVAILABILITY_OPTIONS.map(opt => `
        <option value="${escapeAttr(opt)}" ${current === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>
      `).join('')}
    </select>
  `
}
