import createGlobe from 'cobe'
import { Chart } from 'chart.js/auto'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabase.js'
import sicilyProvincesGeoJson from '../assets/sicilia-provinces.json'
import worldCountriesGeoJson from '../assets/world-countries.json'

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
  "aci sant'antonio": [37.61, 15.13], 'aci sant\u2019antonio': [37.61, 15.13],
  'acicastello': [37.55, 15.15], 'acireale': [37.61, 15.16],
  'aragona': [37.40, 13.62], 'bronte': [37.79, 14.83],
  'campobello di licata': [37.26, 13.80], 'capo d\'orlando': [38.16, 14.74],
  'capo d\u2019orlando': [38.16, 14.74], 'carini': [38.13, 13.18],
  'comiso': [36.95, 14.61], 'favara': [37.31, 13.66],
  'floridia': [37.08, 15.15], 'gela': [37.07, 14.25], 'giarre': [37.73, 15.18],
  'ispica': [36.79, 14.91], 'licata': [37.10, 13.94], 'linguaglossa': [37.84, 15.14],
  'milazzo': [38.22, 15.24], 'misterbianco': [37.52, 15.01], 'modica': [36.86, 14.76],
  "motta sant'anastasia": [37.51, 14.97], 'motta sant\u2019anastasia': [37.51, 14.97],
  'motta sant anastasia': [37.51, 14.97],
  'mussomeli': [37.58, 13.75], 'nicosia': [37.75, 14.40], 'noto': [36.89, 15.07],
  'pachino': [36.71, 15.10], 'partanna': [37.72, 12.89], 'paternò': [37.57, 14.90],
  'paterno': [37.57, 14.90], 'pedara': [37.62, 15.06],
  'piana degli albanesi': [37.99, 13.28], 'regalbuto': [37.65, 14.64],
  'roccalumera': [37.97, 15.39], 'san cataldo': [37.49, 13.99],
  'san giovanni la punta': [37.58, 15.10], 'sant\'agata li battiati': [37.55, 15.08],
  'sant\u2019agata li battiati': [37.55, 15.08], 'scicli': [36.79, 14.71],
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

// Sicily center for arc origins
const SICILY = [37.50, 14.00]
const SICILY_BOUNDS = {
  minLat: 35.35,
  maxLat: 38.85,
  minLng: 11.75,
  maxLng: 15.85,
}

// ── Sicilian provinces ─────────────────────────────────────────────
// Map common municipality keywords → province name (matches prov_name in sicilia-provinces.json).
// Sorted by length-desc at lookup time so multi-word matches win.
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
  "aci sant'antonio": 'Catania', 'aci sant\u2019antonio': 'Catania',
  'acicastello': 'Catania', 'linguaglossa': 'Catania',
  "motta sant'anastasia": 'Catania', 'motta sant\u2019anastasia': 'Catania',
  'motta sant anastasia': 'Catania', 'pedara': 'Catania',
  'san giovanni la punta': 'Catania', "sant'agata li battiati": 'Catania',
  'sant\u2019agata li battiati': 'Catania', 'trecastagni': 'Catania',
  'valverde': 'Catania', 'viagrande': 'Catania', 'zafferana etnea': 'Catania',
  // Messina
  'messina': 'Messina', 'taormina': 'Messina', 'milazzo': 'Messina',
  'patti': 'Messina', 'capo d\'orlando': 'Messina', "capo d'orlando": 'Messina',
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

// Runtime cache populated at fetch time from the location_cache Supabase table
// (and grown by background Nominatim fetches). Sits between the hardcoded
// CITY_COORDS dictionary and an HTTP fallback.
const RUNTIME_GEOCODE_CACHE = {}

function geocodeLocation(location) {
  if (!location) return null
  const lower = location.toLowerCase().trim()

  // 1. Runtime cache (exact match — entries here come from the DB / Nominatim)
  if (RUNTIME_GEOCODE_CACHE[lower]) return RUNTIME_GEOCODE_CACHE[lower]

  // 2. Hardcoded dictionary (substring match for fuzzy compound strings)
  const sortedKeys = Object.keys(CITY_COORDS)
    .filter(k => !k.startsWith(','))
    .sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (lower.includes(key)) return CITY_COORDS[key]
  }
  const codeKeys = Object.keys(CITY_COORDS).filter(k => k.startsWith(','))
  for (const key of codeKeys) {
    if (lower.includes(key)) return CITY_COORDS[key]
  }

  return null
}

// Resolve a batch of unmatched location strings: pull what's already in the
// shared Supabase cache, then for the rest hit Nominatim (1 req/s) and write
// back. Runs at fetch time; misses populate the cache for the next page load.
async function resolveLocationsViaCache(strings) {
  const unique = [...new Set(strings.map((s) => s.toLowerCase().trim()).filter(Boolean))]
  if (unique.length === 0) return

  const { data: cached, error } = await supabase
    .from('location_cache')
    .select('query, lat, lng')
    .in('query', unique)
  if (error) {
    console.warn('[Geocode] location_cache read failed:', error.message)
  } else {
    ;(cached || []).forEach((row) => {
      RUNTIME_GEOCODE_CACHE[row.query] = [row.lat, row.lng]
    })
  }

  const stillMissing = unique.filter((q) => !RUNTIME_GEOCODE_CACHE[q])
  if (stillMissing.length === 0) return

  // Background trickle so we don't block initial paint. Each resolved entry
  // is written back to Supabase so the next admin load hits the cache.
  ;(async () => {
    for (const q of stillMissing) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
        const res = await fetch(url)
        const data = await res.json()
        const hit = data?.[0]
        if (hit) {
          const lat = parseFloat(hit.lat)
          const lng = parseFloat(hit.lon)
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            RUNTIME_GEOCODE_CACHE[q] = [lat, lng]
            await supabase.from('location_cache').upsert(
              { query: q, lat, lng, source: 'nominatim' },
              { onConflict: 'query' },
            )
          }
        }
      } catch (e) {
        console.warn('[Nominatim] failed for', q, e?.message || e)
      }
      // Nominatim acceptable-use policy: max 1 req/s.
      await new Promise((r) => setTimeout(r, 1100))
    }
    console.log('[Geocode] Nominatim batch resolved', stillMissing.length, 'entries — refresh to see them rendered')
  })()
}

// ── Animated counter ───────────────────────────────────────────────
function animateCounter(element, target, duration = 2000, prefix = '', suffix = '') {
  const start = 0
  const startTime = performance.now()
  const isDecimal = target % 1 !== 0

  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = start + (target - start) * eased

    if (isDecimal) {
      element.textContent = prefix + current.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix
    } else {
      element.textContent = prefix + Math.floor(current).toLocaleString('it-IT') + suffix
    }

    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      if (isDecimal) {
        element.textContent = prefix + target.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix
      } else {
        element.textContent = prefix + target.toLocaleString('it-IT') + suffix
      }
    }
  }
  requestAnimationFrame(update)
}

// ── Data fetching ──────────────────────────────────────────────────
async function fetchShowcaseData() {
  const [
    { data: pionieri },
    { data: projects },
    { data: matches },
    { data: timeEntries },
    { data: skills },
    { data: pioniereSkills },
    { data: projectNeeds },
  ] = await Promise.all([
    supabase.from('pionieri').select('id, full_name, location, origin, created_at'),
    supabase.from('projects').select('id, name, type, status'),
    supabase.from('matches').select('id, status, created_at, pioniere_id, project_need_id'),
    supabase.from('time_entries').select('id, hours, date'),
    supabase.from('skills').select('id, name, category'),
    supabase.from('pioniere_skills').select('skill_id, pioniere_id'),
    supabase.from('project_needs').select('id, skill_id, urgency, status, project_id'),
  ])

  // Pre-warm the runtime geocode cache from the shared Supabase table for any
  // location/origin string the hardcoded dictionary doesn't already resolve.
  // Anything still missing is fired off to Nominatim in the background and
  // written back to the cache for the next page load.
  const allLocStrings = []
  ;(pionieri || []).forEach((p) => {
    if (p.location) allLocStrings.push(p.location)
    if (p.origin) allLocStrings.push(p.origin)
  })
  const unresolved = allLocStrings.filter((s) => !geocodeLocation(s))
  if (unresolved.length > 0) await resolveLocationsViaCache(unresolved)

  // Aggregate: location → count for globe
  const locationCounts = {}
  const unmatchedLocations = []
  ;(pionieri || []).forEach(p => {
    const loc = p.location || p.origin
    if (!loc) return
    const coords = geocodeLocation(loc)
    if (!coords) {
      unmatchedLocations.push(loc)
      return
    }
    const key = coords.join(',')
    locationCounts[key] = (locationCounts[key] || { coords, count: 0, name: loc })
    locationCounts[key].count++
  })
  if (unmatchedLocations.length > 0) {
    console.warn('[Showcase] Unmatched locations:', [...new Set(unmatchedLocations)].sort())
  }
  console.log('[Showcase] Geocoded locations:', Object.values(locationCounts).map(l => `${l.name} (${l.count})`).sort())

  // Total hours
  const totalHours = (timeEntries || []).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)

  // Monthly hours for chart
  const monthlyHours = {}
  ;(timeEntries || []).forEach(e => {
    const month = e.date?.substring(0, 7)
    if (month) monthlyHours[month] = (monthlyHours[month] || 0) + (parseFloat(e.hours) || 0)
  })

  // Skills by category + individual skill counts
  const skillCategoryCounts = {}
  const skillIdToInfo = {}
  ;(skills || []).forEach(s => {
    skillIdToInfo[s.id] = { name: s.name, category: s.category }
  })
  const skillCounts = {}  // skillId → count
  ;(pioniereSkills || []).forEach(ps => {
    const info = skillIdToInfo[ps.skill_id]
    if (!info) return
    skillCategoryCounts[info.category] = (skillCategoryCounts[info.category] || 0) + 1
    skillCounts[ps.skill_id] = (skillCounts[ps.skill_id] || 0) + 1
  })
  // Group skills by category with counts
  const skillsByCategory = {}
  ;(skills || []).forEach(s => {
    if (!s.category || !skillCounts[s.id]) return
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = []
    skillsByCategory[s.category].push({ name: s.name, count: skillCounts[s.id] })
  })
  // Sort skills within each category by count
  for (const cat of Object.keys(skillsByCategory)) {
    skillsByCategory[cat].sort((a, b) => b.count - a.count)
  }

  // Match status counts
  const matchStatusCounts = { proposed: 0, confirmed: 0, active: 0, completed: 0 }
  ;(matches || []).forEach(m => {
    if (matchStatusCounts[m.status] !== undefined) matchStatusCounts[m.status]++
  })

  // Distinct countries/cities count
  const distinctLocations = new Set()
  ;(pionieri || []).forEach(p => {
    const loc = p.location || p.origin
    if (loc) distinctLocations.add(loc.trim().toLowerCase())
  })

  const provinceCounts = Object.fromEntries(SICILY_PROVINCES.map((name) => [name, 0]))
  const pioniereIdToProvince = {}
  ;(pionieri || []).forEach((p) => {
    const province = detectSicilianProvince(p.origin || p.location || '')
    if (!province) return
    provinceCounts[province]++
    pioniereIdToProvince[p.id] = province
  })

  const provinceCategoryCounts = Object.fromEntries(SICILY_PROVINCES.map((name) => [name, {}]))
  ;(pioniereSkills || []).forEach((ps) => {
    const province = pioniereIdToProvince[ps.pioniere_id]
    if (!province) return
    const info = skillIdToInfo[ps.skill_id]
    if (!info?.category) return
    provinceCategoryCounts[province][info.category] =
      (provinceCategoryCounts[province][info.category] || 0) + 1
  })

  const provinceLocationMaps = Object.fromEntries(SICILY_PROVINCES.map((name) => [name, new Map()]))
  ;(pionieri || []).forEach((p) => {
    const province = pioniereIdToProvince[p.id]
    if (!province) return
    const rawLoc = (p.location || '').trim()
    if (!rawLoc) return
    const coords = geocodeLocation(rawLoc)
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

  // Active projects
  const activeProjects = (projects || []).filter(p => p.status === 'active').length

  return {
    pionieri: pionieri || [],
    totalPionieri: (pionieri || []).length,
    totalHours,
    totalMatches: (matches || []).length,
    activeProjects,
    totalProjects: (projects || []).length,
    locationCounts,
    sicilyProvinces,
    monthlyHours,
    skillCategoryCounts,
    skillsByCategory,
    matchStatusCounts,
    distinctLocations: distinctLocations.size,
    needsFulfilled: (projectNeeds || []).filter(n => n.status === 'fulfilled').length,
    needsMatched: (projectNeeds || []).filter(n => n.status === 'matched').length,
    needsOpen: (projectNeeds || []).filter(n => n.status === 'open').length,
    totalNeeds: (projectNeeds || []).length,
    allNeeds: projectNeeds || [],
    matches: matches || [],
    skillIdToInfo,
  }
}

// ── Render ─────────────────────────────────────────────────────────
export function renderShowcase() {
  return `
    <div id="showcase-root" class="showcase-root">
      <!-- Footer backdrop -->
      <div class="showcase-bg">
        <svg class="showcase-wave showcase-wave-main" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,214C143,194,286,181,430,183C573,185,716,203,860,206C1003,209,1146,197,1290,184C1340,180,1390,177,1440,174L1440,320L0,320Z" fill="rgba(34, 68, 94, 0.7)"/>
        </svg>
        <svg class="showcase-wave showcase-wave-accent" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,236C121,229,243,223,365,226C486,229,608,241,730,240C851,239,973,225,1095,214C1216,203,1338,196,1440,198L1440,320L0,320Z" fill="rgba(0, 142, 176, 0.1)"/>
        </svg>
      </div>

      <!-- Header -->
      <header class="showcase-header">
        <div class="showcase-title-group">
          <img src="/brand_assets/logo/Fondazione_Marea_Logo_H_W.svg" alt="Fondazione Marea" class="showcase-logo" />
        </div>
        <a href="#/dashboard" class="showcase-back-btn">
          <span>Dashboard</span>
        </a>
      </header>

      <!-- Loading state -->
      <div id="showcase-loading" class="showcase-loading">
        <div class="showcase-spinner"></div>
        <p>Caricamento dati...</p>
      </div>

      <!-- Main content (hidden until loaded) -->
      <div id="showcase-content" class="showcase-content" style="display:none;">

        <!-- Hero headline -->
        <div class="showcase-headline">
          <h1>Una rete globale di<br><span class="showcase-highlight showcase-highlight-hero">Competenze per la Sicilia</span></h1>
          <p class="showcase-headline-sub">I Pionieri della diaspora siciliana donano il loro tempo e talento per generare impatto sociale sul territorio.</p>
        </div>

        <!-- Globe + stats section -->
        <section class="showcase-hero">
          <div class="showcase-globe-container">
            <canvas id="showcase-globe" width="900" height="900"></canvas>
            <div class="showcase-globe-glow"></div>
            <div class="showcase-globe-hint" aria-hidden="true">
              <span class="showcase-globe-hint-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 11.5V6.75a1.25 1.25 0 0 1 2.5 0v3.5"/>
                  <path d="M11 10.25v-5a1.25 1.25 0 0 1 2.5 0v5"/>
                  <path d="M13.5 10.5V6.75a1.25 1.25 0 0 1 2.5 0v5.75"/>
                  <path d="M16 11.5v-2a1.25 1.25 0 0 1 2.5 0v4.25c0 3.18-2.57 5.75-5.75 5.75h-1.4A5.85 5.85 0 0 1 6 16.83L4.7 13.9a1.18 1.18 0 0 1 2-1.24l1.8 2.24V11.5a1.25 1.25 0 0 1 2.5 0"/>
                </svg>
              </span>
              <span class="showcase-globe-hint-label">Trascina</span>
            </div>
          </div>

          <!-- Stat cards -->
          <div class="showcase-stats-grid">
            <div class="showcase-stat-card showcase-stat-delay-1">
              <div class="showcase-stat-value" id="stat-pionieri">0</div>
              <div class="showcase-stat-label">Pionieri</div>
              <div class="showcase-stat-sub" id="stat-locations">in 0 localit&agrave;</div>
            </div>

            <div class="showcase-stat-card showcase-stat-delay-2">
              <div class="showcase-stat-value" id="stat-hours">0</div>
              <div class="showcase-stat-label">Ore Donate</div>
              <div class="showcase-stat-sub">di volontariato</div>
            </div>

            <div class="showcase-stat-card showcase-stat-delay-3">
              <div class="showcase-stat-value" id="stat-matches">0</div>
              <div class="showcase-stat-label">Match</div>
              <div class="showcase-stat-sub">connessioni create</div>
            </div>

            <div class="showcase-stat-card showcase-stat-delay-4">
              <div class="showcase-stat-value" id="stat-projects">0</div>
              <div class="showcase-stat-label">Progetti attivi</div>
              <div class="showcase-stat-sub" id="stat-projects-sub">&nbsp;</div>
            </div>
          </div>
        </section>

        <!-- Wave divider -->
        <div class="showcase-wave-divider">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,40L60,53.3C120,67,240,93,360,96C480,99,600,79,720,66.7C840,53,960,47,1080,53.3C1200,60,1320,80,1380,90L1440,100L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" fill="rgba(0,142,176,0.08)"/>
          </svg>
        </div>

        <!-- Charts section -->
        <section class="showcase-charts-section">
          <h2 class="showcase-section-title">IL NOSTRO <span class="showcase-highlight showcase-highlight-section">IMPATTO</span></h2>

          <div class="showcase-sicily-section">
            <div class="showcase-sicily-header">
              <div>
                <h3 class="showcase-chart-title">Da dove partono i Pionieri</h3>
                <p class="showcase-chart-desc">Distribuzione dei Pionieri per provincia siciliana. Passa su una provincia per vederne il dettaglio.</p>
              </div>
            </div>
            <div class="showcase-sicily-panel">
              <div class="showcase-sicily-map-wrap">
                <div class="showcase-sicily-map-bg"></div>
                <div id="showcase-sicily-map" class="showcase-sicily-map" aria-label="Mappa delle province di Sicilia"></div>
                <div class="showcase-sicily-legend" id="showcase-sicily-legend" aria-hidden="true">
                  <span class="showcase-sicily-legend-label">0</span>
                  <div class="showcase-sicily-legend-bar"></div>
                  <span class="showcase-sicily-legend-label" id="showcase-sicily-legend-max">—</span>
                </div>
              </div>
              <div class="showcase-sicily-detail" id="showcase-sicily-detail">
                <div class="showcase-sicily-detail-kicker">Provincia in evidenza</div>
                <div class="showcase-sicily-detail-name" id="showcase-sicily-detail-name">Caricamento...</div>
                <div class="showcase-sicily-detail-count" id="showcase-sicily-detail-count"></div>
                <p class="showcase-sicily-detail-copy" id="showcase-sicily-detail-copy"></p>
                <div class="showcase-sicily-detail-skills">
                  <div class="showcase-sicily-detail-skills-label">Composizione competenze</div>
                  <div class="showcase-sicily-skills-bar" id="showcase-sicily-skills-bar"></div>
                  <div class="showcase-sicily-skills-legend" id="showcase-sicily-skills-legend"></div>
                </div>
                <div class="showcase-sicily-detail-world">
                  <div class="showcase-sicily-detail-skills-label">Diffusione nel mondo</div>
                  <div class="showcase-sicily-world-wrap">
                    <div id="showcase-sicily-world-map" class="showcase-sicily-world-map" aria-label="Distribuzione globale dei Pionieri"></div>
                  </div>
                  <div class="showcase-sicily-world-caption" id="showcase-sicily-world-caption">—</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills bubbles — full width -->
          <div class="showcase-bubbles-section">
            <div class="showcase-bubbles-header">
              <h3 class="showcase-chart-title">Competenze della Rete</h3>
              <p class="showcase-chart-desc">Clicca su una categoria per esplorare le competenze</p>
              <button id="showcase-bubbles-back" class="showcase-bubbles-back" style="display:none;">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Tutte le categorie
              </button>
            </div>
            <div class="showcase-skills-bubbles" id="showcase-skills-bubbles"></div>
          </div>

          <!-- Match flow visualization -->
          <div class="showcase-match-section">
            <div class="showcase-needs-header">
              <h3 class="showcase-chart-title">La Rete in Azione</h3>
              <p class="showcase-chart-desc">I Pionieri si connettono ai bisogni dei progetti &mdash; ogni linea &egrave; un match attivo</p>
            </div>

            <div class="showcase-match-flow" id="showcase-match-flow">
              <!-- SVG spans the whole flow area so lines can reach dots in any column -->
              <svg id="showcase-match-svg" class="showcase-match-svg"></svg>

              <div class="showcase-match-column showcase-match-pionieri">
                <div class="showcase-match-col-title">Pionieri</div>
                <div class="showcase-match-col-dots" id="showcase-match-pionieri-dots"></div>
              </div>

              <div class="showcase-match-middle"></div>

              <div class="showcase-match-column showcase-match-needs">
                <div class="showcase-match-col-title">Bisogni dei Progetti</div>
                <div class="showcase-match-col-dots" id="showcase-match-needs-dots"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="showcase-footer">
          <p>Fondazione Marea &mdash; Costruiamo una Sicilia in cui vale la pena restare, tornare, approdare.</p>
        </footer>
      </div>
    </div>
  `
}

// ── Init ───────────────────────────────────────────────────────────
let globeInstance = null
let sicilyMapInstance = null
let worldMapInstance = null
let chartsInstances = []
let showcaseDeferredObservers = []
let showcaseDeferredInit = {
  sicilyOrigins: false,
  bubbles: false,
  matchFlow: false,
}

function initShowcaseDeferredSections(data) {
  showcaseDeferredObservers.forEach(observer => observer.disconnect())
  showcaseDeferredObservers = []

  // On mobile, the observer-triggered reveal feels abrupt (Sicily map and match
  // flow pop in with no entrance animation). Init eagerly so they're already
  // rendered by the time the user scrolls down.
  const isMobile = window.matchMedia('(max-width: 768px)').matches

  const observeOnce = (selector, key, init) => {
    const el = document.querySelector(selector)
    if (!el || showcaseDeferredInit[key]) return

    if (isMobile) {
      showcaseDeferredInit[key] = true
      init()
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || showcaseDeferredInit[key]) return
        showcaseDeferredInit[key] = true
        init()
        observer.disconnect()
        showcaseDeferredObservers = showcaseDeferredObservers.filter(item => item !== observer)
      })
    }, {
      threshold: 0.22,
      rootMargin: '0px 0px -8% 0px',
    })

    observer.observe(el)
    showcaseDeferredObservers.push(observer)
  }

  observeOnce('.showcase-sicily-section', 'sicilyOrigins', () => initSicilyOriginsViz(data))
  observeOnce('.showcase-bubbles-section', 'bubbles', () => initSkillBubbles(data))
  observeOnce('.showcase-match-section', 'matchFlow', () => initMatchFlow(data))
}

export async function initShowcase() {
  const data = await fetchShowcaseData()

  // Hide loading, show content
  const loading = document.getElementById('showcase-loading')
  const content = document.getElementById('showcase-content')
  if (loading) loading.style.display = 'none'
  if (content) content.style.display = ''
  showcaseDeferredInit = {
    sicilyOrigins: false,
    bubbles: false,
    matchFlow: false,
  }

  // Animate counters with staggered delay
  setTimeout(() => {
    const el = document.getElementById('stat-pionieri')
    if (el) animateCounter(el, data.totalPionieri, 2000)
    const locEl = document.getElementById('stat-locations')
    if (locEl) locEl.innerHTML = `in <strong>${data.distinctLocations}</strong> localit&agrave;`
  }, 300)

  setTimeout(() => {
    const el = document.getElementById('stat-hours')
    if (el) animateCounter(el, data.totalHours, 2500)
  }, 500)

  setTimeout(() => {
    const el = document.getElementById('stat-matches')
    if (el) animateCounter(el, data.totalMatches, 2000)
  }, 700)

  setTimeout(() => {
    const el = document.getElementById('stat-projects')
    if (el) animateCounter(el, data.activeProjects, 1500)
    const sub = document.getElementById('stat-projects-sub')
    if (sub) sub.textContent = `di ${data.totalProjects} totali`
  }, 900)

  // Init globe
  initGlobe(data)
  // Init lower sections only when they scroll into view.
  requestAnimationFrame(() => initShowcaseDeferredSections(data))
}

function initGlobe(data) {
  const canvas = document.getElementById('showcase-globe')
  if (!canvas) return

  const locationEntries = Object.values(data.locationCounts)
    .filter(loc => {
      const dist = Math.abs(loc.coords[0] - SICILY[0]) + Math.abs(loc.coords[1] - SICILY[1])
      return dist > 5
    })
    // Sort by distance from Sicily — closest first
    .sort((a, b) => {
      const distA = Math.hypot(a.coords[0] - SICILY[0], a.coords[1] - SICILY[1])
      const distB = Math.hypot(b.coords[0] - SICILY[0], b.coords[1] - SICILY[1])
      return distA - distB
    })

  // Diaspora markers
  const markers = locationEntries.map(loc => ({
    location: [loc.coords[0], loc.coords[1]],
    size: 0.018,
  }))

  const SICILY_MARKER_SIZE = 0.048

  // Use requestAnimationFrame to ensure DOM has reflowed and container has size
  requestAnimationFrame(() => {
    let width = canvas.parentElement?.offsetWidth || 600

    const onResize = () => {
      width = canvas.parentElement?.offsetWidth || 600
    }
    window.addEventListener('resize', onResize)

    // Start slightly west of Sicily so the European cluster stays in view longer.
    // cobe's phi convention: centered longitude L needs phi = -L·π/180 - π/2
    const START_LON = SICILY[1] - 10
    const SICILY_PHI = -START_LON * Math.PI / 180 - Math.PI / 2
    let phi = SICILY_PHI
    let pointerInteracting = false
    let pointerStart = [0, 0]
    let animFrameId = null
    const startTime = performance.now()
    let lastFrameAt = startTime
    const sicilyRevealAt = 300      // ms — Sicily appears first
    const firstDotAt = 720          // ms — diaspora dots start
    const revealEndAt = 2900        // ms — last dot done appearing
    const growMs = 430              // ms — pop-in duration per marker
    const autoRotateSpeed = 0.000085 // rad/ms ≈ 4.9 deg/sec

    // cobe v2 API: createGlobe returns { update, destroy }
    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: width * 2,
      height: width * 2,
      phi: phi,
      theta: 0.28,
      dark: 1,
      diffuse: 3,
      mapSamples: 24000,
      mapBrightness: 8,
      baseColor: [0.12, 0.22, 0.32],
      markerColor: [0.96, 0.83, 0.42],
      glowColor: [0, 0.56, 0.69],
      markers: [],
      arcs: [],
      arcColor: [0.96, 0.83, 0.42],
      arcWidth: 0.3,
      arcHeight: 0.05,
      scale: 1.15,
    })

    // Stagger diaspora dots closest-first across the reveal window
    const spanN = Math.max(markers.length - 1, 1)
    const spawnTimes = markers.map((_, i) => firstDotAt + (i / spanN) * (revealEndAt - firstDotAt))

    // Per-dot breathing parameters (varied periods + phases → not in unison)
    const breathe = markers.map((_, i) => ({
      period: 2600 + ((i * 131) % 1400),   // 2.6s – 4.0s (quicker)
      phase: ((i * 1.618) % 1) * Math.PI * 2,
      amp: 0.38,
    }))

    // World dots render as a gold shell with a soft white center.
    const DOT_OUTER_COLOR = [0.96, 0.83, 0.42]
    const DOT_INNER_COLOR = [1, 0.99, 0.94]
    const DOT_INNER_SCALE = 0.45
    const SICILY_GLOW_COLOR = [1, 0.78, 0.28]
    const SICILY_OUTER_COLOR = [1, 0.9, 0.56]
    const SICILY_INNER_COLOR = [1, 1, 1]
    const SICILY_GLOW_SCALE = 1.9
    const SICILY_INNER_SCALE = 0.58

    // Occasional "blip": random dot briefly doubles in size — makes them feel alive
    const activeBlips = [] // { idx, start }
    const blipDuration = 450

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
    function animate() {
      const now = performance.now()
      const elapsed = now - startTime
      const deltaMs = now - lastFrameAt
      lastFrameAt = now
      const liveMarkers = []

      // Sicily anchor — steady "heart" breath, slower than the dots
      if (elapsed >= sicilyRevealAt) {
        const p = Math.min((elapsed - sicilyRevealAt) / growMs, 1)
        const grow = easeOutCubic(p)
        const sicilyBreath = 1 + 0.22 * Math.sin(elapsed / 4600 * Math.PI * 2)
        const size = SICILY_MARKER_SIZE * grow * (p >= 1 ? sicilyBreath : 1)
        liveMarkers.push({
          location: [SICILY[0], SICILY[1]],
          size: size * SICILY_GLOW_SCALE,
          color: SICILY_GLOW_COLOR,
        })
        liveMarkers.push({
          location: [SICILY[0], SICILY[1]],
          size,
          color: SICILY_OUTER_COLOR,
        })
        liveMarkers.push({
          location: [SICILY[0], SICILY[1]],
          size: size * SICILY_INNER_SCALE,
          color: SICILY_INNER_COLOR,
        })
      }

      // Spawn new blips — ~2/sec spread randomly across revealed dots
      const revealedCount = markers.reduce((n, _, i) => n + (elapsed >= spawnTimes[i] ? 1 : 0), 0)
      if (revealedCount > 0 && Math.random() < 0.035) {
        activeBlips.push({ idx: Math.floor(Math.random() * revealedCount), start: elapsed })
      }
      // Drop expired
      for (let bi = activeBlips.length - 1; bi >= 0; bi--) {
        if (elapsed - activeBlips[bi].start > blipDuration) activeBlips.splice(bi, 1)
      }

      // Diaspora dots: grow in, then continuously breathe (phased per-dot)
      for (let i = 0; i < markers.length; i++) {
        if (elapsed < spawnTimes[i]) break
        const sinceSpawn = elapsed - spawnTimes[i]
        const grow = easeOutCubic(Math.min(sinceSpawn / growMs, 1))
        const { period, phase, amp } = breathe[i]
        const b = grow >= 1 ? (1 + amp * Math.sin(elapsed / period * Math.PI * 2 + phase)) : 1
        // Blip: +80% size via sin curve over the blip window
        let blipBoost = 1
        for (const bl of activeBlips) {
          if (bl.idx === i) {
            const t = (elapsed - bl.start) / blipDuration
            blipBoost = Math.max(blipBoost, 1 + 0.8 * Math.sin(Math.PI * t))
          }
        }
        const size = markers[i].size * grow * b * blipBoost
        liveMarkers.push({
          location: markers[i].location,
          size,
          color: DOT_OUTER_COLOR,
        })
        liveMarkers.push({
          location: markers[i].location,
          size: size * DOT_INNER_SCALE,
          color: DOT_INNER_COLOR,
        })
      }

      if (!pointerInteracting) {
        phi -= deltaMs * autoRotateSpeed
      }

      globe.update({
        phi,
        width: width * 2,
        height: width * 2,
        arcs: [],
        markers: liveMarkers,
      })

      animFrameId = requestAnimationFrame(animate)
    }
    animate()

    // Store destroy so we can clean up the animation loop too
    globeInstance = {
      destroy() {
        if (animFrameId) cancelAnimationFrame(animFrameId)
        globe.destroy()
        window.removeEventListener('resize', onResize)
      }
    }

    // Touch devices: globe is decorative — no drag, no grab cursor, and the
    // "Trascina" hint is hidden by the mobile media query in main.css.
    const isTouch = window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth < 768
    if (!isTouch) {
      canvas.addEventListener('pointerdown', (e) => {
        pointerInteracting = true
        pointerStart = [e.clientX, e.clientY]
        canvas.style.cursor = 'grabbing'
      })

      canvas.addEventListener('pointermove', (e) => {
        if (pointerInteracting) {
          const dx = e.clientX - pointerStart[0]
          pointerStart = [e.clientX, e.clientY]
          phi += dx * 0.005
        }
      })

      const stopDrag = () => {
        pointerInteracting = false
        canvas.style.cursor = 'grab'
      }
      canvas.addEventListener('pointerup', stopDrag)
      canvas.addEventListener('pointerleave', stopDrag)

      canvas.style.cursor = 'grab'
    } else {
      canvas.style.touchAction = 'pan-y'
    }
  })
}

// ── Bubble packing helper ──────────────────────────────────────
function packBubbles(bubbles, containerW, containerH, padding) {
  if (padding === undefined) padding = Math.min(containerW, containerH) < 360 ? 4 : 8
  const placed = []
  const cx = containerW / 2
  const cy = containerH / 2

  const trySpiral = (r) => {
    for (let dist = 0; dist < Math.max(containerW, containerH); dist += 1) {
      const angleStep = Math.max(0.05, 0.3 / (1 + dist * 0.02))
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const x = cx + dist * Math.cos(angle + dist * 0.08)
        const y = cy + dist * Math.sin(angle + dist * 0.08)
        if (x - r < padding || x + r > containerW - padding) continue
        if (y - r < padding || y + r > containerH - padding) continue
        let overlaps = false
        for (const p of placed) {
          if (Math.hypot(x - p.x, y - p.y) < r + p.r + padding) { overlaps = true; break }
        }
        if (!overlaps) return { x, y }
      }
    }
    return null
  }

  for (const bubble of bubbles) {
    // Shrink up to 40% if no spot fits at the requested radius — anything
    // beats stacking on top of a placed bubble at the center.
    let r = bubble.r
    let spot = null
    for (let i = 0; i < 6; i++) {
      spot = trySpiral(r)
      if (spot) break
      r *= 0.9
    }
    if (!spot) spot = { x: cx, y: cy }
    placed.push({ ...bubble, x: spot.x, y: spot.y, r })
  }
  return placed
}

// ── Category icons (inline SVG, 24x24) ───────────────────────
const CATEGORY_ICONS = {
  'Strategia & Leadership': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>',
  'Business & Mercato': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>',
  'Comunicazione & Media': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>',
  'Finanza': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  'Legale': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/></svg>',
  'Tecnologia': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>',
  'Organizzazione': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>',
  'Consulenza': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>',
  'Design & Creativit\u00e0': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>',
  'Impatto & Fondazione': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>',
  'Formazione & Ricerca': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15v-3.75m0 0h10.5"/></svg>',
  'Policy & Istituzioni': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/></svg>',
  'Settoriale': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525"/></svg>',
}

// Fallback icon
const DEFAULT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>'

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON
}

// ── Skill bubbles with drill-down ─────────────────────────────
function initSkillBubbles(data) {
  const container = document.getElementById('showcase-skills-bubbles')
  const backBtn = document.getElementById('showcase-bubbles-back')
  if (!container) return

  const COLORS = [
    'rgba(0, 142, 176, 0.5)',
    'rgba(0, 160, 180, 0.45)',
    'rgba(20, 170, 165, 0.42)',
    'rgba(50, 175, 150, 0.4)',
    'rgba(80, 180, 135, 0.38)',
    'rgba(120, 185, 120, 0.36)',
    'rgba(160, 195, 110, 0.35)',
    'rgba(200, 205, 95, 0.35)',
    'rgba(230, 210, 85, 0.35)',
    'rgba(247, 211, 107, 0.4)',
    'rgba(240, 195, 85, 0.38)',
    'rgba(220, 185, 95, 0.36)',
    'rgba(180, 175, 110, 0.35)',
  ]

  function sizeBubbles(items, containerW, containerH, minR) {
    const containerArea = containerW * containerH
    const maxCount = items[0]?.value || 1
    const n = items.length
    const rawAreas = items.map(it => Math.pow(it.value / maxCount, 0.6))
    const totalRaw = rawAreas.reduce((s, a) => s + a, 0)
    // Cap minR so it can't exceed available room (32px floor on a 320px
    // container forced every bubble to minR and the packer overlapped).
    const sizeBased = Math.min(containerW, containerH) / 7
    const countBased = Math.sqrt(containerArea / (n * 6))
    const minCeiling = Math.min(sizeBased, countBased)
    const effectiveMinR = Math.min(minR, minCeiling)
    // Cap maxR so two same-size top bubbles can sit beside each other.
    // Otherwise the packer can stack same-rank bubbles at the center.
    const maxR = Math.min(containerW, containerH) / 4.5
    const fillRatio = n > 12 ? 0.32 : n > 8 ? 0.36 : 0.4
    const targetArea = containerArea * fillRatio
    return rawAreas.map(raw => {
      const area = (raw / totalRaw) * targetArea
      const r = Math.sqrt(area / Math.PI)
      return Math.max(effectiveMinR, Math.min(maxR, r))
    })
  }

  function renderCategories() {
    const containerW = container.offsetWidth
    const containerH = container.offsetHeight
    if (!containerW || !containerH) return

    container.innerHTML = ''
    if (backBtn) backBtn.style.display = 'none'

    const sorted = Object.entries(data.skillCategoryCounts).sort((a, b) => b[1] - a[1])
    const items = sorted.map(([cat, count]) => ({ cat, value: count }))
    const radii = sizeBubbles(items, containerW, containerH, 32)

    const bubbles = sorted.map(([cat, count], i) => ({
      cat, count,
      r: radii[i],
      color: COLORS[i % COLORS.length],
    }))

    const placed = packBubbles(bubbles, containerW, containerH)

    placed.forEach((b, i) => {
      const el = document.createElement('div')
      el.className = 'showcase-bubble showcase-bubble-category'
      el.style.cssText = `
        left:${b.x - b.r}px; top:${b.y - b.r}px;
        width:${b.r * 2}px; height:${b.r * 2}px;
        background:${b.color};
        animation-delay:${0.3 + i * 0.06}s;
      `
      const icon = getCategoryIcon(b.cat)
      el.innerHTML = `<div class="showcase-bubble-label">
        <span class="showcase-bubble-icon">${icon}</span>
        ${b.cat}
        <span class="showcase-bubble-count">${b.count}</span>
      </div>`
      el.addEventListener('click', () => renderSkillsInCategory(b.cat, b.color))
      container.appendChild(el)
    })
  }

  function renderSkillsInCategory(category, parentColor) {
    const all = data.skillsByCategory[category]
    if (!all || all.length === 0) return

    const containerW = container.offsetWidth
    const containerH = container.offsetHeight
    container.innerHTML = ''
    if (backBtn) backBtn.style.display = ''

    // Cap to top N — beyond ~16 the bubbles are too small to read and the
    // packer struggles to fit them.
    const cap = containerW < 520 ? 12 : 18
    const skills = all.slice(0, cap)

    const items = skills.map(s => ({ cat: s.name, value: s.count }))
    const minR = containerW < 520 ? 22 : 28
    const radii = sizeBubbles(items, containerW, containerH, minR)

    const bubbles = skills.map((skill, i) => ({
      cat: skill.name, count: skill.count,
      r: radii[i],
      color: parentColor.replace('0.5', '0.45').replace('0.4', '0.38'),
    }))

    const placed = packBubbles(bubbles, containerW, containerH)

    placed.forEach((b, i) => {
      const el = document.createElement('div')
      el.className = 'showcase-bubble showcase-bubble-skill'
      el.style.cssText = `
        left:${b.x - b.r}px; top:${b.y - b.r}px;
        width:${b.r * 2}px; height:${b.r * 2}px;
        background:${b.color};
        animation-delay:${i * 0.04}s;
      `
      el.innerHTML = `<div class="showcase-bubble-label">
        ${b.cat}
        <span class="showcase-bubble-count">${b.count}</span>
      </div>`
      container.appendChild(el)
    })
  }

  renderCategories()

  if (backBtn) {
    backBtn.addEventListener('click', renderCategories)
  }
}

function initCharts(data) {
  chartsInstances.forEach(c => c.destroy())
  chartsInstances = []
}

const PROV_RAMP = [
  [13, 56, 80],     // 0.0 — deep navy-teal
  [0, 142, 176],    // 0.5 — marea teal
  [150, 225, 240],  // 1.0 — bright cyan
]

// Distinct cool-spectrum palette for category segments. Up to 4 named slots
// plus a neutral "altri" so the stacked bar stays readable.
const CATEGORY_PALETTE = ['#7ee9ff', '#3fb8de', '#1f7fb0', '#0d4860']
const CATEGORY_REST_COLOR = 'rgba(255, 255, 255, 0.16)'
function provinceFill(count, max) {
  if (count === 0) return 'rgba(20, 50, 64, 0.55)'
  const t = max > 0 ? Math.min(count / max, 1) : 0
  const seg = t < 0.5
    ? PROV_RAMP[0].map((v, i) => v + (PROV_RAMP[1][i] - v) * (t * 2))
    : PROV_RAMP[1].map((v, i) => v + (PROV_RAMP[2][i] - v) * ((t - 0.5) * 2))
  return `rgb(${Math.round(seg[0])}, ${Math.round(seg[1])}, ${Math.round(seg[2])})`
}

function initSicilyOriginsViz(data) {
  const mapEl = document.getElementById('showcase-sicily-map')
  const detailName = document.getElementById('showcase-sicily-detail-name')
  const detailCount = document.getElementById('showcase-sicily-detail-count')
  const detailCopy = document.getElementById('showcase-sicily-detail-copy')
  const skillsBarEl = document.getElementById('showcase-sicily-skills-bar')
  const skillsLegendEl = document.getElementById('showcase-sicily-skills-legend')
  const worldMapEl = document.getElementById('showcase-sicily-world-map')
  const worldCaptionEl = document.getElementById('showcase-sicily-world-caption')
  const legendMaxEl = document.getElementById('showcase-sicily-legend-max')
  const sectionDescEl = document.querySelector('.showcase-sicily-section .showcase-chart-desc')
  if (!mapEl || !detailName || !detailCount || !detailCopy || !skillsBarEl || !skillsLegendEl || !worldMapEl) return

  const supportsHover = window.matchMedia('(hover: hover)').matches
  if (sectionDescEl) {
    sectionDescEl.textContent = supportsHover
      ? 'Distribuzione dei Pionieri per provincia siciliana. Passa su una provincia per vederne il dettaglio.'
      : 'Distribuzione dei Pionieri per provincia siciliana. Tocca una provincia per vederne il dettaglio.'
  }

  if (sicilyMapInstance?.__onResize) window.removeEventListener('resize', sicilyMapInstance.__onResize)
  sicilyMapInstance?.remove()
  sicilyMapInstance = L.map(mapEl, {
    attributionControl: false,
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    minZoom: 6,
    maxZoom: 10,
    center: [37.6, 14.05],
    zoom: 8,
  })
  const map = sicilyMapInstance

  const provinces = data.sicilyProvinces || []
  const countByName = Object.fromEntries(provinces.map((p) => [p.name, p.count]))
  const breakdownByName = Object.fromEntries(provinces.map((p) => [p.name, p.categoryBreakdown || []]))
  const locationsByName = Object.fromEntries(provinces.map((p) => [p.name, p.locations || []]))
  const totalPionieri = provinces.reduce((s, p) => s + p.count, 0)
  const maxCount = Math.max(1, ...provinces.map((p) => p.count))
  if (legendMaxEl) legendMaxEl.textContent = String(maxCount)

  worldMapInstance?.remove()
  worldMapInstance = L.map(worldMapEl, {
    attributionControl: false,
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    worldCopyJump: false,
    minZoom: 1,
    maxZoom: 4,
    center: [25, 10],
    zoom: 1,
    // 177 country polygons paint much faster on canvas than via SVG paths.
    preferCanvas: true,
  })
  const worldMap = worldMapInstance
  L.geoJSON(worldCountriesGeoJson, {
    style: () => ({
      color: 'rgba(255, 255, 255, 0.06)',
      weight: 0.6,
      fillColor: '#15384a',
      fillOpacity: 0.85,
    }),
    interactive: false,
  }).addTo(worldMap)
  const worldMarkersLayer = L.layerGroup().addTo(worldMap)

  const layersByName = {}
  let activeName = null

  const baseStyle = (count) => ({
    color: 'rgba(255, 255, 255, 0.18)',
    weight: 1.2,
    fillColor: provinceFill(count, maxCount),
    fillOpacity: 0.88,
  })
  const activeStyle = (count) => ({
    color: 'rgba(255, 255, 255, 0.85)',
    weight: 2.2,
    fillColor: provinceFill(count, maxCount),
    fillOpacity: 0.96,
  })

  let defaultCaption = ''
  const renderWorldMarkers = (locations) => {
    worldMarkersLayer.clearLayers()
    if (!locations.length) return
    // Smaller markers on narrow viewports so a single dot doesn't dominate.
    const isCompact = mapEl.clientWidth < 520
    const maxLocCount = Math.max(...locations.map((l) => l.count))
    locations.forEach((loc) => {
      const baseRadius = isCompact ? 2 : 3
      const span = isCompact ? 4 : 7
      const radius = baseRadius + (loc.count / maxLocCount) * span
      const marker = L.circleMarker(loc.coords, {
        radius,
        color: 'rgba(255, 255, 255, 0.85)',
        weight: 1,
        fillColor: '#7ee9ff',
        fillOpacity: 0.85,
      }).addTo(worldMarkersLayer)
      const summary = `${loc.label} · ${loc.count} ${loc.count === 1 ? 'Pioniere' : 'Pionieri'}`
      if (supportsHover) {
        marker.on('mouseover', () => { if (worldCaptionEl) worldCaptionEl.textContent = summary })
        marker.on('mouseout', () => { if (worldCaptionEl) worldCaptionEl.textContent = defaultCaption })
      } else {
        // Touch: tap latches the caption; tapping elsewhere on the world map resets it.
        marker.on('click', (e) => {
          if (worldCaptionEl) worldCaptionEl.textContent = summary
          L.DomEvent.stopPropagation(e)
        })
      }
    })
    if (!supportsHover) {
      worldMap.off('click').on('click', () => {
        if (worldCaptionEl) worldCaptionEl.textContent = defaultCaption
      })
    }
  }

  const setActiveProvince = (name, { fly = false } = {}) => {
    if (activeName && layersByName[activeName] && activeName !== name) {
      const prev = layersByName[activeName]
      prev.setStyle(baseStyle(countByName[activeName]))
      if (supportsHover) prev.closeTooltip()
    }
    activeName = name
    const layer = layersByName[name]
    if (!layer) return
    layer.setStyle(activeStyle(countByName[name]))
    layer.bringToFront()
    if (supportsHover) layer.openTooltip()

    const count = countByName[name] || 0
    detailName.textContent = name
    detailCount.textContent = `${count} ${count === 1 ? 'Pioniere' : 'Pionieri'}`
    const share = totalPionieri > 0 ? Math.round((count / totalPionieri) * 100) : 0
    detailCopy.textContent = count === 0
      ? 'Nessun Pioniere mappato in questa provincia. È un\'opportunità per fare rete.'
      : `${share}% della rete siciliana parte da questa provincia.`

    const allCats = breakdownByName[name] || []
    const totalTags = allCats.reduce((s, c) => s + c.count, 0)
    if (totalTags === 0) {
      skillsBarEl.innerHTML = '<div class="showcase-sicily-skills-bar-empty"></div>'
      skillsLegendEl.innerHTML = '<span class="showcase-sicily-skill-empty">Nessuna competenza registrata.</span>'
    } else {
      const top = allCats.slice(0, 4)
      const restCount = allCats.slice(4).reduce((s, c) => s + c.count, 0)
      const segments = restCount > 0
        ? [...top.map((c, i) => ({ ...c, color: CATEGORY_PALETTE[i] })),
           { category: 'Altri', count: restCount, color: CATEGORY_REST_COLOR }]
        : top.map((c, i) => ({ ...c, color: CATEGORY_PALETTE[i] }))

      skillsBarEl.innerHTML = segments.map((s) => {
        const pct = (s.count / totalTags) * 100
        return `<span class="showcase-sicily-skills-bar-seg" style="width:${pct}%; background:${s.color}" title="${s.category} · ${s.count} (${Math.round(pct)}%)"></span>`
      }).join('')

      skillsLegendEl.innerHTML = top.map((c, i) => {
        const pct = Math.round((c.count / totalTags) * 100)
        return `
          <div class="showcase-sicily-skill-row">
            <span class="showcase-sicily-skill-icon" style="color:${CATEGORY_PALETTE[i]}">${getCategoryIcon(c.category)}</span>
            <span class="showcase-sicily-skill-name">${c.category}</span>
            <span class="showcase-sicily-skill-share">${pct}%</span>
            <span class="showcase-sicily-skill-count">${c.count}</span>
          </div>
        `
      }).join('')
    }

    const locations = locationsByName[name] || []
    const placedCount = locations.reduce((s, l) => s + l.count, 0)
    const placeWord = locations.length === 1 ? 'luogo' : 'luoghi'
    defaultCaption = locations.length === 0
      ? 'Nessuna posizione attuale registrata.'
      : `${placedCount} ${placedCount === 1 ? 'Pioniere' : 'Pionieri'} in ${locations.length} ${placeWord}.`
    if (worldCaptionEl) worldCaptionEl.textContent = defaultCaption
    renderWorldMarkers(locations)

    // Skip flyTo on small viewports — the static fit already shows everything
    // and zooming on a 300px-tall map disorients more than it helps.
    if (fly && window.innerWidth >= 768) {
      const center = layer.getBounds().getCenter()
      map.flyTo(center, Math.max(map.getZoom(), 7.5), { duration: 0.55 })
    }
  }

  L.geoJSON(sicilyProvincesGeoJson, {
    style: (feature) => baseStyle(countByName[feature.properties.prov_name] || 0),
    onEachFeature: (feature, layer) => {
      const name = feature.properties.prov_name
      layersByName[name] = layer
      const count = countByName[name] || 0
      if (supportsHover) {
        layer.bindTooltip(`${name} · ${count}`, {
          direction: 'top',
          sticky: true,
          opacity: 1,
          className: 'showcase-sicily-tooltip',
        })
        layer.on('mouseover', () => setActiveProvince(name))
      }
      layer.on('click', () => setActiveProvince(name, { fly: true }))
    },
  }).addTo(map)

  // Frame mainland Sicily — fitBounds reads the container's cached size, so
  // invalidateSize() must run first when this initializes inside a panel that
  // wasn't laid out yet (lazy IntersectionObserver init).
  const mainlandBounds = L.latLngBounds([36.62, 12.38], [38.32, 15.7])
  map.invalidateSize()
  map.fitBounds(mainlandBounds, { padding: [6, 6] })
  map.setMaxBounds(mainlandBounds.pad(0.05))

  worldMap.invalidateSize()
  const worldBounds = L.latLngBounds([-55, -160], [70, 175])
  worldMap.fitBounds(worldBounds, { padding: [4, 4] })

  // Re-fit both maps on viewport changes (orientation, resize). Coalesced via
  // rAF so a burst of resize events doesn't thrash Leaflet.
  let resizeFrame = 0
  const onResize = () => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      map.invalidateSize()
      map.fitBounds(mainlandBounds, { padding: [6, 6] })
      worldMap.invalidateSize()
      worldMap.fitBounds(worldBounds, { padding: [4, 4] })
      if (activeName) renderWorldMarkers(locationsByName[activeName] || [])
    })
  }
  window.addEventListener('resize', onResize)
  sicilyMapInstance.__onResize = onResize

  const defaultName = (provinces.find((p) => p.count > 0) || provinces[0])?.name
  if (defaultName) setActiveProvince(defaultName)
}

function initMatchFlow(data) {
  const flow = document.getElementById('showcase-match-flow')
  const needsDotsEl = document.getElementById('showcase-match-needs-dots')
  const pioneriDotsEl = document.getElementById('showcase-match-pionieri-dots')
  const svg = document.getElementById('showcase-match-svg')
  const counterEl = document.getElementById('showcase-match-counter-value')
  if (!flow || !svg) return

  // Gradient: teal (pioniere, left) → gold (need, right)
  svg.innerHTML = `
    <defs>
      <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00aec9" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#f7d36b" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="matchGradientCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fde68a" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#f7d36b" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
  `

  const matches = (data.matches || []).filter(m => m.pioniere_id && m.project_need_id)
  const allNeeds = data.allNeeds || []
  const allPionieri = data.pionieri || []
  const skillIdToInfo = data.skillIdToInfo || {}
  const needIdToCategory = {}
  allNeeds.forEach((n) => {
    const info = skillIdToInfo[n.skill_id]
    if (info?.category) needIdToCategory[n.id] = info.category
  })

  // Drop a small chip with the category icon at the midpoint of a connection.
  // Reuses the existing CATEGORY_ICONS SVGs by pulling out their <path d>.
  const ICON_CHIP_R = 11
  const iconPathCache = {}
  function appendIconChip(parent, midX, midY, category) {
    if (!category) return
    let pathD = iconPathCache[category]
    if (pathD === undefined) {
      const raw = getCategoryIcon(category)
      const m = raw.match(/<path[^>]*d="([^"]+)"/)
      pathD = m ? m[1] : null
      iconPathCache[category] = pathD
    }
    if (!pathD) return
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('class', 'showcase-match-icon')
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    bg.setAttribute('cx', midX)
    bg.setAttribute('cy', midY)
    bg.setAttribute('r', ICON_CHIP_R)
    bg.setAttribute('fill', 'rgba(11, 23, 36, 0.92)')
    bg.setAttribute('stroke', 'rgba(255, 255, 255, 0.22)')
    bg.setAttribute('stroke-width', '0.8')
    g.appendChild(bg)
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    icon.setAttribute('d', pathD)
    icon.setAttribute('fill', 'none')
    icon.setAttribute('stroke', 'rgba(255, 255, 255, 0.92)')
    icon.setAttribute('stroke-width', '1.6')
    icon.setAttribute('stroke-linecap', 'round')
    icon.setAttribute('stroke-linejoin', 'round')
    // Source icons use a 24x24 viewBox; scale to ~14x14 and center on midpoint.
    const scale = 14 / 24
    icon.setAttribute('transform', `translate(${midX - 7}, ${midY - 7}) scale(${scale})`)
    g.appendChild(icon)
    parent.appendChild(g)
  }

  // Show all needs on the left (up to a cap for vertical space)
  const needsToShow = allNeeds.slice(0, 14)

  // Build pioniere list: keep all matched ones (required for connections),
  // fill with a sample of others, then SHUFFLE so matched are distributed
  // throughout the crowd rather than clumped together.
  const matchedPioniereIds = new Set(matches.map(m => m.pioniere_id))
  const matchedPionieri = allPionieri.filter(p => matchedPioniereIds.has(p.id))
  const otherPionieri = allPionieri.filter(p => !matchedPioniereIds.has(p.id))
  // Smaller pool on phones — 180 DOM dots in a tiny grid is wasted paint.
  const poolSize = window.innerWidth < 768 ? 70 : 180
  const fillCount = Math.max(0, poolSize - matchedPionieri.length)
  const sampledOthers = [...otherPionieri]
    .sort(() => Math.random() - 0.5)
    .slice(0, fillCount)
  const pioneriToShow = [...matchedPionieri, ...sampledOthers]
    .sort(() => Math.random() - 0.5) // shuffle so matched dots are scattered

  // Render need dots (column on left)
  needsDotsEl.innerHTML = ''
  const needElements = {}
  needsToShow.forEach((need, i) => {
    const dot = document.createElement('div')
    dot.className = 'showcase-match-dot showcase-match-need-dot'
    dot.style.animationDelay = `${i * 0.03}s`
    needsDotsEl.appendChild(dot)
    needElements[need.id] = dot
  })

  // Render pioneer dots — organic scatter. Use a small delay to let CSS layout settle.
  pioneriDotsEl.innerHTML = ''
  const pioniereElements = {}
  let connections = []

  function placePioneriDots() {
    const rect = pioneriDotsEl.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    if (!W || !H) return false

    const n = pioneriToShow.length
    const cellArea = (W * H) / (n * 1.6)
    const cellSize = Math.sqrt(cellArea)
    const cols = Math.max(3, Math.floor(W / cellSize))
    const rows = Math.max(3, Math.ceil(n / cols))
    const cellW = W / cols
    const cellH = H / rows

    let seed = 1
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    pioneriDotsEl.innerHTML = ''
    for (let i = 0; i < n; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const jx = cellW * (0.25 + rand() * 0.5)
      const jy = cellH * (0.25 + rand() * 0.5)
      const x = col * cellW + jx
      const y = row * cellH + jy
      if (y > H - 4 || x > W - 4) continue

      const p = pioneriToShow[i]
      const dot = document.createElement('div')
      dot.className = 'showcase-match-dot showcase-match-pioniere-dot'
      dot.style.position = 'absolute'
      const size = 7 + Math.floor(rand() * 4)
      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      // Position by top-left corner (no transform — preserves pulse animation)
      dot.style.left = `${x - size / 2}px`
      dot.style.top = `${y - size / 2}px`
      dot.style.animationDelay = `${Math.min(i * 0.004, 1)}s`
      pioneriDotsEl.appendChild(dot)
      pioniereElements[p.id] = dot
    }

    // Build connections now that pioniereElements is populated
    connections = matches
      .filter(m => needElements[m.project_need_id] && pioniereElements[m.pioniere_id])
      .map(m => ({
        needId: m.project_need_id,
        pioniereId: m.pioniere_id,
        status: m.status,
      }))

    // Fallback synthetic pairings if no real matches landed in the viz
    if (connections.length === 0 && needsToShow.length) {
      const visibleMatchedIds = matchedPionieri
        .map(p => p.id)
        .filter(id => pioniereElements[id])
      const n2 = Math.min(needsToShow.length, visibleMatchedIds.length, 12)
      for (let i = 0; i < n2; i++) {
        connections.push({
          needId: needsToShow[i].id,
          pioniereId: visibleMatchedIds[i],
          status: 'active',
        })
      }
    }

    return true
  }

  // Place dots and animate. Try after the next frame; if container has no size, retry.
  function start() {
    if (placePioneriDots()) {
      setTimeout(() => animateConnections(), 400)
    } else {
      setTimeout(start, 100)
    }
  }
  requestAnimationFrame(start)

  function getDotCenter(el, refRect) {
    const r = el.getBoundingClientRect()
    return {
      x: r.left + r.width / 2 - refRect.left,
      y: r.top + r.height / 2 - refRect.top,
    }
  }

  function animateConnections() {
    // Use the SVG's own rect as the coordinate reference, since the SVG
    // is positioned relative to the flow's PADDING box (not border box)
    const initialSvgRect = svg.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${initialSvgRect.width} ${initialSvgRect.height}`)
    svg.setAttribute('preserveAspectRatio', 'none')

    // Touch / reduced-motion: SVG <animateMotion> + per-connection draw
    // animations are heavy. Render the end-state in a single batched paint.
    const reduced = window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.innerWidth < 900
    if (reduced) {
      const frag = document.createDocumentFragment()
      const svgRect = svg.getBoundingClientRect()
      connections.forEach((conn) => {
        const needEl = needElements[conn.needId]
        const pioniereEl = pioniereElements[conn.pioniereId]
        if (!needEl || !pioniereEl) return
        const needPt = getDotCenter(needEl, svgRect)
        const pioniereePt = getDotCenter(pioniereEl, svgRect)
        const dx = needPt.x - pioniereePt.x
        const dy = needPt.y - pioniereePt.y
        const bend = Math.sign(dy || 1) * Math.max(25, Math.abs(dy) * 0.3)
        const cp1x = pioniereePt.x + dx * 0.45
        const cp2x = needPt.x - dx * 0.45
        const cp1y = pioniereePt.y + bend * 0.3
        const cp2y = needPt.y - bend * 0.3
        const pathD = `M ${pioniereePt.x},${pioniereePt.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${needPt.x},${needPt.y}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathD)
        path.setAttribute('class', 'showcase-match-path')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', conn.status === 'completed' ? 'url(#matchGradientCompleted)' : 'url(#matchGradient)')
        frag.appendChild(path)
        const midX = (pioniereePt.x + cp1x + cp2x + needPt.x) / 4
        const midY = (pioniereePt.y + cp1y + cp2y + needPt.y) / 4
        appendIconChip(frag, midX, midY, needIdToCategory[conn.needId])
        // Style dots inline so the .showcase-match-dot transition can't fire.
        const baseStyle = 'transition: none;'
        pioniereEl.style.cssText += baseStyle + 'background: radial-gradient(circle at 30% 30%, rgba(0,200,220,1), var(--color-marea-teal)); border-color: var(--color-marea-teal);'
        needEl.style.cssText += baseStyle + 'background: radial-gradient(circle at 30% 30%, #fde68a, var(--color-marea-yellow)); border-color: var(--color-marea-yellow);'
      })
      svg.appendChild(frag)
      if (counterEl) counterEl.textContent = connections.length
      return
    }

    // Shuffle for organic feel
    const shuffled = [...connections].sort(() => Math.random() - 0.5)
    const totalDuration = Math.min(5000, 400 * shuffled.length)
    const interval = totalDuration / Math.max(shuffled.length, 1)

    let activeCount = 0

    shuffled.forEach((conn, i) => {
      setTimeout(() => {
        const needEl = needElements[conn.needId]
        const pioniereEl = pioniereElements[conn.pioniereId]
        if (!needEl || !pioniereEl) return

        // Re-measure svgRect each time: the surrounding section has a
        // fade-in transform animation, and a stale svgRect taken before
        // the dot rects would offset the line endpoints from the dots.
        const svgRect = svg.getBoundingClientRect()
        const needPt = getDotCenter(needEl, svgRect)
        const pioniereePt = getDotCenter(pioniereEl, svgRect)

        // Path goes from pioniere (left) → need (right)
        const dx = needPt.x - pioniereePt.x
        const dy = needPt.y - pioniereePt.y
        // Add a small vertical offset to the control points so nearly-horizontal
        // lines still have a gentle curve instead of looking flat
        const bend = Math.sign(dy || 1) * Math.max(25, Math.abs(dy) * 0.3)
        const cp1x = pioniereePt.x + dx * 0.45
        const cp2x = needPt.x - dx * 0.45
        const cp1y = pioniereePt.y + bend * 0.3
        const cp2y = needPt.y - bend * 0.3
        const pathD = `M ${pioniereePt.x},${pioniereePt.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${needPt.x},${needPt.y}`

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathD)
        path.setAttribute('class', 'showcase-match-path')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', conn.status === 'completed' ? 'url(#matchGradientCompleted)' : 'url(#matchGradient)')
        svg.appendChild(path)

        // Animate drawing from pioniere (left) → need (right)
        const pathLength = path.getTotalLength()
        path.style.strokeDasharray = pathLength
        path.style.strokeDashoffset = pathLength
        requestAnimationFrame(() => {
          path.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
          path.style.strokeDashoffset = '0'
        })

        // Glowing particle travels pioniere → need
        const light = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        light.setAttribute('r', '3.5')
        light.setAttribute('class', 'showcase-match-light')
        svg.appendChild(light)
        const animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        animMotion.setAttribute('dur', '1.2s')
        animMotion.setAttribute('fill', 'freeze')
        animMotion.setAttribute('path', pathD)
        light.appendChild(animMotion)
        animMotion.beginElement?.()
        setTimeout(() => light.remove(), 1300)

        // Pioniere pulses immediately, need pulses when the line arrives
        pioniereEl.classList.add('showcase-match-dot-active', 'showcase-match-dot-pulse')
        setTimeout(() => pioniereEl.classList.remove('showcase-match-dot-pulse'), 600)

        setTimeout(() => {
          needEl.classList.add('showcase-match-dot-active', 'showcase-match-dot-pulse')
          setTimeout(() => needEl.classList.remove('showcase-match-dot-pulse'), 600)
          // Drop the category icon chip on the line once the draw completes.
          const midX = (pioniereePt.x + cp1x + cp2x + needPt.x) / 4
          const midY = (pioniereePt.y + cp1y + cp2y + needPt.y) / 4
          appendIconChip(svg, midX, midY, needIdToCategory[conn.needId])
        }, 1100)

        activeCount++
        if (counterEl) counterEl.textContent = activeCount
      }, i * interval)
    })
  }
}

function initNeedsVisualization(data) {
  const grid = document.getElementById('showcase-needs-grid')
  if (!grid) return

  const needs = data.allNeeds || []

  // Render all dots as "open" initially — we'll animate them to their real status
  grid.innerHTML = ''
  const dots = needs.map((need, i) => {
    const dot = document.createElement('div')
    dot.className = 'showcase-need-dot showcase-need-dot-open'
    dot.dataset.finalStatus = need.status || 'open'
    dot.style.animationDelay = `${i * 0.008}s`
    grid.appendChild(dot)
    return dot
  })

  // Counters — start at 0 for matched/fulfilled, show all as open initially
  const countOpen = document.getElementById('needs-count-open')
  const countMatched = document.getElementById('needs-count-matched')
  const countFulfilled = document.getElementById('needs-count-fulfilled')

  let openCount = needs.length
  let matchedCount = 0
  let fulfilledCount = 0

  const updateCounters = () => {
    if (countOpen) countOpen.textContent = openCount
    if (countMatched) countMatched.textContent = matchedCount
    if (countFulfilled) countFulfilled.textContent = fulfilledCount
  }
  updateCounters()

  // After initial dot render (about 0.5s), start activating matches
  const initialDelay = 800 + dots.length * 8

  // Collect the indexes that should become matched/fulfilled
  const toMatch = []
  const toFulfill = []
  dots.forEach((dot, i) => {
    const status = dot.dataset.finalStatus
    if (status === 'matched') toMatch.push(i)
    if (status === 'fulfilled') toFulfill.push(i)
  })

  // Shuffle so the activation feels organic, not sequential
  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const matchOrder = shuffle(toMatch)
  const fulfillOrder = shuffle(toFulfill)

  // Animate matches activating — spread over ~2.5 seconds
  setTimeout(() => {
    const matchDuration = 2500
    const matchInterval = matchDuration / Math.max(matchOrder.length, 1)
    matchOrder.forEach((idx, i) => {
      setTimeout(() => {
        dots[idx].classList.remove('showcase-need-dot-open')
        dots[idx].classList.add('showcase-need-dot-matched', 'showcase-need-dot-activating')
        openCount--
        matchedCount++
        updateCounters()
      }, i * matchInterval)
    })

    // After matches start, begin fulfillments (overlap slightly)
    setTimeout(() => {
      const fulfillDuration = 2500
      const fulfillInterval = fulfillDuration / Math.max(fulfillOrder.length, 1)
      fulfillOrder.forEach((idx, i) => {
        setTimeout(() => {
          dots[idx].classList.remove('showcase-need-dot-open')
          dots[idx].classList.add('showcase-need-dot-fulfilled', 'showcase-need-dot-activating')
          openCount--
          fulfilledCount++
          updateCounters()
        }, i * fulfillInterval)
      })
    }, matchDuration * 0.5)
  }, initialDelay)
}

export function destroyShowcase() {
  showcaseDeferredObservers.forEach(observer => observer.disconnect())
  showcaseDeferredObservers = []
  showcaseDeferredInit = {
    sicilyOrigins: false,
    bubbles: false,
    matchFlow: false,
  }
  if (globeInstance) {
    globeInstance.destroy()
    globeInstance = null
  }
  if (sicilyMapInstance) {
    if (sicilyMapInstance.__onResize) window.removeEventListener('resize', sicilyMapInstance.__onResize)
    sicilyMapInstance.remove()
    sicilyMapInstance = null
  }
  if (worldMapInstance) {
    worldMapInstance.remove()
    worldMapInstance = null
  }
  chartsInstances.forEach(c => c.destroy())
  chartsInstances = []
}
