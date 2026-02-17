import { supabase } from '../supabase.js'

function detectDelimiter(text) {
  const firstLine = text.split('\n')[0]
  const commas = (firstLine.match(/,/g) || []).length
  const semicolons = (firstLine.match(/;/g) || []).length
  const tabs = (firstLine.match(/\t/g) || []).length
  if (tabs > commas && tabs > semicolons) return '\t'
  if (semicolons > commas) return ';'
  return ','
}

function parseCSV(text, delimiter) {
  const lines = text.trim().split(/\r?\n/)
  const result = []
  for (const line of lines) {
    const row = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
        else if (ch === '"') inQuotes = false
        else current += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === delimiter) { row.push(current.trim()); current = '' }
        else current += ch
      }
    }
    row.push(current.trim())
    result.push(row)
  }
  return result
}

function suggestSkills(jobDescription, skills) {
  if (!jobDescription) return []
  const text = jobDescription.toLowerCase()
  const suggested = []

  for (const skill of skills) {
    if (!skill.keywords) continue
    const keywords = skill.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    for (const kw of keywords) {
      // For short keywords (<=3 chars), require word boundary
      if (kw.length <= 3) {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(text)) {
          suggested.push(skill)
          break
        }
      } else {
        if (text.includes(kw)) {
          suggested.push(skill)
          break
        }
      }
    }
  }
  return suggested
}

export function openCsvImport({ skills, existingPionieri, onComplete }) {
  const overlay = document.createElement('div')
  overlay.id = 'csv-import-modal'
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4'
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" id="csv-import-backdrop"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col z-10 modal-content-enter">
      <div class="flex items-center justify-between px-6 py-5 border-b border-marea-border">
        <h2 class="text-xl text-marea-black">Importa Pionieri da CSV</h2>
        <button id="csv-import-close" class="p-1.5 rounded-full hover:bg-gray-100 text-marea-gray transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="csv-import-body" class="px-6 py-5 overflow-y-auto flex-1">
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  const close = () => overlay.remove()
  document.getElementById('csv-import-backdrop').addEventListener('click', close)
  document.getElementById('csv-import-close').addEventListener('click', close)

  let parsedData = null
  let columnMapping = {}
  let importRows = []

  renderUploadStep()

  function renderUploadStep() {
    const body = document.getElementById('csv-import-body')
    body.innerHTML = `
      <div class="text-center py-12">
        <div id="csv-drop-zone" class="border-2 border-dashed border-marea-border rounded-2xl p-12 hover:border-marea-teal transition-colors cursor-pointer">
          <svg class="w-12 h-12 text-marea-gray mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="text-marea-black font-medium mb-1">Trascina un file CSV qui</p>
          <p class="text-sm text-marea-gray">oppure clicca per selezionare</p>
          <input type="file" id="csv-file-input" accept=".csv,.tsv,.txt" class="hidden" />
        </div>
      </div>
    `

    const dropZone = document.getElementById('csv-drop-zone')
    const fileInput = document.getElementById('csv-file-input')

    dropZone.addEventListener('click', () => fileInput.click())
    dropZone.addEventListener('dragover', e => {
      e.preventDefault()
      dropZone.classList.add('border-marea-teal', 'bg-marea-teal-light/20')
    })
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-marea-teal', 'bg-marea-teal-light/20')
    })
    dropZone.addEventListener('drop', e => {
      e.preventDefault()
      dropZone.classList.remove('border-marea-teal', 'bg-marea-teal-light/20')
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
    })
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0])
    })
  }

  function handleFile(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const delimiter = detectDelimiter(text)
      parsedData = parseCSV(text, delimiter)
      if (parsedData.length < 2) {
        alert('Il file sembra vuoto o non valido.')
        return
      }
      // Skip title/subtitle rows: if a row has fewer than half its cells non-empty, it's not the header row
      const totalCols = parsedData[0].length
      while (parsedData.length > 1) {
        const nonEmpty = parsedData[0].filter(c => c.trim()).length
        if (nonEmpty >= totalCols / 2) break
        parsedData.shift()
      }
      if (parsedData.length < 2) {
        alert('Il file sembra vuoto o non valido.')
        return
      }
      renderMappingStep()
    }
    reader.readAsText(file)
  }

  function renderMappingStep() {
    const headers = parsedData[0]
    const previewRows = parsedData.slice(1, 4)

    const fieldOptions = [
      { value: '', label: '\u2014 Ignora \u2014' },
      { value: 'full_name', label: 'Nome completo' },
      { value: 'first_name', label: 'Nome' },
      { value: 'last_name', label: 'Cognome' },
      { value: 'email', label: 'Email' },
      { value: 'company', label: 'Azienda' },
      { value: 'location', label: 'Localit\u00e0' },
      { value: 'bio', label: 'Ruolo / Bio' },
      { value: 'origin', label: 'Origine siciliana' },
      { value: 'availability', label: 'Disponibilit\u00e0' },
    ]

    // Auto-detect column mapping
    const autoMap = {}
    // First pass: check if we have separate nome/cognome columns
    const hasNome = headers.some(h => {
      const hl = h.toLowerCase().trim()
      return hl === 'nome' || hl === 'first name' || hl === 'first_name'
    })
    const hasCognome = headers.some(h => {
      const hl = h.toLowerCase().trim()
      return hl === 'cognome' || hl === 'last name' || hl === 'last_name' || hl === 'surname'
    })
    const useSplitName = hasNome && hasCognome

    headers.forEach((h, i) => {
      const hl = h.toLowerCase().trim()
      if (useSplitName && (hl === 'nome' || hl === 'first name' || hl === 'first_name')) autoMap[i] = 'first_name'
      else if (useSplitName && (hl === 'cognome' || hl === 'last name' || hl === 'last_name' || hl === 'surname')) autoMap[i] = 'last_name'
      else if (hl.includes('nome') || hl.includes('name') || hl === 'person') autoMap[i] = 'full_name'
      else if (hl.includes('email') || hl.includes('e-mail') || hl.includes('mail')) autoMap[i] = 'email'
      else if (hl.includes('azienda') || hl.includes('company') || hl.includes('ente') || hl.includes('organizzazione')) autoMap[i] = 'company'
      else if (hl.includes('citt') || hl.includes('city') || hl.includes('location') || hl.includes('luogo') || hl.includes('sede')) autoMap[i] = 'location'
      else if (hl.includes('ruolo') || hl.includes('role') || hl.includes('bio') || hl.includes('descri') || hl.includes('job') || hl.includes('professione') || hl.includes('titolo')) autoMap[i] = 'bio'
      else if (hl.includes('origin') || hl.includes('sicilian')) autoMap[i] = 'origin'
      else if (hl.includes('disponibil') || hl.includes('availability') || hl.includes('ore')) autoMap[i] = 'availability'
    })

    const body = document.getElementById('csv-import-body')
    body.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-semibold text-marea-black mb-1">Mappa le colonne</h3>
          <p class="text-sm text-marea-gray mb-4">Associa ogni colonna del CSV al campo corrispondente.</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-marea-border">
                  ${headers.map((h, i) => `
                    <th class="pb-3 pr-4 text-left min-w-[140px]">
                      <div class="text-xs text-marea-gray mb-1.5 font-normal truncate">${h}</div>
                      <select data-col="${i}" class="csv-col-map w-full px-2 py-1.5 rounded-lg border border-marea-border text-sm focus-ring">
                        ${fieldOptions.map(f => `<option value="${f.value}" ${autoMap[i] === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
                      </select>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${previewRows.map(row => `
                  <tr class="border-b border-marea-border/40">
                    ${headers.map((_, i) => `<td class="py-2 pr-4 text-marea-gray text-xs truncate max-w-[180px]">${row[i] || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <p class="text-xs text-marea-gray mt-2">${parsedData.length - 1} righe trovate nel file</p>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-marea-border/60">
          <button id="csv-back-upload" class="btn-outline py-2 px-5">Indietro</button>
          <button id="csv-preview-btn" class="btn-gold py-2 px-5">Anteprima</button>
        </div>
      </div>
    `

    document.getElementById('csv-back-upload').addEventListener('click', renderUploadStep)
    document.getElementById('csv-preview-btn').addEventListener('click', () => {
      columnMapping = {}
      document.querySelectorAll('.csv-col-map').forEach(sel => {
        if (sel.value) columnMapping[sel.dataset.col] = sel.value
      })

      const mappedFields = Object.values(columnMapping)
      const hasFullName = mappedFields.includes('full_name')
      const hasFirstLast = mappedFields.includes('first_name') && mappedFields.includes('last_name')
      if (!hasFullName && !hasFirstLast) {
        alert('Devi mappare almeno "Nome completo" oppure sia "Nome" che "Cognome".')
        return
      }

      renderPreviewStep()
    })
  }

  function renderPreviewStep() {
    const dataRows = parsedData.slice(1).filter(row => row.some(cell => cell.trim()))

    importRows = dataRows.map(row => {
      const record = { full_name: '', email: '', company: '', location: '', bio: '', availability: '', _origin: '', _first_name: '', _last_name: '' }
      for (const [colIdx, field] of Object.entries(columnMapping)) {
        const val = row[parseInt(colIdx)] || ''
        if (field === 'origin') record._origin = val
        else if (field === 'first_name') record._first_name = val
        else if (field === 'last_name') record._last_name = val
        else record[field] = val
      }

      // Combine first + last name if mapped separately
      if (record._first_name || record._last_name) {
        record.full_name = `${record._first_name} ${record._last_name}`.trim()
      }
      delete record._first_name
      delete record._last_name

      // Append origin to bio
      if (record._origin) {
        record.bio = record.bio ? `${record.bio} \u2014 ${record._origin}` : record._origin
      }
      delete record._origin

      // Dedup check
      const emailMatch = record.email && existingPionieri.find(p =>
        p.email?.toLowerCase().trim() === record.email.toLowerCase().trim()
      )
      const nameMatch = !emailMatch && existingPionieri.find(p =>
        p.full_name?.toLowerCase().trim() === record.full_name.toLowerCase().trim()
      )
      record._existing = emailMatch || nameMatch || null
      record._isDuplicate = !!(emailMatch || nameMatch)

      // Suggest skills from bio
      record._suggestedSkills = suggestSkills(record.bio, skills)

      return record
    })

    const newCount = importRows.filter(r => !r._isDuplicate).length
    const updateCount = importRows.filter(r => r._isDuplicate).length

    const body = document.getElementById('csv-import-body')
    body.innerHTML = `
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-marea-black mb-1">Anteprima importazione</h3>
          <p class="text-sm text-marea-gray">
            <span class="font-medium text-marea-teal">${newCount} nuovi</span> &middot;
            <span class="font-medium text-amber-600">${updateCount} gi\u00e0 esistenti (verranno aggiornati)</span>
          </p>
        </div>
        <div class="overflow-x-auto -mx-6 px-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-marea-border text-left text-xs text-marea-gray uppercase tracking-wider">
                <th class="pb-2 pr-3">Stato</th>
                <th class="pb-2 pr-3">Nome</th>
                <th class="pb-2 pr-3">Email</th>
                <th class="pb-2 pr-3">Azienda</th>
                <th class="pb-2 pr-3">Ruolo / Bio</th>
                <th class="pb-2">Competenze suggerite</th>
              </tr>
            </thead>
            <tbody>
              ${importRows.map((r, idx) => `
                <tr class="border-b border-marea-border/30 ${r._isDuplicate ? 'bg-amber-50/50' : ''}">
                  <td class="py-2.5 pr-3">
                    ${r._isDuplicate
                      ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Esistente</span>'
                      : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Nuovo</span>'}
                  </td>
                  <td class="py-2.5 pr-3 font-medium text-marea-black whitespace-nowrap">${r.full_name}</td>
                  <td class="py-2.5 pr-3 text-marea-gray text-xs">${r.email || '\u2014'}</td>
                  <td class="py-2.5 pr-3 text-marea-gray text-xs max-w-[160px] truncate" title="${(r.company || '').replace(/"/g, '&quot;')}">${r.company || '\u2014'}</td>
                  <td class="py-2.5 pr-3 text-marea-gray text-xs max-w-[200px] truncate" title="${(r.bio || '').replace(/"/g, '&quot;')}">${r.bio || '\u2014'}</td>
                  <td class="py-2.5 text-marea-gray text-xs">
                    ${r._suggestedSkills.map(s => s.name).join(', ') || '\u2014'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="sticky bottom-0 bg-white border-t border-marea-border/60 px-6 py-3 flex justify-between items-center -mx-6 mt-4">
        <button id="csv-back-mapping" class="btn-outline py-2 px-5">Indietro</button>
        <button id="csv-do-import" class="btn-gold py-2 px-5">
          Importa ${importRows.length} Pionieri
        </button>
      </div>
    `

    document.getElementById('csv-back-mapping').addEventListener('click', renderMappingStep)
    document.getElementById('csv-do-import').addEventListener('click', doImport)
  }

  async function doImport() {
    const importBtn = document.getElementById('csv-do-import')
    importBtn.disabled = true
    importBtn.textContent = 'Importazione in corso...'

    let imported = 0
    let updated = 0
    let errors = []

    for (const row of importRows) {
      const record = {
        full_name: row.full_name,
        email: row.email || null,
        company: row.company || null,
        location: row.location || null,
        bio: row.bio || null,
        availability: row.availability || null,
        updated_at: new Date().toISOString(),
      }

      try {
        let pioniereId
        if (row._isDuplicate && row._existing) {
          // Only overwrite fields that have actual values in the CSV — preserve existing data for empty cells
          const updateRecord = { updated_at: record.updated_at }
          for (const key of ['full_name', 'email', 'company', 'location', 'bio', 'availability']) {
            if (record[key]) updateRecord[key] = record[key]
          }
          const { error } = await supabase.from('pionieri').update(updateRecord).eq('id', row._existing.id)
          if (error) throw error
          pioniereId = row._existing.id
          updated++
        } else {
          const { data, error } = await supabase.from('pionieri').insert(record).select().single()
          if (error) throw error
          pioniereId = data.id
          imported++
        }

        // Add suggested skills (preserve existing skills for updates)
        if (row._suggestedSkills.length > 0) {
          const { data: existingSkills } = await supabase
            .from('pioniere_skills').select('skill_id').eq('pioniere_id', pioniereId)
          const existingSkillIds = new Set((existingSkills || []).map(s => s.skill_id))

          const newSkills = row._suggestedSkills
            .filter(s => !existingSkillIds.has(s.id))
            .map(s => ({ pioniere_id: pioniereId, skill_id: s.id }))

          if (newSkills.length > 0) {
            await supabase.from('pioniere_skills').insert(newSkills)
          }
        }
      } catch (err) {
        errors.push(`${row.full_name}: ${err.message}`)
      }
    }

    // Show results
    const body = document.getElementById('csv-import-body')
    body.innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-marea-black mb-2">Importazione completata</h3>
        <p class="text-sm text-marea-gray mb-1">${imported} nuovi Pionieri aggiunti</p>
        ${updated > 0 ? `<p class="text-sm text-marea-gray mb-1">${updated} Pionieri aggiornati</p>` : ''}
        ${errors.length > 0 ? `
          <div class="mt-4 text-left bg-red-50 rounded-xl p-4">
            <p class="text-sm font-medium text-red-700 mb-1">Errori (${errors.length}):</p>
            ${errors.map(e => `<p class="text-xs text-red-600">${e}</p>`).join('')}
          </div>
        ` : ''}
        <button id="csv-import-done" class="btn-gold py-2 px-6 mt-6">Chiudi</button>
      </div>
    `

    document.getElementById('csv-import-done').addEventListener('click', () => {
      overlay.remove()
      if (onComplete) onComplete()
    })
  }
}
