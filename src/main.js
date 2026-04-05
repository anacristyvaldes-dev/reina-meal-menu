// Styles — Tailwind + design system
import "./styles/main.css";

// Modules
import { getAvailableMeals } from "./modules/meals.js";
import { renderCards, setupFilters } from "./modules/cards.js";
import { initGroceries } from "./modules/grocery-views.js";
import { initRouter } from "./modules/router.js";

function init() {
  const meals = getAvailableMeals();
  renderCards(meals);
  setupFilters(meals);
  initGroceries();
  initRouter(); // must be last — toggles page visibility after content is rendered
}

document.addEventListener("DOMContentLoaded", init);
