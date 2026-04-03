# Reina Rebuild Plan

## Context

Reina is a visual meal planning app for Cristy's family (3-4 devices). It was built as a learning project with shortcuts: Google Sheets as the database, a 12-week pre-generated planner stored in localStorage, no build tool, no PWA. It works on one device but can't scale to family use or a small group of moms.

**Goal:** Rebuild with a proper foundation. Keep the visual design (it's good). Change the architecture so it's reliable, works on multiple devices, and can grow.

**Approach:** Fresh Vite scaffold on a `rebuild` branch, port code module by module. The current codebase is small enough (535 JS + 485 CSS + 74 HTML) that porting is faster than retrofitting.

---

## What stays, what goes

**Keep verbatim:** All CSS values (visual design is locked), constraint algorithm logic (`app.js:146-315`), `nameToImagePath`, all 54 images, card and planner DOM structure.

**Discard:** `server.py`, `ProductCard.*` orphans, CSV parsing, 12-week pre-generation model, `html2canvas` dependency, hardcoded filter buttons in HTML.

**Change:** Filter bar is now **dynamic** — buttons generated from the actual data in meals.json. If your catalog has res/pollo/marisco, you see those protein filters. If someone adds a puerco meal later, a Puerco filter appears automatically. Same for tipoDePlatillo filters (caldo, frito, pasta, etc.). No more hardcoded `<button>` tags in the HTML.

---

## New Planner Paradigm

**Old:** Generate 12 weeks upfront -> step through like a slideshow -> "Confirmar" locks each week
**New:**
- Generate **one week** at a time based on constraint rules
- On app open, check the date: new week (Monday-Sunday)? -> auto-generate fresh menu
- **Cambiar** swaps any meal anytime (even same day) — swapped meal goes back to available pool
- **Regenerar Semana** replaces the whole week with a new one
- No "Confirmar" step — the menu is living
- History (last 12 weeks) drives rotation tracking so meals don't repeat

---

## Folder Structure

```
reina-meal-menu/
├── CLAUDE.md
├── package.json
├── vite.config.js
├── index.html                  # Vite entry point
├── .gitignore
├── public/
│   ├── images/                 # 54 meal photos (static)
│   ├── manifest.json           # PWA
│   └── icons/                  # PWA icons
├── src/
│   ├── main.js                 # App entry, wires modules
│   ├── data/
│   │   ├── meals.json          # Comida meals (migrated from Google Sheets)
│   │   ├── staples.json        # Kitchen staples with zones + store sections (Phase 4)
│   │   └── breakfast-dinner.json # Static breakfast/dinner menus, ~2-3 versions (Phase 4)
│   ├── modules/
│   │   ├── meals.js            # Load + filter meals, nameToImagePath
│   │   ├── cards.js            # Card grid rendering + filter buttons
│   │   ├── planner.js          # Weekly planner UI + swap + regenerate
│   │   ├── constraints.js      # Meal rules: tripleValid, findTriple, rotation
│   │   ├── storage.js          # localStorage adapter (swap to Supabase later)
│   │   ├── groceries.js        # Build grocery list from staples + menu (Phase 4)
│   │   └── grocery-views.js    # Render helper checklist + shopper list (Phase 4)
│   └── styles/
│       ├── base.css            # Reset, CSS vars, body
│       ├── header.css
│       ├── filters.css
│       ├── cards.css
│       ├── planner.css
│       └── footer.css
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   ├── constraints.md
│   └── data-model.md
└── archive/                    # Old files for reference
```

---

## Phases

### Phase 0 — Project Setup + Data Migration
Create Vite scaffold, migrate meal data from Google Sheets CSV to local `src/data/meals.json`, rebuild the card grid with filters.

**Create:** `package.json`, `vite.config.js`, `.gitignore`, `CLAUDE.md`, `index.html`, `src/main.js`, `src/data/meals.json`, `src/modules/meals.js`, `src/modules/cards.js`, all 6 CSS files, `docs/architecture.md`, `docs/decisions.md`
**Move to archive/:** `app.js`, `style.css`, old `index.html`, `server.py`, `ProductCard.*`, session `.md` files
**Move:** `images/` -> `public/images/`

**Done when:** `npm run dev` shows header + filter bar + card grid, identical to current production. No planner yet.

### Phase 1 — Groceries Checklist (static staples)
**Priority: HIGH.** Helper and shopper need this now — Cristy is the bottleneck.

This phase ships the grocery checklist using ONLY the static staples data (from Cristy's Word doc). No dependency on the planner or comida rotation. The dynamic comida ingredients plug in later when the planner is rebuilt.

**Data to create/migrate:**
- `src/data/staples.json` — the master staples list (migrated from Cristy's Word doc). Each item has:
  - `name` — the item ("Aceite de oliva", "Leche", "Pollo")
  - `category` — grouping label ("Aceites", "Lácteos", "Proteínas")
  - `kitchenZone` — where the helper looks ("despensa alta", "despensa baja", "refrigerador", "congelador", etc.)
  - `storeSection` — where the shopper finds it ("frutas y verduras", "carnes", "lácteos", "abarrotes", etc.)
  - `stapleSet` — which breakfast/dinner version it belongs to: `"A"`, `"B"`, or `"both"`
- `src/data/breakfast-dinner.json` — 2-3 static menu versions for breakfast/dinner. Simple: version name + description. Used to toggle which stapleSet is active.

**Two views, two roles:**

1. **Revisión (Helper)** — organized by kitchen zones
   - Helper opens this view, walks through the kitchen
   - Each item shows with a one-tap toggle: ✓ Hay (got it) / ✗ Falta (need it)
   - Grouped by: Refrigerador, Congelador, Despensa Alta, Despensa Baja, etc.
   - Items start unchecked each week. Helper taps through.

2. **Súper (Shopper)** — organized by store sections
   - Only shows items the helper marked as "Falta"
   - Grouped by: Frutas y Verduras, Carnes, Lácteos, Abarrotes, etc.
   - Shopper taps to check off as they put it in the cart
   - Shareable (Compartir button → WhatsApp) for the husband

**New files:**
- `src/modules/groceries.js` — build grocery list from staples data
- `src/modules/grocery-views.js` — render helper checklist + shopper list
- `src/styles/groceries.css`
- `src/data/staples.json`
- `src/data/breakfast-dinner.json`

**UI structure:** A tab or distinct section in the app. Two sub-views: "Revisión" and "Súper". A small toggle to switch active breakfast/dinner version (A/B).

**Done when:** Helper opens Reina, taps through kitchen checklist. Shopper opens Reina, sees only what's missing organized by store section. Shareable via WhatsApp.

### Phase 2 — Rebuild Planner + Groceries Integration
New single-week dynamic model with auto-generation on new week, Cambiar anytime, Regenerar Semana. Includes history view with "No se cocinó" override. Plugs comida ingredients into the grocery list.

**Create:** `src/modules/planner.js`, `src/modules/constraints.js`, `src/modules/storage.js`, `src/styles/planner.css`, `docs/constraints.md`, `docs/data-model.md`
**Modify:** `src/main.js`, `index.html`, `src/modules/groceries.js` (add dynamic comida items)

**Planner UI sections:**
1. **This week** — 3 meal cards (Lunes/Miércoles/Viernes) with Cambiar + Regenerar Semana
2. **Cook's notes** — small text input per meal card ("add note" button) for special requests
3. **Recent weeks** (collapsible) — last few weeks showing what was planned. Each meal has a toggle: cooked (default) / no se cocinó. Toggling "no se cocinó" returns that meal to Available pool for rotation.

**Groceries integration:**
- Each meal in `meals.json` now has `keyIngredients` array (protein + key veg)
- The grocery list becomes: static staples + this week's comida keyIngredients + cook's notes
- Helper and shopper views automatically include the week's dynamic items

**How the grocery list is now built:**
```
  Static staples (based on active breakfast/dinner version)    ← Phase 1
+ Key ingredients from this week's 3 comida meals              ← Phase 2 adds this
+ Cook's special notes per meal                                ← Phase 2 adds this
= MASTER GROCERY LIST
```

**Done when:** Open app Monday, see 3 meals. Swap any. Come back next Monday, new menu auto-generated. Can view last week and mark a meal as not cooked. Grocery checklist includes this week's comida ingredients automatically.

### Phase 3 — PWA + Offline
Installable on home screens, works offline for meal browsing AND grocery checking.

**Create:** `public/manifest.json`, PWA icons, service worker config via `vite-plugin-pwa`

**Done when:** "Add to Home Screen" works on iPhone. App loads offline. Helper can check kitchen list without internet.

### Phase 4 — Share + Download + Polish
Add sharing/download for the weekly menu and grocery list, clean up images, test on real devices.

**Share/Download:**
- **Descargar** — download current week as PNG image
- **Compartir** — native Web Share API (`navigator.share()`) for WhatsApp/iMessage. Works on both menu and grocery list.
- Both buttons in the planner footer row + grocery shopper view.

**Polish:**
- Remove 14 duplicate JPG images, verify all meals resolve to PNGs
- Test on real devices (375px, 390px, 768px), fix responsive issues
- Vercel deployment config: set build command `npm run build`, output `dist/`

### Phase 5 — Multi-Device Sync (Supabase)
Swap `storage.js` from localStorage to Supabase. Real-time subscriptions so all family phones see the same menu AND grocery state.

**Key design:** `storage.js` is an adapter — the rest of the app never knows if it's talking to localStorage or Supabase. `household_id` column defaults to `'reina'` but makes multi-family trivial later.

**Synced state includes:** weekly menu, grocery check status (helper marks), cook's notes. The shopper's list derives from what the helper flagged. When the helper marks "Falta" on her phone, the shopper's phone updates.

### Phase 6+ — V2 Vision (designed for, not built yet)

**AI-powered meal input:**
- Natural language: "add tamales de puerco con arroz rojo" → app parses into structured meal data (proteina, complementos, tipo, etc.)
- Auto-generates a food photo matching the existing visual style (Gemini or similar)
- Requires: API backend (Vercel serverless functions), image generation API, NLP parsing

**Community catalog:**
- Cristy's catalog is the starter for every new user
- Each mom can add meals to her own catalog
- Community feed: see what other moms added, pull meals into your own rotation
- `addedBy` field in the data model makes this possible from day one

**Other future features:**
- Multi-household support (invite links, household_id)
- Favoritos — starred meals preferred in generation
- Expandable protein categories (puerco, vegetariano, etc.) with dynamic rotation rules
- Admin UI for editing the starter catalog and staples
- Breakfast/dinner menu management UI (currently just JSON files)

---

## Meal Lifecycle

Meals have three states that drive rotation:

```
Available ──(picked for this week)──> Assigned ──(week ends)──> Used
    ^                                     |                       |
    |              (swapped out mid-week)──┘                       |
    |              (marked "not cooked" from history)──────────────┘
    └─────────────────────────────────────────────────────────────┘
```

- **Available** — in the pool, can be picked for any future week
- **Assigned** — on this week's menu, but the week hasn't ended yet
- **Used** — the week ended and the meal was still on the menu (presumed cooked)

**Only "Used" meals count against rotation.** The constraint engine prefers meals that haven't been Used recently. This means:
- Swapping a meal mid-week (Cambiar) returns it to Available immediately — it can show up again soon
- If the week ends and you didn't actually cook a meal, you can go to last week's history and tap "No se cocinó" (not cooked) — it goes back to Available instead of staying in Used rotation
- This handles the edge case: "Birria was planned for Wednesday but we ordered pizza instead"

**History view:** The last few weeks are visible (expandable/collapsible below the current week). Each past meal shows a small toggle: cooked (default) or not cooked. Tapping "not cooked" removes it from the Used pool so it comes back sooner in rotation.

---

## Data Model

### meals.json (one entry)
```json
{
  "id": "albondigas-con-espagueti-rojo",
  "proteina": "Albondigas con Espagueti Rojo",
  "complemento1": "Espagueti rojo",
  "complemento2": "",
  "tipoDePlatillo": "pasta",
  "tipoProteina": "res",
  "seCocePollo": false,
  "remojo": false,
  "available": true,
  "keyIngredients": ["res molida", "espagueti", "tomate"],
  "notes": "",
  "imageSource": "local",
  "addedBy": "reina"
}
```

**Field notes:**
- `keyIngredients`: protein + key vegetables/starches the meal needs. NOT a full recipe — just what you'd need to buy. Drives the grocery list (Phase 4).
- `notes`: cook's special notes for this meal in the current week. Empty by default, filled in per-week when assigned. Stored in planner state, not in meals.json.
- `imageSource`: `"local"` (image in repo) or `"generated"` (AI-created, V2). Always `"local"` for now.
- `addedBy`: `"reina"` for the starter catalog. In multi-user future, this is the household/user ID.

### Planner state (localStorage)
```json
{
  "version": 3,
  "currentWeek": {
    "weekOf": "2026-03-30",
    "menuType": 1,
    "meals": {
      "slotA": { "id": "meal-id", "status": "assigned" },
      "slotB": { "id": "meal-id", "status": "assigned" },
      "slotC": { "id": "meal-id", "status": "assigned" }
    }
  },
  "history": [
    {
      "weekOf": "2026-03-23",
      "menuType": 2,
      "meals": {
        "slotA": { "id": "meal-id", "status": "used" },
        "slotB": { "id": "meal-id", "status": "not-cooked" },
        "slotC": { "id": "meal-id", "status": "used" }
      }
    }
  ],
  "menuTypeCounter": 7,
  "menu1Counter": 4
}
```

Key changes from previous plan version:
- Each meal slot stores `{ id, status }` instead of just the id string
- Status is `"assigned"` during the current week, then becomes `"used"` when the week rolls over
- User can override any past meal to `"not-cooked"` from the history view
- **Rotation is derived from history**, not stored separately. To check if a meal was recently used: scan history for entries with `status: "used"`. This is simpler and always consistent — no separate `rotationUsed` to keep in sync.

**Week detection logic:**
- On load, calculate this Monday's date (week = Monday to Sunday)
- If `currentWeek.weekOf` matches this Monday -> show existing menu
- If not -> transition current week to history (all "assigned" become "used"), auto-generate new week
- **First-ever load:** No state exists. Generate the first week immediately, no history yet.
- **Sunday night edge case:** Sunday is still part of the current week (Mon-Sun). You see this week's menu. New menu generates when you open the app on or after Monday.

---

## Source files to port from

| Current file | Lines | What to extract |
|---|---|---|
| `app.js` | 8-21 | `nameToImagePath` -> `src/modules/meals.js` |
| `app.js` | 54-111 | Card rendering + filter setup -> `src/modules/cards.js` |
| `app.js` | 146-315 | Constraint algorithm -> `src/modules/constraints.js` |
| `app.js` | 319-534 | Planner init/render/swap -> `src/modules/planner.js` (heavily rewritten) |
| `style.css` | 1-26 | CSS vars + reset -> `src/styles/base.css` |
| `style.css` | 28-81 | Header -> `src/styles/header.css` |
| `style.css` | 83-127 | Filters -> `src/styles/filters.css` |
| `style.css` | 129-245 | Cards + tags -> `src/styles/cards.css` |
| `style.css` | 247-485 | Planner -> `src/styles/planner.css` |
| `style.css` | 201-227 | Footer -> `src/styles/footer.css` |

---

## Constraint Tests (Phase 1)

The planner rules are the most complex part of the app. A small test script (`src/tests/constraints.test.js`) that:
1. Generates 12 weeks of menus from the real meals.json
2. Verifies: no repeated tipo de platillo within a week
3. Verifies: max 1 frito per week
4. Verifies: slot C is always marisco
5. Verifies: no meal appears in consecutive weeks
6. Run with `node src/tests/constraints.test.js` — no test framework needed, just assertions

This is not a full test suite — just a safety net for the algorithm.

---

## Deployment

- **Hosting:** Vercel (already connected to `anacristyvaldes-dev/reina-meal-menu` on GitHub)
- **Build command:** `npm run build`
- **Output directory:** `dist/`
- **Framework preset:** Vite (Vercel auto-detects)
- **No environment variables** until Phase 4 (Supabase keys)
- Auto-deploys on push to `main`

---

## Verification

After each phase:
1. `npm run dev` — app runs locally
2. Preview tool screenshot — visual comparison with current production
3. Filter buttons all work (Todos, Res, Pollo, Mariscos, etc.)
4. Mobile viewport (375px) — single column, readable
5. After Phase 1: Helper taps through kitchen checklist by zone. Shopper sees only missing items by store section. Compartir sends list via WhatsApp.
6. After Phase 2: Planner shows 3 meals, swap works, new week auto-generates. Grocery list includes comida ingredients. Constraint test script passes.
7. After Phase 3: "Add to Home Screen", toggle airplane mode — app + grocery checklist work offline
8. After Phase 4: Descargar saves PNG, Compartir opens native share sheet on mobile
9. After Phase 5: Helper marks items on her phone, shopper's phone updates. Menu swap syncs across devices.
