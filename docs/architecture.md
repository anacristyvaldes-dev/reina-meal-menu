# Reina Architecture

## Module Responsibilities

### src/main.js
App entry point. Imports all CSS modules and wires up the card grid on DOMContentLoaded. Will also initialize the planner (Phase 2) and groceries (Phase 1).

### src/modules/meals.js
- Imports meals.json statically
- Exports: getAllMeals, getAvailableMeals, getMealById, filterMeals, getFilterOptions, nameToImagePath
- Pure data module — no DOM manipulation

### src/modules/cards.js
- Renders the meal card grid into #card-grid
- Builds the filter bar dynamically from meal data
- Handles filter button clicks

### src/modules/planner.js (Phase 2)
- Weekly planner: generate one week, render cards, handle swap/regenerate
- Week detection: checks if it's a new Monday-Sunday cycle on app load
- Delegates to constraints.js for meal selection
- Delegates to storage.js for persistence

### src/modules/constraints.js (Phase 2)
- All meal rotation rules: tripleValid, findTriple, rotationOrder
- Pure logic — no DOM, no storage

### src/modules/storage.js (Phase 2)
- Adapter pattern: loadState(), saveState()
- Phase 2: localStorage
- Phase 5: Supabase (same interface)

### src/modules/groceries.js (Phase 1)
- Builds the master grocery list from staples + weekly menu
- Two views: kitchen zones (helper) and store sections (shopper)

## Data Flow

```
meals.json ──> meals.js ──> cards.js ──> #card-grid
                        ──> planner.js ──> constraints.js
                                      ──> storage.js
                        ──> groceries.js ──> grocery views
```
