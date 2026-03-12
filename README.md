# Fondazione Marea OS

Piattaforma interna di amministrazione per [Fondazione Marea](https://fondazionemarea.org/), fondazione siciliana a impatto sociale. Gestisce una **banca del tempo** — abbinando le competenze dei volontari della rete **Pionieri** (diaspora siciliana globale) con le necessità dei progetti **Onda** e le operazioni della fondazione.

## Funzionalità

- **Gestione Pionieri** — profili, competenze, importazione CSV
- **Tassonomia competenze** — catalogo gerarchico delle competenze
- **Progetti e necessità** — progetti con requisiti specifici e livelli di urgenza
- **Matching** — workflow a due fasi per proporre e gestire gli abbinamenti volontari-necessità
- **Banca del tempo** — registrazione ore di volontariato, filtri e statistiche
- **Dashboard** — panoramica con grafici (ore, abbinamenti, distribuzione competenze, urgenza)

## Stack Tecnologico

- **Frontend**: Vite + Vanilla JS + Tailwind CSS v4
- **Backend/Database**: Supabase (PostgreSQL + Auth + REST API)
- **Grafici**: Chart.js
- **Hosting**: Netlify
- **Autenticazione**: Supabase Auth con magic link (solo admin)

## Come Iniziare

### Prerequisiti

- Node.js (v18+)
- Un progetto Supabase

### Installazione

```bash
git clone https://github.com/rinascimento-os/fondazione-marea-os.git
cd fondazione-marea-os
npm install
```

Crea un file `.env`:

```
VITE_SUPABASE_URL=url_del_tuo_progetto_supabase
VITE_SUPABASE_ANON_KEY=la_tua_anon_key_supabase
```

### Sviluppo

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Licenza

MIT — vedi [LICENSE](LICENSE) per i dettagli.
