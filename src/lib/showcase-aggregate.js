// Pure aggregation + geocoding for the public showcase snapshot.
// Consumed by the `showcase-snapshot` Netlify function — written as CommonJS
// so it can be require()d from a CJS function. No browser-only APIs.

// ── Geocoding dictionary ───────────────────────────────────────────
// Maps lowercase location substrings → [lat, lng]
const CITY_COORDS = {
  // Italy
  'palermo': [38.12, 13.36], 'catania': [37.50, 15.09], 'messina': [38.19, 15.55],
  'siracusa': [37.07, 15.29], 'trapani': [38.02, 12.51], 'agrigento': [37.31, 13.58],
  'ragusa': [36.93, 14.74], 'enna': [37.57, 14.28], 'caltanissetta': [37.49, 14.06],
  'sicilia': [37.50, 14.00], 'sicily': [37.50, 14.00],
  // Sicilian municipalities (etna belt + western/southern coast + inner)
  'aci castello': [37.55, 15.15], 'aci catena': [37.61, 15.14],
  "aci sant'antonio": [37.61, 15.13], 'aci sant’antonio': [37.61, 15.13],
  'acicastello': [37.55, 15.15], 'acireale': [37.61, 15.16],
  'aragona': [37.40, 13.62], 'bronte': [37.79, 14.83],
  'campobello di licata': [37.26, 13.80], "capo d'orlando": [38.16, 14.74],
  'capo d’orlando': [38.16, 14.74], 'carini': [38.13, 13.18],
  'comiso': [36.95, 14.61], 'favara': [37.31, 13.66],
  'floridia': [37.08, 15.15], 'gela': [37.07, 14.25], 'giarre': [37.73, 15.18],
  'ispica': [36.79, 14.91], 'licata': [37.10, 13.94], 'linguaglossa': [37.84, 15.14],
  'milazzo': [38.22, 15.24], 'misterbianco': [37.52, 15.01], 'modica': [36.86, 14.76],
  "motta sant'anastasia": [37.51, 14.97], 'motta sant’anastasia': [37.51, 14.97],
  'motta sant anastasia': [37.51, 14.97],
  'mussomeli': [37.58, 13.75], 'nicosia': [37.75, 14.40], 'noto': [36.89, 15.07],
  'pachino': [36.71, 15.10], 'partanna': [37.72, 12.89], 'paternò': [37.57, 14.90],
  'paterno': [37.57, 14.90], 'pedara': [37.62, 15.06],
  'piana degli albanesi': [37.99, 13.28], 'regalbuto': [37.65, 14.64],
  'roccalumera': [37.97, 15.39], 'san cataldo': [37.49, 13.99],
  'san giovanni la punta': [37.58, 15.10], "sant'agata li battiati": [37.55, 15.08],
  'sant’agata li battiati': [37.55, 15.08], 'scicli': [36.79, 14.71],
  'scoglitti': [36.89, 14.43], 'termini imerese': [37.99, 13.69], 'trabia': [38.00, 13.65],
  'trecastagni': [37.62, 15.08], 'valverde': [37.58, 15.13], 'viagrande': [37.61, 15.10],
  'zafferana etnea': [37.69, 15.10],
  'acquaviva platani': [37.55, 13.71],
  // Other Italian cities
  'alessandria': [44.91, 8.61], 'anzano del parco': [45.78, 9.20],
  'casier': [45.65, 12.32], 'chioggia': [45.22, 12.28], 'cittadella': [45.65, 11.78],
  'como': [45.81, 9.08], 'cremona': [45.13, 10.02],
  'francavilla fontana': [40.53, 17.59], 'gravina in puglia': [40.82, 16.42],
  'pavia': [45.18, 9.16], 'rimini': [44.06, 12.57], 'rognano': [45.27, 9.05],
  'segrate': [45.49, 9.30], 'tirano': [46.22, 10.17],
  'varese': [45.82, 8.83], 'vedano al lambro': [45.61, 9.30],
  'roma': [41.90, 12.50], 'rome': [41.90, 12.50], 'milano': [45.46, 9.19],
  'milan': [45.46, 9.19], 'napoli': [40.85, 14.27], 'naples': [40.85, 14.27],
  'torino': [45.07, 7.69], 'turin': [45.07, 7.69], 'firenze': [43.77, 11.25],
  'florence': [43.77, 11.25], 'bologna': [44.49, 11.34], 'venezia': [45.44, 12.32],
  'venice': [45.44, 12.32], 'genova': [44.41, 8.93], 'bari': [41.12, 16.87],
  'verona': [45.44, 10.99], 'padova': [45.41, 11.88], 'trieste': [45.65, 13.78],
  'brescia': [45.54, 10.21], 'parma': [44.80, 10.33], 'modena': [44.65, 10.92],
  'reggio calabria': [38.11, 15.65], 'perugia': [43.11, 12.39], 'cagliari': [39.22, 9.12],
  'sassari': [40.73, 8.56], 'lecce': [40.35, 18.17], 'pisa': [43.72, 10.40],
  'bergamo': [45.70, 9.67], 'trento': [46.07, 11.12], 'bolzano': [46.50, 11.35],
  'ancona': [43.62, 13.52], 'aosta': [45.74, 7.32], 'potenza': [40.64, 15.80],
  'cosenza': [39.30, 16.25], 'salerno': [40.68, 14.77], 'italia': [41.90, 12.50],
  'italy': [41.90, 12.50],
  // Europe
  'addis ababa': [9.03, 38.74], 'bern': [46.95, 7.45], 'berna': [46.95, 7.45],
  'chisinau': [47.01, 28.86], 'edimburgo': [55.95, -3.19],
  'gipf-oberfrick': [47.51, 8.01], 'jersey city': [40.72, -74.05],
  'losanna': [46.52, 6.63], 'lausanne': [46.52, 6.63], 'lugano': [46.00, 8.95],
  'neuchâtel': [47.00, 6.93], 'neuchatel': [47.00, 6.93],
  'nieuwegein': [52.03, 5.10], 'red bank': [40.35, -74.07],
  'london': [51.51, -0.13], 'londra': [51.51, -0.13], 'paris': [48.86, 2.35],
  'parigi': [48.86, 2.35], 'berlin': [52.52, 13.41], 'berlino': [52.52, 13.41],
  'madrid': [40.42, -3.70], 'barcelona': [41.39, 2.17], 'barcellona': [41.39, 2.17],
  'amsterdam': [52.37, 4.90], 'brussels': [50.85, 4.35], 'bruxelles': [50.85, 4.35],
  'vienna': [48.21, 16.37], 'zurich': [47.38, 8.54], 'zurigo': [47.38, 8.54],
  'geneva': [46.20, 6.14], 'ginevra': [46.20, 6.14], 'munich': [48.14, 11.58],
  'monaco di baviera': [48.14, 11.58], 'münchen': [48.14, 11.58],
  'lisbon': [38.72, -9.14], 'lisbona': [38.72, -9.14], 'dublin': [53.35, -6.26],
  'dublino': [53.35, -6.26], 'edinburgh': [55.95, -3.19], 'copenhagen': [55.68, 12.57],
  'stockholm': [59.33, 18.07], 'oslo': [59.91, 10.75], 'helsinki': [60.17, 24.94],
  'warsaw': [52.23, 21.01], 'varsavia': [52.23, 21.01], 'prague': [50.08, 14.44],
  'praga': [50.08, 14.44], 'budapest': [47.50, 19.04], 'bucharest': [44.43, 26.10],
  'athens': [37.98, 23.73], 'atene': [37.98, 23.73], 'istanbul': [41.01, 28.98],
  'luxembourg': [49.61, 6.13], 'lussemburgo': [49.61, 6.13], 'lyon': [45.76, 4.84],
  'lione': [45.76, 4.84], 'marseille': [43.30, 5.37], 'marsiglia': [43.30, 5.37],
  'hamburg': [53.55, 10.00], 'amburgo': [53.55, 10.00], 'frankfurt': [50.11, 8.68],
  'francoforte': [50.11, 8.68],
  // UK
  'manchester': [53.48, -2.24], 'birmingham': [52.49, -1.90], 'leeds': [53.80, -1.55],
  'glasgow': [55.86, -4.25], 'bristol': [51.45, -2.59], 'oxford': [51.75, -1.25],
  'cambridge': [52.21, 0.12],
  // Americas
  'new york': [40.71, -74.01], 'nyc': [40.71, -74.01], 'los angeles': [34.05, -118.24],
  'chicago': [41.88, -87.63], 'san francisco': [37.77, -122.42], 'boston': [42.36, -71.06],
  'washington': [38.91, -77.04], 'miami': [25.76, -80.19], 'houston': [29.76, -95.37],
  'seattle': [47.61, -122.33], 'toronto': [43.65, -79.38], 'montreal': [45.50, -73.57],
  'vancouver': [49.28, -123.12], 'mexico city': [19.43, -99.13], 'città del messico': [19.43, -99.13],
  'são paulo': [-23.55, -46.63], 'san paolo': [-23.55, -46.63], 'rio de janeiro': [-22.91, -43.17],
  'buenos aires': [-34.60, -58.38], 'bogotá': [4.71, -74.07], 'bogota': [4.71, -74.07],
  'lima': [-12.05, -77.04], 'santiago': [-33.45, -70.67],
  'philadelphia': [39.95, -75.17], 'atlanta': [33.75, -84.39], 'dallas': [32.78, -96.80],
  'denver': [39.74, -104.99], 'detroit': [42.33, -83.05], 'austin': [30.27, -97.74],
  'san diego': [32.72, -117.16], 'portland': [45.52, -122.68],
  // Middle East & Africa
  'dubai': [25.20, 55.27], 'abu dhabi': [24.45, 54.65], 'tel aviv': [32.09, 34.78],
  'riyadh': [24.71, 46.67], 'doha': [25.29, 51.53], 'cairo': [30.04, 31.24],
  'il cairo': [30.04, 31.24], 'nairobi': [-1.29, 36.82], 'cape town': [-33.93, 18.42],
  'johannesburg': [-26.20, 28.05], 'lagos': [6.52, 3.38], 'casablanca': [33.57, -7.59],
  'tunis': [36.81, 10.17], 'tunisi': [36.81, 10.17],
  // Asia & Oceania
  'tokyo': [35.68, 139.69], 'beijing': [39.90, 116.40], 'pechino': [39.90, 116.40],
  'shanghai': [31.23, 121.47], 'hong kong': [22.32, 114.17], 'singapore': [1.35, 103.82],
  'mumbai': [19.08, 72.88], 'delhi': [28.61, 77.21],
  'bangalore': [12.97, 77.59], 'seoul': [37.57, 126.98], 'sydney': [-33.87, 151.21],
  'melbourne': [-37.81, 144.96], 'auckland': [-36.85, 174.76], 'jakarta': [-6.21, 106.85],
  'bangkok': [13.76, 100.50], 'kuala lumpur': [3.14, 101.69], 'taipei': [25.03, 121.57],
  // Country fallbacks
  'usa': [39.83, -98.58], 'united states': [39.83, -98.58], 'stati uniti': [39.83, -98.58],
  'uk': [51.51, -0.13], 'united kingdom': [51.51, -0.13], 'regno unito': [51.51, -0.13],
  'gran bretagna': [51.51, -0.13], 'inghilterra': [51.51, -0.13],
  'france': [48.86, 2.35], 'francia': [48.86, 2.35],
  'germany': [52.52, 13.41], 'germania': [52.52, 13.41],
  'spain': [40.42, -3.70], 'spagna': [40.42, -3.70],
  'switzerland': [46.95, 7.45], 'svizzera': [46.95, 7.45],
  'netherlands': [52.37, 4.90], 'paesi bassi': [52.37, 4.90], 'olanda': [52.37, 4.90],
  'belgium': [50.85, 4.35], 'belgio': [50.85, 4.35],
  'austria': [48.21, 16.37], 'portugal': [38.72, -9.14], 'portogallo': [38.72, -9.14],
  'ireland': [53.35, -6.26], 'irlanda': [53.35, -6.26],
  'canada': [56.13, -106.35], 'australia': [-25.27, 133.78],
  'japan': [35.68, 139.69], 'giappone': [35.68, 139.69],
  'china': [39.90, 116.40], 'cina': [39.90, 116.40],
  'india': [20.59, 78.96], 'brazil': [-14.24, -51.93], 'brasile': [-14.24, -51.93],
  'argentina': [-34.60, -58.38], 'mexico': [23.63, -102.55], 'messico': [23.63, -102.55],
  'uae': [25.20, 55.27], 'emirati arabi': [25.20, 55.27],
  // US state codes (after comma)
  ', ca': [36.78, -119.42], ', ny': [40.71, -74.01], ', tx': [31.97, -99.90],
  ', fl': [27.66, -81.52], ', il': [40.63, -89.40], ', ma': [42.41, -71.38],
  ', wa': [47.75, -120.74], ', co': [39.55, -105.78], ', pa': [41.20, -77.19],
  ', oh': [40.42, -82.91], ', ga': [32.17, -82.91], ', nc': [35.76, -79.02],
  ', mi': [44.31, -85.60], ', nj': [40.06, -74.41], ', va': [37.43, -78.66],
  ', az': [34.05, -111.09], ', md': [39.05, -76.64], ', mn': [46.73, -94.69],
  ', or': [43.80, -120.55], ', ct': [41.60, -72.76], ', wi': [43.78, -88.79],
  ', dc': [38.91, -77.04],
  // Country codes (after comma)
  ', it': [41.90, 12.50], ', de': [51.17, 10.45], ', fr': [46.60, 2.35],
  ', es': [40.42, -3.70], ', pt': [38.72, -9.14], ', nl': [52.13, 5.29],
  ', be': [50.50, 4.47], ', at': [47.52, 13.41], ', ch': [46.82, 8.23],
  ', se': [60.13, 18.64], ', no': [60.47, 8.47], ', dk': [56.26, 9.50],
  ', fi': [61.92, 25.75], ', ie': [53.14, -7.69], ', pl': [51.92, 19.15],
  ', cz': [49.82, 15.47], ', gr': [39.07, 21.82], ', ro': [45.94, 24.97],
  ', hu': [47.16, 19.50], ', br': [-14.24, -51.93], ', ar': [-38.42, -63.62],
  ', au': [-25.27, 133.78], ', jp': [36.20, 138.25], ', sg': [1.35, 103.82],
  ', ae': [23.42, 53.85], ', hk': [22.32, 114.17], ', cn': [35.86, 104.20],
  ', in': [20.59, 78.96], ', kr': [35.91, 127.77], ', za': [-30.56, 22.94],
  ', ke': [-0.02, 37.91], ', ng': [9.08, 8.68], ', eg': [26.82, 30.80],
  ', tr': [38.96, 35.24], ', il': [31.05, 34.85], ', mx': [23.63, -102.55],
  ', cl': [-35.68, -71.54], ', co': [4.57, -74.30], ', pe': [-9.19, -75.02],
}

const SICILY = [37.50, 14.00]

const SICILY_PROVINCES = [
  'Palermo', 'Catania', 'Messina', 'Siracusa', 'Trapani',
  'Agrigento', 'Ragusa', 'Enna', 'Caltanissetta',
]

const SICILIAN_CITY_TO_PROVINCE = {
  // Palermo
  'palermo': 'Palermo', 'monreale': 'Palermo', 'bagheria': 'Palermo',
  'cefalù': 'Palermo', 'cefalu': 'Palermo', 'carini': 'Palermo',
  'partinico': 'Palermo', 'corleone': 'Palermo', 'termini imerese': 'Palermo',
  'piana degli albanesi': 'Palermo', 'trabia': 'Palermo',
  // Catania
  'catania': 'Catania', 'acireale': 'Catania', 'paternò': 'Catania',
  'paterno': 'Catania', 'misterbianco': 'Catania', 'caltagirone': 'Catania',
  'giarre': 'Catania', 'bronte': 'Catania', 'adrano': 'Catania',
  'mascalucia': 'Catania', 'aci castello': 'Catania', 'aci catena': 'Catania',
  "aci sant'antonio": 'Catania', 'aci sant’antonio': 'Catania',
  'acicastello': 'Catania', 'linguaglossa': 'Catania',
  "motta sant'anastasia": 'Catania', 'motta sant’anastasia': 'Catania',
  'motta sant anastasia': 'Catania', 'pedara': 'Catania',
  'san giovanni la punta': 'Catania', "sant'agata li battiati": 'Catania',
  'sant’agata li battiati': 'Catania', 'trecastagni': 'Catania',
  'valverde': 'Catania', 'viagrande': 'Catania', 'zafferana etnea': 'Catania',
  // Messina
  'messina': 'Messina', 'taormina': 'Messina', 'milazzo': 'Messina',
  'patti': 'Messina', "capo d'orlando": 'Messina', 'capo d’orlando': 'Messina',
  'barcellona pozzo di gotto': 'Messina', 'lipari': 'Messina',
  'roccalumera': 'Messina',
  // Siracusa
  'siracusa': 'Siracusa', 'syracuse': 'Siracusa', 'noto': 'Siracusa',
  'augusta': 'Siracusa', 'lentini': 'Siracusa', 'avola': 'Siracusa',
  'pachino': 'Siracusa', 'floridia': 'Siracusa',
  // Trapani
  'trapani': 'Trapani', 'marsala': 'Trapani', 'mazara del vallo': 'Trapani',
  'mazara': 'Trapani', 'alcamo': 'Trapani', 'erice': 'Trapani',
  'castelvetrano': 'Trapani', 'pantelleria': 'Trapani', 'favignana': 'Trapani',
  'partanna': 'Trapani',
  // Agrigento
  'agrigento': 'Agrigento', 'licata': 'Agrigento', 'sciacca': 'Agrigento',
  'canicattì': 'Agrigento', 'canicatti': 'Agrigento', 'ribera': 'Agrigento',
  'favara': 'Agrigento', 'porto empedocle': 'Agrigento', 'lampedusa': 'Agrigento',
  'aragona': 'Agrigento', 'campobello di licata': 'Agrigento',
  // Ragusa
  'ragusa': 'Ragusa', 'vittoria': 'Ragusa', 'modica': 'Ragusa',
  'comiso': 'Ragusa', 'scicli': 'Ragusa', 'pozzallo': 'Ragusa', 'ispica': 'Ragusa',
  'scoglitti': 'Ragusa',
  // Enna
  'enna': 'Enna', 'piazza armerina': 'Enna', 'leonforte': 'Enna', 'nicosia': 'Enna',
  'regalbuto': 'Enna',
  // Caltanissetta
  'caltanissetta': 'Caltanissetta', 'gela': 'Caltanissetta',
  'niscemi': 'Caltanissetta', 'mazzarino': 'Caltanissetta',
  'san cataldo': 'Caltanissetta', 'mussomeli': 'Caltanissetta',
  'acquaviva platani': 'Caltanissetta',
}

const PROVINCE_KEYS_SORTED = Object.keys(SICILIAN_CITY_TO_PROVINCE)
  .sort((a, b) => b.length - a.length)

function detectSicilianProvince(rawOrigin) {
  if (!rawOrigin) return null
  const lower = rawOrigin.toLowerCase().trim()
  for (const key of PROVINCE_KEYS_SORTED) {
    if (lower.includes(key)) return SICILIAN_CITY_TO_PROVINCE[key]
  }
  return null
}

const SORTED_CITY_KEYS = Object.keys(CITY_COORDS)
  .filter(k => !k.startsWith(','))
  .sort((a, b) => b.length - a.length)
const CITY_CODE_KEYS = Object.keys(CITY_COORDS).filter(k => k.startsWith(','))

function geocodeLocation(location, runtimeCache) {
  if (!location) return null
  const lower = location.toLowerCase().trim()
  if (runtimeCache && runtimeCache[lower]) return runtimeCache[lower]
  for (const key of SORTED_CITY_KEYS) {
    if (lower.includes(key)) return CITY_COORDS[key]
  }
  for (const key of CITY_CODE_KEYS) {
    if (lower.includes(key)) return CITY_COORDS[key]
  }
  return null
}

// Resolve unmatched locations: pull what's already in `location_cache`, then
// fetch the rest from Nominatim (1 req/s per their acceptable-use policy) and
// write back. Returns the populated runtime cache so `aggregate()` can use it.
async function resolveLocationsViaNominatim(strings, supabaseClient) {
  const runtimeCache = {}
  const unique = [...new Set(strings.map((s) => s.toLowerCase().trim()).filter(Boolean))]
  if (unique.length === 0) return runtimeCache

  // Filter to ones the static dictionary doesn't already cover.
  const unmatched = unique.filter((q) => !geocodeLocation(q))
  if (unmatched.length === 0) return runtimeCache

  // Pull existing cache rows in one query.
  const { data: cached, error } = await supabaseClient
    .from('location_cache')
    .select('query, lat, lng')
    .in('query', unmatched)
  if (error) {
    console.warn('[showcase-snapshot] location_cache read failed:', error.message)
  } else {
    ;(cached || []).forEach((row) => {
      runtimeCache[row.query] = [row.lat, row.lng]
    })
  }

  const stillMissing = unmatched.filter((q) => !runtimeCache[q])
  for (const q of stillMissing) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'fondazione-marea-showcase-snapshot/1.0' },
      })
      const data = await res.json()
      const hit = data?.[0]
      if (hit) {
        const lat = parseFloat(hit.lat)
        const lng = parseFloat(hit.lon)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          runtimeCache[q] = [lat, lng]
          await supabaseClient.from('location_cache').upsert(
            { query: q, lat, lng, source: 'nominatim' },
            { onConflict: 'query' },
          )
        }
      }
    } catch (e) {
      console.warn('[showcase-snapshot] Nominatim failed for', q, e?.message || e)
    }
    await new Promise((r) => setTimeout(r, 1100))
  }
  return runtimeCache
}

// Pure aggregation. Takes raw rows from the 7 queries plus a populated runtime
// geocode cache (from resolveLocationsViaNominatim) and returns the JSON shape
// the showcase page consumes.
function aggregate(raw, runtimeCache) {
  runtimeCache = runtimeCache || {}
  const pionieri = raw.pionieri || []
  const projects = raw.projects || []
  const matches = raw.matches || []
  const timeEntries = raw.timeEntries || []
  const skills = raw.skills || []
  const pioniereSkills = raw.pioniereSkills || []
  const projectNeeds = raw.projectNeeds || []

  // Globe markers
  const locationCounts = {}
  const unmatched = []
  pionieri.forEach((p) => {
    const loc = p.location || p.origin
    if (!loc) return
    const coords = geocodeLocation(loc, runtimeCache)
    if (!coords) { unmatched.push(loc); return }
    const key = coords.join(',')
    locationCounts[key] = locationCounts[key] || { coords, count: 0, name: loc }
    locationCounts[key].count++
  })

  const totalHours = timeEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)

  const monthlyHours = {}
  timeEntries.forEach((e) => {
    const month = e.date?.substring(0, 7)
    if (month) monthlyHours[month] = (monthlyHours[month] || 0) + (parseFloat(e.hours) || 0)
  })

  const skillIdToInfo = {}
  skills.forEach((s) => { skillIdToInfo[s.id] = { name: s.name, category: s.category } })

  const skillCategoryCounts = {}
  const skillCounts = {}
  pioniereSkills.forEach((ps) => {
    const info = skillIdToInfo[ps.skill_id]
    if (!info) return
    skillCategoryCounts[info.category] = (skillCategoryCounts[info.category] || 0) + 1
    skillCounts[ps.skill_id] = (skillCounts[ps.skill_id] || 0) + 1
  })

  const skillsByCategory = {}
  skills.forEach((s) => {
    if (!s.category || !skillCounts[s.id]) return
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = []
    skillsByCategory[s.category].push({ name: s.name, count: skillCounts[s.id] })
  })
  for (const cat of Object.keys(skillsByCategory)) {
    skillsByCategory[cat].sort((a, b) => b.count - a.count)
  }

  const matchStatusCounts = { proposed: 0, confirmed: 0, active: 0, completed: 0 }
  matches.forEach((m) => {
    if (matchStatusCounts[m.status] !== undefined) matchStatusCounts[m.status]++
  })

  const distinctLocations = new Set()
  pionieri.forEach((p) => {
    const loc = p.location || p.origin
    if (loc) distinctLocations.add(loc.trim().toLowerCase())
  })

  // Province aggregation
  const provinceCounts = Object.fromEntries(SICILY_PROVINCES.map((n) => [n, 0]))
  const pioniereIdToProvince = {}
  pionieri.forEach((p) => {
    const province = detectSicilianProvince(p.origin || p.location || '')
    if (!province) return
    provinceCounts[province]++
    pioniereIdToProvince[p.id] = province
  })

  const provinceCategoryCounts = Object.fromEntries(SICILY_PROVINCES.map((n) => [n, {}]))
  pioniereSkills.forEach((ps) => {
    const province = pioniereIdToProvince[ps.pioniere_id]
    if (!province) return
    const info = skillIdToInfo[ps.skill_id]
    if (!info?.category) return
    provinceCategoryCounts[province][info.category] =
      (provinceCategoryCounts[province][info.category] || 0) + 1
  })

  const provinceLocationMaps = Object.fromEntries(SICILY_PROVINCES.map((n) => [n, new Map()]))
  pionieri.forEach((p) => {
    const province = pioniereIdToProvince[p.id]
    if (!province) return
    const rawLoc = (p.location || '').trim()
    if (!rawLoc) return
    const coords = geocodeLocation(rawLoc, runtimeCache)
    if (!coords) return
    const key = coords.join(',')
    const bucket = provinceLocationMaps[province]
    const existing = bucket.get(key)
    if (existing) existing.count++
    else bucket.set(key, { coords, count: 1, label: rawLoc })
  })

  const sicilyProvinces = SICILY_PROVINCES
    .map((name) => {
      const allCats = Object.entries(provinceCategoryCounts[name])
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }))
      const totalSkillTags = allCats.reduce((s, c) => s + c.count, 0)
      return {
        name,
        count: provinceCounts[name],
        totalSkillTags,
        categoryBreakdown: allCats,
        locations: [...provinceLocationMaps[name].values()]
          .sort((a, b) => b.count - a.count),
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'it'))

  const activeProjects = projects.filter((p) => p.status === 'active').length

  return {
    pionieri,
    totalPionieri: pionieri.length,
    totalHours,
    totalMatches: matches.length,
    activeProjects,
    totalProjects: projects.length,
    locationCounts,
    sicilyProvinces,
    monthlyHours,
    skillCategoryCounts,
    skillsByCategory,
    matchStatusCounts,
    distinctLocations: distinctLocations.size,
    needsFulfilled: projectNeeds.filter((n) => n.status === 'fulfilled').length,
    needsMatched: projectNeeds.filter((n) => n.status === 'matched').length,
    needsOpen: projectNeeds.filter((n) => n.status === 'open').length,
    totalNeeds: projectNeeds.length,
    allNeeds: projectNeeds,
    matches,
    skillIdToInfo,
    _unmatchedLocations: [...new Set(unmatched)].sort(),
    _generatedAt: new Date().toISOString(),
  }
}

module.exports = {
  aggregate,
  resolveLocationsViaNominatim,
  geocodeLocation,
  detectSicilianProvince,
  CITY_COORDS,
  SICILY,
  SICILY_PROVINCES,
  SICILIAN_CITY_TO_PROVINCE,
}
