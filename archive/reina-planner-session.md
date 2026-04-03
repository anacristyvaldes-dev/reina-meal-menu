# Reina — Weekly Planner Feature Session
**Date:** April 2, 2026
**Project:** Reina — Menú Semanal
**Repo:** github.com/anacristyvaldes-dev/reina-meal-menu
**Stack:** Plain HTML / CSS / JS · Vercel · GitHub

---

## Context

Reina is a visual meal planning web app with a filterable menu of 37 home meals, AI-generated food photography, and live data from Google Sheets CSV. Design system: Bebas Neue + Barlow Condensed + Inter, #F85E39 red, #E0D857 yellow-green header, #FDF6EC off-white background.

---

## Feature Added: Weekly Planner

### What was built

A **Menú Semanal** section added to the app — visible between the REINA hero banner and the meal grid. Generates a 12-week rotating meal schedule with smart constraints, localStorage persistence, and interactive controls.

---

### Files Modified

| File | What changed |
|---|---|
| `app.js` | Expanded `parseCSV` to capture all meal fields; added full planner module (~300 lines) |
| `index.html` | Added planner section HTML; added html2canvas CDN script |
| `style.css` | Added planner styles (~160 lines), fully on-brand |

---

### Algorithm Rules Implemented

**Structure:** 3 meals per week
- Slot A = Monday/Tuesday
- Slot B = Wednesday/Thursday
- Slot C = Friday (always marisco)

**Menu alternation:**
- Odd weeks = Menu 1: Slot A → pollo where `se coce pollo = TRUE`, Slot B → res
- Even weeks = Menu 2: Slot A → res, Slot B → any pollo

**Protein rule:** Each week has exactly 1 res + 1 pollo + 1 marisco

**Wednesday remojo:** If a `remojo = TRUE` meal exists for Wednesday's protein, it's prioritized (soft preference, not hard block)

**Frito rule:** Max 1 `tipo de platillo = frito` per week across all 3 meals

**Tipo de platillo rule:** No repeated tipo across the 3 meals in a week

**Frijoles/Lentejas cycle (Menu 1 weeks only):**
- Menu 1 week 1: one meal has frijoles in comp1 or comp2
- Menu 1 week 2: one meal has lentejas
- Menu 1 week 3: neither
- Repeats every 3 Menu 1 weeks

**Espinaca rule:** Every 3rd week (weeks 3, 6, 9, 12), at least one meal has espinaca

**Rotation:**
- Res and pollo: no repeat per slot until all meals in that category have been used; then reset
- Marisco: same rotation logic, resets after all ~6 options used

**Constraint relaxation order** (when no perfect triple exists):
1. Drop espinaca requirement
2. Drop frijoles/lentejas cycle
3. Bare minimum (no duplicate tipo + frito cap only)

---

### UI Components

- **3 meal cards** labeled Lunes / Miércoles / Viernes — each shows meal image, name, and complementos
- **Cambiar button** per card — swaps that meal with a valid alternative from the same protein pool
- **Confirmar Semana** — marks week as done, advances to next
- **Descargar** — exports current week cards as PNG via html2canvas (2× resolution)
- **Generar Nuevo** — clears history and regenerates 12 weeks (with confirm dialog)

---

### Storage

- Key: `reina_planner_v2` in localStorage
- Stores all 12 generated weeks including committed state
- To wipe manually in DevTools: `localStorage.removeItem('reina_planner_v2')`

---

### Deploy

```bash
git add app.js index.html style.css && git commit -m "feat: weekly planner — 12-week schedule generator" && git push
```

Vercel auto-deploys on push.

---

### Things to Verify After Deploy

1. Planner renders 3 cards with real meal data (not placeholder)
2. Lunes / Miércoles / Viernes labels show correctly
3. Cambiar replaces a card without breaking tipo-de-platillo rules
4. Confirmar Semana advances to week 2 of 12
5. If meal names/comps appear blank → check CSV column headers in DevTools → Network tab → raw CSV response
