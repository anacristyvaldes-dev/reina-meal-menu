// Styles — Tailwind + design system
import "./styles/main.css";

// Modules
import { getAvailableMeals } from "./modules/meals.js";
import { renderCards, setupFilters } from "./modules/cards.js";

function init() {
  const meals = getAvailableMeals();
  renderCards(meals);
  setupFilters(meals);
}

document.addEventListener("DOMContentLoaded", init);
