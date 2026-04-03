# Reina Meal-Menu Rebuild Plan

## Decision: Fresh Scaffold vs. Refactor In Place

**Recommendation: Fresh Vite scaffold, port code over module by module.**

Reasons:
1. The current app has no build tool, no package.json, no module system. Retrofitting Vite onto a single app.js with global variables is more friction than starting clean.
2. The total code is small: 535 lines of JS, 485 lines of CSS, 74 lines of HTML. Porting is fast.
3. A fresh scaffold gives you .gitignore, proper public/ vs src/ separation, and PWA plugin from the start.
4. The current visual design is preserved by copying the CSS nearly verbatim --- the rebuild changes architecture, not appearance.
5. The current repo stays intact on main. The rebuild can live on a rebuild branch until ready, then replace main.

What to keep from the old code:
- All of style.css --- the visual design is locked in. Split into modules but keep every rule.
- The constraint/planner algorithm (lines 166-315 of app.js) --- proven logic, just needs refactoring into a module.
- nameToImagePath function --- reuse exactly.
- All 54 images in /images/.
- The HTML structure of both the planner section and the card grid --- same DOM, just templated differently.

What to discard:
- server.py (replaced by Vite dev server)
- ProductCard.jsx, ProductCard.css, ProductCard-preview.html (orphan React experiment --- move to archive)
- Session .md files in root (move to archive)
- CSV fetching and parsing (replaced by local JSON import)
- The 12-week pre-generation model (replaced by single-week dynamic model)

---

## Folder Structure

```
reina-meal-menu/
+-- CLAUDE.md                      # Project context for Claude Code
+-- README.md                      # Project readme
+-- package.json                   # Vite + dependencies
+-- vite.config.js                 # Vite config with PWA plugin
+-- index.html                     # Vite entry point (root level, Vite convention)
+-- .gitignore
+-- public/
|   +-- images/                    # All 54 meal images (static, not processed by Vite)
|   +-- manifest.json              # PWA manifest
|   +-- icons/                     # PWA icons (192x192, 512x512)
+-- src/
|   +-- main.js                    # App entry: imports modules, wires everything
|   +-- styles/
|   |   +-- base.css               # Reset, CSS variables, body, typography
|   |   +-- header.css             # Header section styles
|   |   +-- filters.css            # Filter bar styles
|   |   +-- cards.css              # Meal card grid styles
|   |   +-- planner.css            # Weekly planner section styles
|   |   +-- footer.css             # Footer styles
|   +-- data/
|   |   +-- meals.json             # All meal data (migrated from Google Sheets)
|   +-- modules/
|   |   +-- meals.js               # Load meals.json, filtering logic, nameToImagePath
|   |   +-- cards.js               # Render meal card grid, filter buttons
|   |   +-- planner.js             # Weekly planner: generate, render, swap, regenerate
|   |   +-- constraints.js         # Constraint rules: tripleValid, findTriple, rotation
|   |   +-- storage.js             # localStorage read/write (and future sync adapter)
|   |   +-- sw-register.js         # Service worker registration
+-- docs/
|   +-- architecture.md            # File structure + module responsibilities
|   +-- decisions.md               # Key design decisions log
|   +-- constraints.md             # Full constraint rules documentation
|   +-- data-model.md              # Meal schema, planner state shape, sync model
+-- archive/                       # Old files kept for reference
    +-- app.js
    +-- style.css
    +-- old-index.html
    +-- server.py
    +-- ProductCard.jsx
    +-- ProductCard.css
    +-- ProductCard-preview.html
    +-- reina-planner-session.md
    +-- session-2026-04-02.md
    +-- gemini-raw-exports/
```

Key points about this structure:
- public/images/ instead of root images/ --- Vite serves public/ as static files, so image paths stay /images/slug.png with no changes needed.
- src/modules/ for JS modules with import/export --- no more single 535-line file.
- src/styles/ split by section --- easier to find and edit than one 485-line CSS file.
- docs/ mirrors the Pokemon AR project pattern that worked well.

---

## Data Model

### meals.json

```json
[
  {
    "id": "albondigas-con-espagueti-rojo",
    "proteina": "Albondigas con Espagueti Rojo",
    "complemento1": "Espagueti rojo",
    "complemento2": "",
    "tipoDePlatillo": "pasta",
    "tipoProteina": "res",
    "seCocePollo": false,
    "remojo": false,
    "available": true
  }
]
```

The id field is the slug --- derived from proteina using the same nameToImagePath logic (minus the path prefix and extension). This is the stable key for tracking rotation history.

### Planner State (localStorage, later synced)

```json
{
  "version": 3,
  "currentWeek": {
    "weekOf": "2026-03-30",
    "menuType": 1,
    "meals": {
      "slotA": "albondigas-con-espagueti-rojo",
      "slotB": "filete-de-res-encebollado",
      "slotC": "filete-de-salmon"
    }
  },
  "history": [
    {
      "weekOf": "2026-03-23",
      "menuType": 2,
      "meals": { "slotA": "...", "slotB": "...", "slotC": "..." }
    }
  ],
  "menuTypeCounter": 7,
  "menu1Counter": 4,
  "rotationUsed": {
    "slotA_m1": ["id1", "id2"],
    "slotA_m2": ["id3"],
    "slotB_m1": ["id4"],
    "slotB_m2": ["id5"],
    "slotC": ["id6", "id7"]
  }
}
```

Key changes from current model:
- Stores meal IDs (slugs) instead of full meal objects --- smaller, and meals.json is the source of truth.
- currentWeek is ONE week, not 12. Generated fresh when a new Monday-Sunday cycle starts.
- history is an array of past weeks for rotation tracking. Keep last 12 weeks, trim older.
- rotationUsed tracks which meals have been used per slot pool for prefer-unused rotation.
- weekOf is the Monday date string --- used to detect is this a new week.

### Week Detection Logic

```
On app load:
  1. Get today date
  2. Calculate the Monday of the current week
  3. If currentWeek.weekOf matches this Monday -> show existing menu
  4. If not -> auto-generate new week, push old week to history
```

This replaces the 12-week slideshow entirely. The user always sees THIS week.

---

## Backend / Sync Strategy

### The Problem
The family has 3-4 phones. If Cristy swaps a meal on her phone, the other phones should show the same swap. localStorage is per-device.

### Recommendation: Supabase (free tier)

| Option | Pros | Cons |
|--------|------|------|
| localStorage only | Zero setup | Each phone is independent |
| Vercel KV | Stays in Vercel ecosystem | 30 req/day on free tier --- too low |
| Supabase | 500 MB free, real-time subscriptions, REST API, no server code | External dependency |
| JSON file in repo | Simple | Requires git push to update --- not usable |

Supabase free tier gives:
- Postgres table for weekly_menus (one row per family per week)
- Real-time subscriptions so all phones update live on swap
- Row-level security for future multi-household support
- 500 MB storage, 50K monthly active users

### Implementation Approach (Phased)

Phase 1 ships without sync. Start with localStorage only. The app works fully offline, one device at a time.

Phase 4 adds Supabase. The storage.js module is designed as an adapter:

```js
// storage.js exposes:
export function loadState() { ... }
export function saveState(state) { ... }
// Phase 1: localStorage
// Phase 4: Supabase client
// The rest of the app never knows the difference
```

### Supabase Table Schema (for Phase 4)

```sql
CREATE TABLE weekly_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id TEXT NOT NULL DEFAULT 'reina',
  week_of DATE NOT NULL,
  menu_type INT NOT NULL,
  slot_a TEXT NOT NULL,
  slot_b TEXT NOT NULL,
  slot_c TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, week_of)
);

CREATE TABLE rotation_state (
  household_id TEXT PRIMARY KEY DEFAULT 'reina',
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

household_id defaults to reina now but makes multi-household trivial later.

---

## Phases

### Phase 0: Project Setup (scaffold + cleanup + data migration)
**Goal:** A Vite project that runs and shows the meal card grid with filters, reading from local JSON.

**Files to create:**
- package.json
- vite.config.js
- .gitignore
- CLAUDE.md
- index.html (adapted from current, with script type=module src=/src/main.js)
- src/main.js
- src/data/meals.json (migrated from CSV)
- src/modules/meals.js
- src/modules/cards.js
- src/styles/base.css (CSS vars, reset, body --- lines 1-26 of current style.css)
- src/styles/header.css (lines 28-81)
- src/styles/filters.css (lines 83-127)
- src/styles/cards.css (lines 129-245)
- src/styles/footer.css (lines 201-227)
- docs/architecture.md
- docs/decisions.md

**Files to move to archive/:**
- app.js, style.css, current index.html -> old-index.html
- server.py
- ProductCard.jsx, ProductCard.css, ProductCard-preview.html
- reina-planner-session.md, session-2026-04-02.md

**Files to relocate:**
- images/ directory -> public/images/

**Shippable milestone:** npm run dev serves the app. Header, filter bar, and card grid look identical to current production. No planner yet. Data from local JSON.

---

### Phase 1: Rebuild Planner (new weekly model)
**Goal:** The planner section works with the new one-week-at-a-time paradigm.

**Files to create:**
- src/modules/planner.js --- render planner UI, handle swap/regenerate, week detection
- src/modules/constraints.js --- tripleValid, findTriple, rotationOrder, shuffle, norm, hasComp (extracted from app.js lines 146-315)
- src/modules/storage.js --- localStorage adapter
- src/styles/planner.css --- planner section styles (lines 247-485 of current style.css)
- docs/constraints.md
- docs/data-model.md

**Files to modify:**
- src/main.js --- wire in planner initialization
- index.html --- add planner section HTML

**Key behavioral changes:**
1. No Confirmar Semana step. The menu is living.
2. Auto-generate on new week (Monday check against weekOf).
3. Cambiar works anytime. Swapped-out meal returns to pool.
4. Regenerar Semana button replaces Generar Nuevo.
5. No Descargar in V1 (removes html2canvas dependency).
6. menuType alternation uses persistent counter, not index modulo.

**Shippable milestone:** Full app works on one device. Open Monday, see 3 meals. Swap any. Next Monday, auto-generated new menu.

---

### Phase 2: PWA + Offline
**Goal:** Installable on mobile home screens, works offline.

**Files to create/modify:**
- public/manifest.json (app name Reina, #F85E39 theme, standalone, lang es)
- public/icons/icon-192.png, icon-512.png (from reina-stamp.png)
- vite.config.js (enable PWA plugin, precache meals.json + images + app code)
- src/modules/sw-register.js

**Shippable milestone:** Add to Home Screen works on mobile. App loads offline.

---

### Phase 3: Polish + Image Cleanup
**Goal:** Clean up technical debt, verify on real devices.

**Tasks:**
- Remove 14 duplicate JPG images (PNG versions already exist)
- Verify all 37 meals in meals.json resolve to existing PNG files
- Test on iPhone SE (375px), iPhone 14 (390px), iPad (768px)
- Fix responsive issues
- Update README.md with setup/deploy instructions
- Verify Vercel auto-deploy

**Shippable milestone:** Clean images, no 404s, all family devices working.

---

### Phase 4: Multi-Device Sync (Supabase)
**Goal:** All family phones see the same weekly menu.

**Files to create/modify:**
- src/modules/supabase.js --- client init, real-time subscription
- src/modules/storage.js --- swap localStorage for Supabase calls
- .env --- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

**External setup:**
- Create free Supabase project
- Create tables (weekly_menus, rotation_state)
- Configure Row Level Security
- Add env vars to Vercel

**New dependency:** @supabase/supabase-js (~45KB gzipped)

**Shippable milestone:** Swap on one phone, see it on another.

---

### Phase 5: Future (not planned in detail)
- Multi-household support (invite links, household_id)
- Shopping list generation
- Meal history view
- Favoritos --- starred meals preferred in generation
- Descargar screenshot export
- Admin UI for adding/editing meals

---

## Data Migration: One-Time Script

Run once to convert Google Sheets CSV to meals.json.

```
1. curl the published CSV URL to a temp file
2. Node/Python script:
   - Read CSV
   - Map headers: proteina, complemento 1 -> complemento1, tipo de platillo -> tipoDePlatillo, etc.
   - Convert TRUE/FALSE strings to booleans
   - Generate id slug from proteina name (reuse nameToImagePath logic)
   - Output JSON array
3. Verify: ~37 meals
4. Spot-check 3 meals against spreadsheet
5. Commit src/data/meals.json
```

---

## Module Responsibilities

### src/modules/meals.js
- import mealsData from '../data/meals.json'
- getAllMeals() --- returns full array
- getAvailableMeals() --- filters available === true
- getMealById(id) --- lookup by slug
- filterMeals(filterValue) --- filter by tipoProteina or tipoDePlatillo
- nameToImagePath(name) --- exact copy of current function

### src/modules/cards.js
- renderCards(meals) --- builds card DOM, appends to #card-grid
- createCard(meal) --- creates single article.meal-card element
- setupFilters(allMeals) --- binds filter button click handlers

### src/modules/constraints.js
- shuffle(arr) --- Fisher-Yates
- norm(s) --- normalize string
- hasComp(meal, keyword) --- check complemento contains keyword
- tripleValid(a, b, c, constraints) --- validate 3-meal combination
- findTriple(cA, cB, cC, constraints) --- backtracking search
- rotationOrder(pool, usedSet) --- unused first, then used
- generateWeek(meals, state) --- generate ONE week given current state

### src/modules/planner.js
- initPlanner(meals) --- load state, check week, render
- renderPlanner() --- build planner DOM
- swapMeal(slot) --- swap one meal in current week
- regenerateWeek() --- discard current week, generate fresh
- checkNewWeek() --- compare today Monday against stored weekOf

### src/modules/storage.js
- loadState() --- read planner state from localStorage
- saveState(state) --- write planner state
- getMonday(date) --- calculate Monday of the week containing date

---

## Key Architectural Decisions Summary

1. Vite over plain files --- modules, PWA plugin, hot reload, proper build. No React.
2. Local JSON over Google Sheets --- no network dependency, faster, version-controlled.
3. One week at a time over 12-week batch --- simpler, matches real usage.
4. Storage adapter pattern --- storage.js is the only persistence interface. Swap later.
5. Supabase for sync (Phase 4) --- free, real-time, household_id for future growth.
6. Keep all CSS values --- visual design is done. Rebuild = reorganization, not redesign.
7. public/images/ for static assets --- paths stay /images/slug.png everywhere.
