# Reina Design Decisions

## 2026-04-03 — Rebuild decision
**Decision:** Start fresh with Vite scaffold, port code module by module.
**Why:** Old codebase had no build tool, no modules, data from Google Sheets, 12-week pre-generated planner in localStorage. Too many shortcuts to retrofit. Fresh scaffold is faster for 535 lines of JS.
**What was preserved:** All CSS values, constraint algorithm logic, nameToImagePath, images, HTML structure.

## 2026-04-03 — Local JSON over Google Sheets
**Decision:** Migrate meal data to src/data/meals.json.
**Why:** Google Sheets was a network dependency that could break silently. Local JSON is instant, reliable, works offline, and is version-controlled.

## 2026-04-03 — Dynamic filters
**Decision:** Filter buttons generated from actual data, not hardcoded in HTML.
**Why:** If a new protein type (e.g., puerco) is added to meals.json, its filter appears automatically. No HTML editing needed.

## 2026-04-03 — One week at a time (not 12)
**Decision:** Planner generates one week dynamically. Auto-generates on new Monday.
**Why:** 12-week pre-generation was a shortcut that felt hardcoded. Real usage is: see this week, swap if needed, next week auto-generates.

## 2026-04-03 — Meal lifecycle (Available → Assigned → Used)
**Decision:** Only "Used" meals (survived the full week) count against rotation. Swapped meals return to Available.
**Why:** If you swap out birria on Tuesday, it should be available again soon — you didn't actually cook it.

## 2026-04-03 — Grocery checklist prioritized (Phase 1)
**Decision:** Grocery checklist ships before the planner rebuild.
**Why:** Cristy's helper and shopper need the checklist NOW. Static staples have no dependency on the planner. Dynamic comida items plug in when the planner ships.

## 2026-04-03 — Supabase for future sync
**Decision:** Use Supabase free tier for multi-device sync (Phase 5).
**Why:** Storage adapter pattern (storage.js) means the swap is isolated. Supabase gives real-time subscriptions, Postgres, and household_id for multi-family future. Vercel KV free tier too limited (30 req/day).
