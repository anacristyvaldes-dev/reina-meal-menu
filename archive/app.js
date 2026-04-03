const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQp3VutFRNKKSP4EWbkVQyRFR_TrcUcvve917jk3xo-O9SxThao6Lsafy4p7PgTxiK5uM1Aih19G6Gp/pub?gid=24584397&single=true&output=csv";

// All meals stored after fetch — used for filtering without re-fetching
let allMeals = [];

// Derives the local image path from a meal name.
// "Chicken Shawarma" → "images/chicken-shawarma.jpg"
function nameToImagePath(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return `images/${slug}.png`;
}

function parseCSV(text) {
  // Normalize Windows line endings before splitting
  const lines = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    // Handle quoted fields that may contain commas
    const values = line.match(/(".*?"|[^",\n]+)(?=,|$)/g) || [];
    const raw = {};
    headers.forEach((header, i) => {
      raw[header] = (values[i] || "").replace(/^"|"$/g, "").trim();
    });

    const tags = [raw["tipo de platillo"], raw["tipo proteina"]]
      .filter(Boolean)
      .join("|");

    return {
      name:         raw["proteina"]        || "",
      comp1:        raw["complemento 1"]   || "",
      comp2:        raw["complemento 2"]   || "",
      tipoPlatillo: raw["tipo de platillo"]|| "",
      tipoProteina: raw["tipo proteina"]   || "",
      seCocePollo:  raw["se coce pollo"]   || "",
      remojo:       raw["remojo"]          || "",
      tags,
      available:    raw["available"]       || "TRUE",
    };
  });
}

function createCard(meal) {
  const article = document.createElement("article");
  article.className = "meal-card";

  const imgPath = nameToImagePath(meal.name);

  const tags = meal.tags
    ? meal.tags.split("|").map(t => t.trim()).filter(Boolean)
    : [];

  const tagHTML = tags
    .map(tag => `<span class="tag">${tag}</span>`)
    .join("");

  article.innerHTML = `
    <img class="card-img" src="${imgPath}" alt="${meal.name}" loading="lazy">
    <div class="card-body">
      <h2 class="card-name">${meal.name}</h2>
      <div class="card-tags">${tagHTML}</div>
    </div>
  `;

  return article;
}

function renderCards(meals) {
  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";

  const visible = meals.filter(m => m.available !== "FALSE" && m.name);

  const fragment = document.createDocumentFragment();
  visible.forEach(meal => fragment.appendChild(createCard(meal)));
  grid.appendChild(fragment);
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter.toLowerCase();
      if (filter === "all") {
        renderCards(allMeals);
      } else {
        // Support pipe-separated filter values (e.g. "asado|plancha")
        const filterValues = filter.split("|").map(f => f.trim());
        const filtered = allMeals.filter(m => {
          const mealTags = m.tags.toLowerCase().split("|").map(t => t.trim());
          return filterValues.some(f => mealTags.includes(f));
        });
        renderCards(filtered);
      }
    });
  });
}

function showError() {
  document.getElementById("card-grid").hidden = true;
  document.getElementById("error-message").hidden = false;
}

async function fetchAndRender() {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    allMeals = parseCSV(text);
    renderCards(allMeals);
    setupFilters();
    initPlanner(allMeals);
  } catch (err) {
    showError();
    console.error("Failed to load menu:", err);
  }
}

document.addEventListener("DOMContentLoaded", fetchAndRender);


// ============================================================
// PLANNER MODULE
// ============================================================

const PLANNER_KEY = "reina_planner_v2";

let plannerState  = null;
let plannerMeals  = []; // reference kept for swap operations

// ── Utilities ─────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s) {
  return (s || "").trim().toLowerCase();
}

function hasComp(meal, keyword) {
  const kw = keyword.toLowerCase();
  return norm(meal.comp1).includes(kw) || norm(meal.comp2).includes(kw);
}

// ── Constraint validator ───────────────────────────────────

function tripleValid(a, b, c, { frijolesCycle, needsEspinaca }) {
  // Tipo de platillo: no repeats across all 3
  const tipos = [a, b, c].map(m => norm(m.tipoPlatillo)).filter(Boolean);
  if (new Set(tipos).size !== tipos.length) return false;

  // Frito: max 1 across all 3
  const fritos = [a, b, c].filter(m => norm(m.tipoPlatillo) === "frito").length;
  if (fritos > 1) return false;

  // Frijoles / lentejas cycle (Menu 1 weeks only)
  if (frijolesCycle === 0 && ![a, b, c].some(m => hasComp(m, "frijoles"))) return false;
  if (frijolesCycle === 1 && ![a, b, c].some(m => hasComp(m, "lentejas"))) return false;

  // Espinaca every 3rd week
  if (needsEspinaca && ![a, b, c].some(m => hasComp(m, "espinaca"))) return false;

  return true;
}

// ── Backtracking triple finder ─────────────────────────────

function findTriple(cA, cB, cC, constraints) {
  for (const c of cC) {
    for (const b of cB) {
      if (b.name === c.name) continue;
      // Quick pre-checks for B+C before looping A
      const tipBC = [norm(b.tipoPlatillo), norm(c.tipoPlatillo)].filter(Boolean);
      if (new Set(tipBC).size !== tipBC.length) continue;
      const fritoBC = [b, c].filter(m => norm(m.tipoPlatillo) === "frito").length;
      if (fritoBC > 1) continue;

      for (const a of cA) {
        if (a.name === b.name || a.name === c.name) continue;
        if (tripleValid(a, b, c, constraints)) return { slotA: a, slotB: b, slotC: c };
      }
    }
  }
  return null;
}

// ── Rotation helpers ───────────────────────────────────────

/** Returns pool sorted: unvisited first, then visited (preserves shuffle order within each group). */
function rotationOrder(pool, usedSet) {
  return [
    ...pool.filter(m => !usedSet.has(m.name)),
    ...pool.filter(m =>  usedSet.has(m.name)),
  ];
}

function markUsed(name, usedSet, poolSize) {
  usedSet.add(name);
  if (usedSet.size >= poolSize) usedSet.clear(); // reset rotation
}

// ── Schedule generator ─────────────────────────────────────

function generateSchedule(meals) {
  const avail = meals.filter(m => m.available !== "FALSE" && m.name);

  const res     = avail.filter(m => norm(m.tipoProteina) === "res");
  const pollo   = avail.filter(m => norm(m.tipoProteina) === "pollo");
  const marisco = avail.filter(m => norm(m.tipoProteina) === "marisco");
  // Menu 1 slot A: only pollo where se coce pollo = TRUE
  const polloCoce = pollo.filter(m => norm(m.seCocePollo) === "true");

  // Shuffled pools per slot
  const pools = {
    slotA_m1: shuffle([...polloCoce]),   // Menu 1  Mon: pollo coce
    slotA_m2: shuffle([...res]),         // Menu 2  Mon: res
    slotB_m1: shuffle([...res]),         // Menu 1  Wed: res
    slotB_m2: shuffle([...pollo]),       // Menu 2  Wed: any pollo
    slotC:    shuffle([...marisco]),     // Fri: always marisco
  };

  // Per-slot rotation tracking
  const used = {
    slotA_m1: new Set(),
    slotA_m2: new Set(),
    slotB_m1: new Set(),
    slotB_m2: new Set(),
    slotC:    new Set(),
  };

  const weeks = [];
  let menu1Count = 0;

  for (let w = 0; w < 12; w++) {
    const menuType = w % 2 === 0 ? 1 : 2;
    const weekNum  = w + 1;
    const needsEspinaca = weekNum % 3 === 0; // weeks 3, 6, 9, 12

    let frijolesCycle = -1;
    if (menuType === 1) {
      frijolesCycle = menu1Count % 3; // 0=frijoles, 1=lentejas, 2=neither
      menu1Count++;
    }

    const slotAKey = menuType === 1 ? "slotA_m1" : "slotA_m2";
    const slotBKey = menuType === 1 ? "slotB_m1" : "slotB_m2";

    // Build candidate lists for A and C (rotation order)
    const cA = rotationOrder(pools[slotAKey], used[slotAKey]);
    const cC = rotationOrder(pools.slotC,    used.slotC);

    // Slot B: rotation order with remojo preference
    // Priority: unvisited+remojo → unvisited+noRemojo → visited+remojo → visited+noRemojo
    const bPool = pools[slotBKey];
    const bUsed = used[slotBKey];
    const cB = [
      ...bPool.filter(m => !bUsed.has(m.name) && norm(m.remojo) === "true"),
      ...bPool.filter(m => !bUsed.has(m.name) && norm(m.remojo) !== "true"),
      ...bPool.filter(m =>  bUsed.has(m.name) && norm(m.remojo) === "true"),
      ...bPool.filter(m =>  bUsed.has(m.name) && norm(m.remojo) !== "true"),
    ];

    const constraints = { frijolesCycle, needsEspinaca };

    // Try with full constraints → relax espinaca → relax frijoles/lentejas → bare minimum
    let triple =
      findTriple(cA, cB, cC, constraints) ||
      (needsEspinaca  ? findTriple(cA, cB, cC, { ...constraints, needsEspinaca: false })  : null) ||
      (frijolesCycle >= 0 ? findTriple(cA, cB, cC, { frijolesCycle: -1, needsEspinaca: false }) : null) ||
      findTriple(cA, cB, cC, { frijolesCycle: -1, needsEspinaca: false });

    // Absolute fallback (should not trigger with a real dataset)
    if (!triple) {
      triple = {
        slotA: cA[0] || pools[slotAKey][0],
        slotB: cB[0] || pools[slotBKey][0],
        slotC: cC[0] || pools.slotC[0],
      };
    }

    // Advance rotation for each slot
    if (triple.slotA) markUsed(triple.slotA.name, used[slotAKey], pools[slotAKey].length);
    if (triple.slotB) markUsed(triple.slotB.name, used[slotBKey], pools[slotBKey].length);
    if (triple.slotC) markUsed(triple.slotC.name, used.slotC,    pools.slotC.length);

    weeks.push({
      weekNum,
      menuType,
      committed: false,
      meals: { slotA: triple.slotA, slotB: triple.slotB, slotC: triple.slotC },
    });
  }

  return weeks;
}

// ── State persistence ──────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState() {
  try {
    localStorage.setItem(PLANNER_KEY, JSON.stringify(plannerState));
  } catch (e) {
    console.warn("Could not save planner state:", e);
  }
}

// ── Init ───────────────────────────────────────────────────

function initPlanner(meals) {
  plannerMeals = meals;
  plannerState = loadState();

  if (!plannerState?.weeks?.length) {
    plannerState = {
      version:           2,
      generatedAt:       new Date().toISOString(),
      currentWeekIndex:  0,
      weeks:             generateSchedule(meals),
    };
    saveState();
  }

  renderPlanner();
  bindPlannerEvents();
}

// ── Rendering ──────────────────────────────────────────────

const SLOT_LABELS = { slotA: "Lunes", slotB: "Miércoles", slotC: "Viernes" };

function renderPlanner() {
  if (!plannerState) return;

  const { currentWeekIndex, weeks } = plannerState;
  const meta    = document.getElementById("planner-meta");
  const cards   = document.getElementById("planner-cards");
  const commitBtn = document.getElementById("btn-commit-week");

  if (currentWeekIndex >= weeks.length) {
    meta.textContent = "¡12 semanas completadas!";
    cards.innerHTML  = `
      <div class="planner-done">
        <p>Completaste las 12 semanas de menú.</p>
        <p>Haz clic en <strong>Generar Nuevo</strong> para empezar de nuevo.</p>
      </div>`;
    if (commitBtn) commitBtn.disabled = true;
    return;
  }

  const week = weeks[currentWeekIndex];
  if (commitBtn) commitBtn.disabled = false;

  meta.textContent = `Semana ${week.weekNum} de ${weeks.length} · Menú ${week.menuType}`;

  const isLast = currentWeekIndex === weeks.length - 1;
  if (commitBtn) commitBtn.textContent = isLast ? "Finalizar →" : "Confirmar Semana →";

  cards.innerHTML = "";
  ["slotA", "slotB", "slotC"].forEach(slot => {
    const meal = week.meals[slot];
    if (!meal) return;

    const comps = [meal.comp1, meal.comp2].filter(Boolean).join(" · ");
    const img   = nameToImagePath(meal.name);

    const card = document.createElement("div");
    card.className = "planner-card";
    card.innerHTML = `
      <div class="planner-day-label">${SLOT_LABELS[slot]}</div>
      <img class="planner-card-img" src="${img}" alt="${meal.name}" loading="lazy">
      <div class="planner-card-body">
        <h3 class="planner-meal-name">${meal.name}</h3>
        ${comps ? `<p class="planner-comps">${comps}</p>` : ""}
        <button class="planner-swap-btn" data-slot="${slot}">Cambiar</button>
      </div>
    `;
    cards.appendChild(card);
  });
}

// ── Interactions ───────────────────────────────────────────

function bindPlannerEvents() {
  // Swap — event delegation on the card container
  document.getElementById("planner-cards").addEventListener("click", e => {
    const btn = e.target.closest(".planner-swap-btn");
    if (btn) swapMeal(btn.dataset.slot);
  });

  document.getElementById("btn-commit-week").addEventListener("click",   commitWeek);
  document.getElementById("btn-download-week").addEventListener("click", downloadWeek);
  document.getElementById("btn-generate-new").addEventListener("click",  confirmGenerateNew);
}

function swapMeal(slot) {
  if (!plannerState) return;
  const week = plannerState.weeks[plannerState.currentWeekIndex];
  if (!week) return;

  const currentMeal = week.meals[slot];
  const menuType    = week.menuType;

  // Determine valid protein pool for this slot
  let filter;
  if (slot === "slotC") {
    filter = m => norm(m.tipoProteina) === "marisco";
  } else if (slot === "slotA") {
    filter = menuType === 1
      ? m => norm(m.tipoProteina) === "pollo" && norm(m.seCocePollo) === "true"
      : m => norm(m.tipoProteina) === "res";
  } else { // slotB
    filter = menuType === 1
      ? m => norm(m.tipoProteina) === "res"
      : m => norm(m.tipoProteina) === "pollo";
  }

  const candidates = shuffle(
    plannerMeals
      .filter(m => m.available !== "FALSE" && m.name)
      .filter(filter)
      .filter(m => m.name !== currentMeal.name)
  );

  if (!candidates.length) {
    alert("No hay otras opciones disponibles para este slot.");
    return;
  }

  // Find a replacement that doesn't break tipo-de-platillo or frito rules
  const otherMeals = ["slotA", "slotB", "slotC"]
    .filter(s => s !== slot)
    .map(s => week.meals[s])
    .filter(Boolean);

  let replacement = null;
  for (const candidate of candidates) {
    const all   = [...otherMeals, candidate];
    const tipos = all.map(m => norm(m.tipoPlatillo)).filter(Boolean);
    if (new Set(tipos).size !== tipos.length) continue;
    const fritos = all.filter(m => norm(m.tipoPlatillo) === "frito").length;
    if (fritos > 1) continue;
    replacement = candidate;
    break;
  }
  // Soft fallback: just pick anything different
  if (!replacement) replacement = candidates[0];
  if (!replacement) return;

  week.meals[slot] = replacement;
  saveState();
  renderPlanner();
}

function commitWeek() {
  if (!plannerState) return;
  const { currentWeekIndex, weeks } = plannerState;
  if (currentWeekIndex >= weeks.length) return;
  weeks[currentWeekIndex].committed = true;
  plannerState.currentWeekIndex++;
  saveState();
  renderPlanner();
}

function confirmGenerateNew() {
  if (!confirm("¿Generar un nuevo calendario de 12 semanas? Esto borrará el historial actual.")) return;
  plannerState = {
    version:          2,
    generatedAt:      new Date().toISOString(),
    currentWeekIndex: 0,
    weeks:            generateSchedule(plannerMeals),
  };
  saveState();
  renderPlanner();
}

async function downloadWeek() {
  const el = document.getElementById("planner-cards");
  if (!el) return;

  if (typeof html2canvas === "undefined") {
    alert("La librería de descarga no está disponible. Revisa tu conexión.");
    return;
  }

  const btn = document.getElementById("btn-download-week");
  if (btn) { btn.textContent = "Descargando..."; btn.disabled = true; }

  try {
    const week   = plannerState?.weeks?.[plannerState.currentWeekIndex];
    const canvas = await html2canvas(el, {
      backgroundColor: "#FDF6EC",
      scale:           2,
      useCORS:         true,
      allowTaint:      false,
      logging:         false,
    });
    const link      = document.createElement("a");
    link.download   = `reina-semana-${week?.weekNum || "menu"}.png`;
    link.href       = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("Download failed:", e);
    alert("No se pudo descargar la imagen. Intenta de nuevo.");
  } finally {
    if (btn) { btn.textContent = "Descargar"; btn.disabled = false; }
  }
}
