# Fondazione Marea — Time Bank & Mentor Matching Platform

## Project Overview

An internal admin tool for **Fondazione Marea** (a Sicilian social-impact foundation) to manage a "banca del tempo" (time bank) — matching volunteer skills from the foundation's network of **Pionieri** (global diaspora of Sicilians) with the needs of **Onda projects** (foundation-supported social ventures in Sicily) and the foundation's internal operational needs.

**This is NOT a public-facing app.** It is used only by a small number of foundation admins to:
- Manage Pionieri profiles and their skills/availability
- Track Onda project needs and foundation operational needs
- Match volunteers to projects based on skills, availability, and fit
- Track volunteer hours contributed (the "time bank" ledger)

## Reference Materials

### Functional Prototype
Elena (foundation lead) created a Lovable prototype showing the general concept:
- https://timebankfondazionemarea.lovable.app/
- This is directional only — our implementation may differ in scope and structure

### Visual Identity
The app should follow the visual identity of the Fondazione Marea website:
- https://fondazionemarea.org/

Brand assets are in the `brand_assets/` directory:
- `brand_assets/logo/` — High-quality logo files. Use these directly in the app.
- `brand_assets/main_website/` — Screenshots of fondazionemarea.org. **Use these as the primary style reference** for colors, typography, spacing, and overall aesthetic. Match the warm, Mediterranean, sophisticated-but-approachable feel. Key characteristics:
  - Warm cream/off-white backgrounds (not pure white)
  - Clean serif + sans-serif typography pairing
  - Earthy, warm color palette (terracotta accents, deep navy text)
  - Generous whitespace, editorial/magazine-like layout
  - Photography-forward where images are used
  - Italian language throughout the UI

## Tech Stack

- **Frontend**: Vite + Vanilla JS + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + REST API)
- **Hosting**: Netlify
- **Auth**: Supabase Auth with magic link / email invite (admin-only, no public signup)

### Project Structure
```
/
├── CLAUDE.md              # This file
├── brand_assets/
│   ├── logo/              # Logo files
│   └── main_website/      # Website screenshots for style reference
├── index.html             # Entry point
├── src/
│   ├── main.js            # App initialization, router
│   ├── auth.js            # Supabase auth handling
│   ├── supabase.js        # Supabase client setup
│   ├── pages/             # Page modules
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── pionieri.js    # Manage Pionieri profiles & skills
│   │   ├── projects.js    # Manage Onda projects & needs
│   │   ├── matching.js    # Match Pionieri to project needs
│   │   └── timebank.js    # Track hours contributed
│   ├── components/        # Reusable UI components
│   └── styles/
│       └── main.css       # Tailwind imports + custom styles
├── .env                   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Data Model (Reference)

The following is a **suggested schema** — tables should be created as needed during development, not all upfront. The agent should create tables via Supabase SQL Editor when implementing each feature. Always add RLS policies (allow all for authenticated users) after creating a table.

**pionieri** — The volunteer network
- `id` (uuid, PK)
- `full_name` (text)
- `email` (text)
- `location` (text) — e.g. "San Francisco", "Palermo", "Princeton"
- `bio` (text)
- `availability` (text) — e.g. "5 hrs/month", "weekends only"
- `created_at`, `updated_at`

**skills** — Taxonomy of competencies (curated with HR Pionieri input)
- `id` (uuid, PK)
- `name` (text) — e.g. "UX Design", "Financial Planning", "Legal"
- `category` (text) — e.g. "Tech", "Business", "Creative", "Operations"

**pioniere_skills** — Many-to-many join
- `pioniere_id` (uuid, FK → pionieri)
- `skill_id` (uuid, FK → skills)
- `proficiency` (text) — e.g. "expert", "intermediate"

**projects** — Onda projects + foundation needs
- `id` (uuid, PK)
- `name` (text)
- `description` (text)
- `type` (text) — "onda_project" or "foundation_need"
- `status` (text) — "active", "completed", "paused"
- `created_at`, `updated_at`

**project_needs** — What each project needs
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects)
- `skill_id` (uuid, FK → skills)
- `description` (text) — specific need description
- `hours_needed` (integer)
- `urgency` (text) — "high", "medium", "low"
- `status` (text) — "open", "matched", "fulfilled"

**matches** — Admin-created pairings
- `id` (uuid, PK)
- `pioniere_id` (uuid, FK → pionieri)
- `project_need_id` (uuid, FK → project_needs)
- `status` (text) — "proposed", "confirmed", "active", "completed"
- `notes` (text)
- `created_at`

**time_entries** — Hours tracking ledger
- `id` (uuid, PK)
- `match_id` (uuid, FK → matches)
- `hours` (decimal)
- `date` (date)
- `description` (text)
- `created_at`

## Key Design Decisions

- **Language**: All UI text in Italian
- **No public signup**: Admins are created manually in Supabase Auth or invited via magic link
- **Manual matching**: Admins browse Pionieri skills and project needs, then create matches manually. No algorithm needed for v1.
- **Simple time tracking**: Admins log hours on behalf of volunteers. No self-service for v1.
- **Mobile-responsive**: Admins may use it on phone/tablet, so the layout should be responsive.
- **Communication is manual in v1**: Admins contact Pionieri outside the app (email, WhatsApp, etc.) to propose matches. The app is for tracking and organizing, not communication.

## V2 Scope (Do Not Build Yet)

The following features are planned for a future iteration. Document them here so the data model can accommodate them, but do not implement them in v1.

### Automated Email Notification Workflow

A request lifecycle with email notifications at each stage:

1. **Admin creates a request** (`project_needs` with a `deadline` date)
   → System sends email to Pioniere(s) with matching skills inviting them to volunteer
2. **Pioniere accepts the request**
   → Match status moves from `proposed` → `accepted`
   → System sends email to the project recipient (Onda project lead or foundation staff) notifying them a volunteer has been matched
3. **Volunteering takes place** between Pioniere and recipient
4. **Deadline is reached**
   → System sends email to recipient asking them to confirm the actual hours contributed
   → Recipient confirms → match status moves to `confirmed`, hours are logged in `time_entries`

### V2 Technical Requirements
- **Supabase Edge Functions**: Database triggers on `project_needs` and `matches` inserts/updates to send emails
- **Email service**: Resend or SendGrid (both have free tiers)
- **Additional fields needed**: `deadline` (date) on `project_needs`, `recipient_email` on `projects`, expanded `matches.status` enum: `proposed → accepted → active → completed → confirmed`
- **Pioniere-facing UI**: A simple page (possibly just email links) where Pionieri can accept/decline requests without needing a full login

## Supabase Project

- **Project ID**: `canuerhpoelwgozjxfrh`
- **URL**: `https://canuerhpoelwgozjxfrh.supabase.co`

### Environment Variables
```
VITE_SUPABASE_URL=https://canuerhpoelwgozjxfrh.supabase.co
VITE_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
```

These are safe to expose client-side — Supabase Row Level Security policies protect the data. Only authenticated admin users can access anything.

### Database Setup
Tables should be created as needed during development using the Supabase SQL Editor or Management API. RLS is enabled by default on all new tables — add appropriate policies (e.g. "allow all for authenticated users") when creating each table.
