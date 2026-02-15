# Fondazione Marea — Time Bank & Mentor Matching Platform

## Project Overview

Internal admin tool for **Fondazione Marea** (Sicilian social-impact foundation) to manage a "banca del tempo" (time bank) — matching volunteer skills from **Pionieri** (global Sicilian diaspora network) with **Onda project** needs and foundation operational needs.

**Not public-facing.** Used by a small number of foundation admins to manage Pionieri profiles, track project needs, create matches, and log volunteer hours.

## Tech Stack

- **Frontend**: Vite + Vanilla JS + Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no `tailwind.config.js`)
- **Backend/Database**: Supabase (PostgreSQL + Auth + REST API)
- **Charts**: Chart.js
- **Hosting**: Netlify (including serverless functions for v2 backend logic)
- **Email (v2)**: Resend
- **Auth**: Supabase Auth with magic link (admin-only, no public signup)
- **Fonts**: Inter (body) + Playfair Display (headings), loaded via Google Fonts in `index.html`

## Project Structure

```
/
├── CLAUDE.md
├── brand_assets/
│   ├── logo/                      # Logo files — use directly in the app
│   └── main_website/              # Screenshots of fondazionemarea.org — style reference
├── sql_queries/
│   ├── supabase-schema.sql        # Full DB schema + RLS + seed data (source of truth)
│   ├── supabase-migration-keywords.sql
│   └── supabase-mockdata.sql      # Sample data
├── netlify/
│   └── functions/                 # Serverless functions (v2)
├── src/
│   ├── main.js                    # App init, hash-based router, auth state listener
│   ├── auth.js                    # signInWithOtp, getSession, signOut, onAuthStateChange
│   ├── supabase.js                # Supabase client singleton
│   ├── pages/
│   │   ├── login.js               # Magic link login
│   │   ├── dashboard.js           # Stats cards, charts (hours/matches/skills/urgency)
│   │   ├── pionieri.js            # CRUD + skill assignment + CSV import
│   │   ├── skills.js              # Skill taxonomy CRUD (route: #/competenze)
│   │   ├── projects.js            # Projects + project needs CRUD (route: #/progetti)
│   │   ├── matching.js            # Two-phase: create matches + manage matches
│   │   └── timebank.js            # Log hours, filter, summary stats
│   ├── components/
│   │   ├── layout.js              # Sidebar nav + header + responsive mobile menu
│   │   ├── modal.js               # Generic modal dialog
│   │   ├── skill-picker.js        # Multi-select skills with tags + inline creation
│   │   ├── searchable-select.js   # Single-select dropdown with search
│   │   └── csv-import.js          # 4-step CSV import wizard with keyword matching
│   └── styles/
│       └── main.css               # Tailwind @theme tokens + custom utility classes
├── index.html                     # Entry point (fonts, favicons, module script)
├── .env                           # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── netlify.toml                   # Build config: npm run build → dist/
├── vite.config.js                 # Tailwind plugin only
└── package.json                   # type: commonjs
```

## Key Conventions

- **Language**: All UI text in Italian
- **Routing**: Hash-based (`#/pionieri`, `#/competenze`, `#/progetti`, `#/matching`, `#/timebank`, `#/dashboard`). All routes except `#/login` require auth.
- **DB access**: All tables have RLS with "allow all for authenticated" policy. Frontend uses Supabase JS client directly.
- **Schema source of truth**: `sql_queries/supabase-schema.sql` — update this when modifying the DB
- **Design system**: Custom Tailwind tokens defined in `src/styles/main.css` under `@theme`. Key colors: `marea-teal` (#008eb0), `marea-navy` (#1a3a4a), `marea-yellow` (#f5c542), `marea-cream` (#faf8f5). Custom classes: `.btn-gold`, `.btn-teal`, `.btn-outline`, `.badge`, `.nav-active`, `.card-hover`, `.focus-ring`, `.table-row-hover`, `.page-transition`
- **No separate tailwind config** — Tailwind v4 uses the CSS-based `@theme` block

## Supabase

- **URL**: `https://canuerhpoelwgozjxfrh.supabase.co`
- **Project ID**: `canuerhpoelwgozjxfrh`
- Env vars (`VITE_*` prefix) are safe client-side — RLS protects data
- When adding tables: always enable RLS + add "allow all for authenticated" policy + update `sql_queries/supabase-schema.sql`

## Visual Identity

Match the style of [fondazionemarea.org](https://fondazionemarea.org/). See `brand_assets/main_website/` screenshots.
- Warm cream backgrounds, not pure white
- Serif headings (Playfair Display) + sans-serif body (Inter)
- Earthy palette: teal, navy, terracotta/gold accents
- Generous whitespace, editorial layout
- Mobile-responsive

## V2 Scope — Automated Email Notification Workflow

V2 adds an automated request lifecycle. **Not yet built** — current matching is fully manual.

### Workflow
1. **Admin creates request** (project need with `deadline`) → email sent to matching Pionieri
2. **Pioniere accepts** → match status `proposed → accepted` → email to project recipient
3. **Volunteering happens** between Pioniere and recipient
4. **Deadline reached** → email to recipient asking to confirm hours → hours logged in `time_entries`

### Technical Approach
- **Netlify serverless functions** (`netlify/functions/`): all backend logic, same repo, deploys with frontend
- **Netlify scheduled functions**: daily cron to check deadlines and send confirmation emails
- **Resend** for email (free tier: 3k emails/month)
- **Token-authenticated pages** (no Supabase Auth for Pionieri/recipients):
  - `/respond?match_id=abc&token=xyz` — Pioniere accepts/declines
  - `/confirm?match_id=abc&token=xyz` — Recipient confirms hours
- **Secret keys** (Supabase `service_role`, Resend API key) in Netlify env vars (no `VITE_` prefix)
- **DB additions needed**: `deadline` on `project_needs`, `recipient_email` on `projects`, expanded `matches.status` enum (`proposed → accepted → active → completed → confirmed`), token field on `matches`

## Reference Links

- Lovable prototype (directional): https://timebankfondazionemarea.lovable.app/
- Foundation website (style reference): https://fondazionemarea.org/
