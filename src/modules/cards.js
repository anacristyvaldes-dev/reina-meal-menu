import { nameToImagePath, filterMeals, getFilterOptions, getAvailableMeals } from "./meals.js";

/**
 * Creates a single meal card DOM element.
 */
function createCard(meal) {
  const article = document.createElement("article");
  article.className = "meal-card";

  const imgPath = nameToImagePath(meal.proteina);

  const tags = [meal.tipoDePlatillo, meal.tipoProteina].filter(Boolean);
  const tagHTML = tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  article.innerHTML = `
    <img class="card-img" src="${imgPath}" alt="${meal.proteina}" loading="lazy">
    <div class="card-body">
      <h2 class="card-name">${meal.proteina}</h2>
      <div class="card-tags">${tagHTML}</div>
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

  // "Todos" button
  const allBtn = createFilterButton("Todos", "all");
  allBtn.classList.add("active");
  bar.appendChild(allBtn);

  // Divider
  bar.appendChild(createDivider());

  // Protein filters
  proteins.forEach((p) => {
    const label = p.charAt(0).toUpperCase() + p.slice(1);
    // Pluralize "marisco" → "Mariscos"
    const displayLabel = p === "marisco" ? "Mariscos" : label;
    bar.appendChild(createFilterButton(displayLabel, p));
  });

  // Divider
  bar.appendChild(createDivider());

  // Dish type filters
  dishTypes.forEach((d) => {
    const label = d.charAt(0).toUpperCase() + d.slice(1);
    bar.appendChild(createFilterButton(label, d));
  });

  // Wire click handlers
  const buttons = bar.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filtered = filterMeals(getAvailableMeals(), btn.dataset.filter);
      renderCards(filtered);
    });
  });
}

function createFilterButton(label, filterValue) {
  const btn = document.createElement("button");
  btn.className = "filter-btn";
  btn.dataset.filter = filterValue;
  btn.textContent = label;
  return btn;
}

function createDivider() {
  const div = document.createElement("span");
  div.className = "filter-divider";
  return div;
}
