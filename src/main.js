// Styles
import "./styles/base.css";
import "./styles/header.css";
import "./styles/filters.css";
import "./styles/cards.css";
import "./styles/planner.css";
import "./styles/footer.css";

// Modules
import { getAvailableMeals } from "./modules/meals.js";
import { renderCards, setupFilters } from "./modules/cards.js";

function init() {
  const meals = getAvailableMeals();
  renderCards(meals);
  setupFilters(meals);
}

document.addEventListener("DOMContentLoaded", init);
