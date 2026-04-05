import {
  getHelperView,
  getShopperView,
  setItemCheck,
  resetAllChecks,
  getActiveVersion,
  setActiveVersion,
  getAllVersions,
  buildGroceryList,
} from "./groceries.js";

let currentTab = "helper"; // "helper" | "shopper"

/**
 * Initialize the grocery section.
 */
export function initGroceries() {
  renderGrocerySection();
}

/**
 * Main render — builds the entire grocery section.
 */
function renderGrocerySection() {
  const container = document.getElementById("grocery-section");
  if (!container) return;

  const version = getActiveVersion();
  const versions = getAllVersions();
  const currentVersion = versions.find((v) => v.id === version);

  container.innerHTML = "";

  // Header row
  const header = document.createElement("div");
  header.className = "max-w-[1440px] mx-auto px-6 sm:px-10 pt-10 pb-6";
  header.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="font-display text-4xl text-terracotta tracking-wide leading-none">Lista del Súper</h2>
        <p class="font-body text-xs font-semibold tracking-widest uppercase text-text-secondary mt-1.5">
          ${currentVersion?.description || ""}
        </p>
      </div>
      <div class="flex gap-2 items-center">
        ${versions
          .map(
            (v) => `
          <button data-version="${v.id}"
            class="font-label text-xs font-bold uppercase tracking-wide py-1.5 px-4 border cursor-pointer transition-colors duration-100
            ${v.id === version
              ? "bg-terracotta text-white border-terracotta"
              : "border-border bg-bg text-text-primary hover:bg-hover-bg hover:border-border-hover"
            }">
            ${v.label}
          </button>
        `
          )
          .join("")}
      </div>
    </div>

    <!-- Tab bar -->
    <div class="flex border-b border-border mb-6">
      <button data-tab="helper"
        class="tab-btn font-label text-sm uppercase tracking-wide py-2.5 px-5 border-b-2 cursor-pointer transition-colors duration-100
        ${currentTab === "helper" ? "border-terracotta text-terracotta font-bold" : "border-transparent text-text-secondary hover:text-text-primary"}">
        Revisión
      </button>
      <button data-tab="shopper"
        class="tab-btn font-label text-sm uppercase tracking-wide py-2.5 px-5 border-b-2 cursor-pointer transition-colors duration-100
        ${currentTab === "shopper" ? "border-terracotta text-terracotta font-bold" : "border-transparent text-text-secondary hover:text-text-primary"}">
        Súper
      </button>
    </div>
  `;

  container.appendChild(header);

  // Content area
  const content = document.createElement("div");
  content.id = "grocery-content";
  content.className = "max-w-[1440px] mx-auto px-6 sm:px-10 pb-10";
  container.appendChild(content);

  if (currentTab === "helper") {
    renderHelperView(content, version);
  } else {
    renderShopperView(content, version);
  }

  // Wire version toggle
  header.querySelectorAll("[data-version]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveVersion(btn.dataset.version);
      renderGrocerySection();
    });
  });

  // Wire tab toggle
  header.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      renderGrocerySection();
    });
  });
}

/**
 * Helper view — grouped by kitchen zones.
 * Each item: tap to cycle unchecked → hay → falta.
 */
function renderHelperView(container, version) {
  const groups = getHelperView(version);
  const allItems = buildGroceryList(version);
  const checkedCount = allItems.filter((i) => i.checked !== "unchecked").length;

  // Progress bar
  const progress = document.createElement("div");
  progress.className = "mb-6";
  progress.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <span class="font-body text-xs text-text-secondary uppercase tracking-wide">${checkedCount} de ${allItems.length} revisados</span>
      <button id="btn-reset-checks" class="font-label text-xs uppercase tracking-wide text-text-secondary hover:text-terracotta cursor-pointer transition-colors">
        Reiniciar
      </button>
    </div>
    <div class="w-full h-1.5 bg-border rounded-full overflow-hidden">
      <div class="h-full bg-terracotta rounded-full transition-all duration-300" style="width: ${allItems.length ? (checkedCount / allItems.length) * 100 : 0}%"></div>
    </div>
  `;
  container.appendChild(progress);

  progress.querySelector("#btn-reset-checks").addEventListener("click", () => {
    if (confirm("¿Reiniciar toda la revisión?")) {
      resetAllChecks();
      renderGrocerySection();
    }
  });

  // Groups
  for (const [zone, items] of Object.entries(groups)) {
    const section = document.createElement("div");
    section.className = "mb-6";

    section.innerHTML = `
      <h3 class="font-label text-sm font-bold uppercase tracking-wide text-text-secondary mb-3 pb-1.5 border-b border-border">${zone}</h3>
    `;

    const list = document.createElement("div");
    list.className = "flex flex-col gap-1";

    items.forEach((item) => {
      const row = createHelperRow(item);
      list.appendChild(row);
    });

    section.appendChild(list);
    container.appendChild(section);
  }
}

/**
 * Creates a single helper checklist row.
 * Tap cycles: unchecked → hay → falta → unchecked
 */
function createHelperRow(item) {
  const row = document.createElement("button");
  row.className = `flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-100
    ${item.checked === "hay" ? "bg-green-50" : item.checked === "falta" ? "bg-red-50" : "hover:bg-hover-bg"}`;

  const icon =
    item.checked === "hay"
      ? `<span class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>`
      : item.checked === "falta"
        ? `<span class="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center text-xs font-bold shrink-0">✗</span>`
        : `<span class="w-6 h-6 rounded-full border-2 border-border shrink-0"></span>`;

  const noteHTML = item.note
    ? `<span class="font-body text-[0.65rem] text-text-secondary ml-1">(${item.note})</span>`
    : "";

  row.innerHTML = `
    ${icon}
    <span class="font-body text-sm ${item.checked === "hay" ? "text-text-secondary line-through" : "text-text-primary"}">${item.name}${noteHTML}</span>
    ${item.checked === "falta" ? '<span class="ml-auto font-label text-[0.6rem] uppercase tracking-wider text-terracotta font-bold">Falta</span>' : ""}
    ${item.checked === "hay" ? '<span class="ml-auto font-label text-[0.6rem] uppercase tracking-wider text-green-600 font-bold">Hay</span>' : ""}
  `;

  row.addEventListener("click", () => {
    const next =
      item.checked === "unchecked"
        ? "hay"
        : item.checked === "hay"
          ? "falta"
          : "unchecked";
    setItemCheck(item.id, next);
    renderGrocerySection();
  });

  return row;
}

/**
 * Shopper view — only items marked "falta", grouped by store section.
 */
function renderShopperView(container, version) {
  const groups = getShopperView(version);
  const faltaItems = buildGroceryList(version).filter((i) => i.checked === "falta");

  if (faltaItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="font-body text-sm text-text-secondary">No hay artículos marcados como "Falta".</p>
        <p class="font-body text-xs text-text-secondary mt-2">Ve a <strong>Revisión</strong> y revisa la cocina primero.</p>
      </div>
    `;
    return;
  }

  // Count
  const countEl = document.createElement("p");
  countEl.className = "font-body text-xs text-text-secondary uppercase tracking-wide mb-6";
  countEl.textContent = `${faltaItems.length} artículo${faltaItems.length !== 1 ? "s" : ""} por comprar`;
  container.appendChild(countEl);

  // Share button
  const shareRow = document.createElement("div");
  shareRow.className = "mb-6";
  shareRow.innerHTML = `
    <button id="btn-share-list" class="font-label text-xs font-bold uppercase tracking-wide py-2 px-5 bg-terracotta text-white border border-terracotta cursor-pointer hover:bg-terracotta-dark transition-colors duration-100">
      Compartir lista
    </button>
  `;
  container.appendChild(shareRow);

  shareRow.querySelector("#btn-share-list").addEventListener("click", () => {
    shareShopperList(faltaItems);
  });

  for (const [section, items] of Object.entries(groups)) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "mb-6";

    sectionEl.innerHTML = `
      <h3 class="font-label text-sm font-bold uppercase tracking-wide text-text-secondary mb-3 pb-1.5 border-b border-border">${section}</h3>
    `;

    const list = document.createElement("div");
    list.className = "flex flex-col gap-1";

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center gap-3 py-2.5 px-3";

      const noteHTML = item.note
        ? `<span class="font-body text-[0.65rem] text-text-secondary ml-1">(${item.note})</span>`
        : "";

      row.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-terracotta shrink-0"></span>
        <span class="font-body text-sm text-text-primary">${item.name}${noteHTML}</span>
      `;

      list.appendChild(row);
    });

    sectionEl.appendChild(list);
    container.appendChild(sectionEl);
  }
}

/**
 * Share the shopper list via Web Share API or clipboard fallback.
 */
async function shareShopperList(items) {
  // Build plain text list grouped by store section
  const grouped = {};
  items.forEach((item) => {
    const section = item.storeSection;
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item.name);
  });

  let text = "🛒 Lista del Súper — Reina\n\n";
  for (const [section, names] of Object.entries(grouped)) {
    text += `📍 ${section}\n`;
    names.forEach((name) => {
      text += `  • ${name}\n`;
    });
    text += "\n";
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: "Lista del Súper", text });
      return;
    } catch {}
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    alert("Lista copiada al portapapeles");
  } catch {
    alert("No se pudo compartir la lista");
  }
}
