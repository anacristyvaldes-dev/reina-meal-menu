import mealsData from "../data/meals.json";

/**
 * Derives the image path from a meal name.
 * "Chicken Shawarma" → "/images/chicken-shawarma.png"
 */
export function nameToImagePath(name) {
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
  return `/images/${slug}.png`;
}

/** All meals from the catalog. */
export function getAllMeals() {
  return mealsData;
}

/** Only meals marked as available. */
export function getAvailableMeals() {
  return mealsData.filter((m) => m.available && m.proteina);
}

/** Look up a meal by its slug ID. */
export function getMealById(id) {
  return mealsData.find((m) => m.id === id) || null;
}

/**
 * Filter meals by a filter value.
 * Matches against tipoProteina OR tipoDePlatillo.
 * Supports pipe-separated values: "asado|plancha"
 */
export function filterMeals(meals, filterValue) {
  if (filterValue === "all") return meals;

  const filterValues = filterValue
    .toLowerCase()
    .split("|")
    .map((f) => f.trim());

  return meals.filter((m) => {
    const tags = [m.tipoDePlatillo, m.tipoProteina]
      .filter(Boolean)
      .map((t) => t.toLowerCase().trim());
    return filterValues.some((f) => tags.includes(f));
  });
}

/**
 * Derive unique filter options from the actual meal data.
 * Returns { proteins: [...], dishTypes: [...] }
 */
export function getFilterOptions(meals) {
  const proteins = [...new Set(meals.map((m) => m.tipoProteina).filter(Boolean))];
  const dishTypes = [...new Set(meals.map((m) => m.tipoDePlatillo).filter(Boolean))];
  return { proteins, dishTypes };
}
