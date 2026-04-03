# Reina — Visual Meal Planning App

## What is this?
A family meal planning web app. Cristy curates a catalog of ~37 Mexican home meals with AI-generated food photography. The app shows a browsable card grid with filters, a weekly meal planner, and a grocery checklist system.

## Stack
- **Vanilla JavaScript** with ES modules — no React, no framework
- **Vite** for dev server, bundling, and PWA (future)
- **HTML / CSS / JS** — src/modules/ for JS, src/styles/ for CSS
- **Data:** Local JSON files (src/data/meals.json), not a database
- **Hosting:** Vercel via GitHub (anacristyvaldes-dev/reina-meal-menu)

## Key architecture decisions
1. **Local JSON over Google Sheets** — meals.json is the source of truth. No network dependency.
2. **Dynamic filters** — filter buttons generated from actual meal data, not hardcoded in HTML.
3. **Storage adapter pattern** — src/modules/storage.js is the only persistence interface. Currently localStorage, designed to swap to Supabase later.
4. **One week at a time** — planner generates one week's menu dynamically, not 12 weeks upfront.
5. **Meal lifecycle** — Available → Assigned → Used. Only "Used" counts against rotation.
6. **Two grocery views** — same items organized by kitchen zones (for helper) and store sections (for shopper).

## Visual design (DO NOT CHANGE)
- **Fonts:** Bebas Neue (headings), Barlow Condensed (labels/buttons), Inter (body)
- **Colors:** #F85E39 terracotta, #E0D857 yellow-green header, #FDF6EC off-white bg
- **Cards:** Square corners, no shadow, 1px #E0D5C8 border, #F5F0E8 body
- **Tags:** #F2D9D0 background, #F85E39 text, pill shape
- **Language:** Spanish (es)

## Project phases
- Phase 0: Vite scaffold + data migration + card grid ← CURRENT
- Phase 1: Grocery checklist (static staples)
- Phase 2: Weekly planner rebuild + grocery integration
- Phase 3: PWA + offline
- Phase 4: Share + download + polish
- Phase 5: Multi-device sync (Supabase)
- Phase 6+: AI meal input, community catalog

## File structure
- src/main.js — app entry, imports modules
- src/modules/meals.js — meal data access + filtering
- src/modules/cards.js — card grid rendering
- src/modules/planner.js — weekly planner (Phase 2)
- src/modules/constraints.js — meal constraint rules (Phase 2)
- src/modules/storage.js — persistence adapter (Phase 2)
- src/modules/groceries.js — grocery list builder (Phase 1)
- src/data/meals.json — 37 meals, migrated from Google Sheets
- src/data/staples.json — kitchen staples (Phase 1)
- src/styles/ — CSS split by section (base, header, filters, cards, planner, footer)
- public/images/ — 54 meal photos, matched by slug
- docs/ — architecture, decisions, constraints, data model

## Prohibitions
- Do NOT add a CSS framework (Tailwind, Bootstrap, etc.)
- Do NOT switch to React or any UI framework
- Do NOT change the visual design (fonts, colors, card style) without explicit approval
- Do NOT re-add Google Sheets as a data source
- Do NOT hardcode filter buttons in HTML — they must be generated from data
