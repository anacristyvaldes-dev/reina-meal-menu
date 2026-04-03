import { nameToImagePath, filterMeals, getFilterOptions, getAvailableMeals } from "./meals.js";

/**
 * Creates a single meal card DOM element.
 */
function createCard(meal) {
  const article = document.createElement("article");
  article.className =
    "meal-card flex flex-col bg-card-bg border border-border overflow-hidden";

  const imgPath = nameToImagePath(meal.proteina);

  const tags = [meal.tipoDePlatillo, meal.tipoProteina].filter(Boolean);
  const tagHTML = tags
    .map(
      (tag) =>
        `<span class="inline-block font-body text-[0.57rem] font-bold px-2 py-0.5 rounded-full bg-tag-bg text-tag-color uppercase tracking-wide">${tag}</span>`
    )
    .join("");

  article.innerHTML = `
    <img class="w-full aspect-[3/2] object-cover block bg-placeholder" src="${imgPath}" alt="${meal.proteina}" loading="lazy">
    <div class="p-4 bg-card-body border-t border-border flex flex-col gap-2 flex-1">
      <h2 class="font-label text-[1.05rem] font-normal leading-tight text-text-primary uppercase tracking-wide">${meal.proteina}</h2>
      <div class="flex flex-wrap gap-1.5 mt-auto">${tagHTML}</div>
    </div>
  `;

  return article;
}

/**
 * Renders meal cards into #card-grid.
 */
export function renderCards(meals) {
  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";

  const visible = meals.filter((m) => m.available && m.proteina);

  const fragment = document.createDocumentFragment();
  visible.forEach((meal) => fragment.appendChild(createCard(meal)));
  grid.appendChild(fragment);
}

/**
 * Builds the filter bar dynamically from meal data and wires click handlers.
 */
export function setupFilters(allMeals) {
  const bar = document.getElementById("filter-bar");
  bar.innerHTML = "";

  const { proteins, dishTypes } = getFilterOptions(allMeals);

  // "Todos" button — starts active
  const allBtn = createFilterButton("Todos", "all");
  setActive(allBtn, true);
  bar.appendChild(allBtn);

  bar.appendChild(createDivider());

  // Protein filters
  proteins.forEach((p) => {
    const label = p.charAt(0).toUpperCase() + p.slice(1);
    const displayLabel = p === "marisco" ? "Mariscos" : label;
    bar.appendChild(createFilterButton(displayLabel, p));
  });

  bar.appendChild(createDivider());

  // Dish type filters
  dishTypes.forEach((d) => {
    const label = d.charAt(0).toUpperCase() + d.slice(1);
    bar.appendChild(createFilterButton(label, d));
  });

  // Wire click handlers
  const buttons = bar.querySelectorAll("[data-filter]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => setActive(b, false));
      setActive(btn, true);
      const filtered = filterMeals(getAvailableMeals(), btn.dataset.filter);
      renderCards(filtered);
    });
  });
}

const BASE_CLASSES =
  "font-label text-[0.78rem] font-normal uppercase tracking-wide py-1 px-3 border cursor-pointer whitespace-nowrap transition-colors duration-100";
const INACTIVE_CLASSES = "border-border bg-bg text-text-primary hover:bg-hover-bg hover:border-border-hover";
const ACTIVE_CLASSES = "bg-terracotta text-white border-terracotta";

function setActive(btn, active) {
  if (active) {
    btn.className = `${BASE_CLASSES} ${ACTIVE_CLASSES}`;
  } else {
    btn.className = `${BASE_CLASSES} ${INACTIVE_CLASSES}`;
  }
}

function createFilterButton(label, filterValue) {
  const btn = document.createElement("button");
  btn.className = `${BASE_CLASSES} ${INACTIVE_CLASSES}`;
  btn.dataset.filter = filterValue;
  btn.textContent = label;
  return btn;
}

function createDivider() {
  const div = document.createElement("span");
  div.className = "w-px h-[18px] bg-border mx-0.5 shrink-0";
  return div;
}
