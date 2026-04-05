import staplesData from "../data/staples.json";
import breakfastDinnerData from "../data/breakfast-dinner.json";

const STORAGE_KEY = "reina_groceries_v1";

/**
 * Get the active breakfast/dinner version (A or B).
 */
export function getActiveVersion() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      return state.activeVersion || "A";
    }
  } catch {}
  return breakfastDinnerData.activeVersion || "A";
}

/**
 * Set the active breakfast/dinner version.
 */
export function setActiveVersion(version) {
  const state = loadGroceryState();
  state.activeVersion = version;
  saveGroceryState(state);
}

/**
 * Get the version metadata (label, description, highlights).
 */
export function getVersionInfo(versionId) {
  return breakfastDinnerData.versions.find((v) => v.id === versionId) || null;
}

/**
 * Get all available versions.
 */
export function getAllVersions() {
  return breakfastDinnerData.versions;
}

/**
 * Build the grocery list for the active version.
 * Returns items filtered by stapleSet: "both" + items matching the active version.
 * Each item includes check state from localStorage.
 */
export function buildGroceryList(version) {
  const v = version || getActiveVersion();
  const state = loadGroceryState();
  const checks = state.checks || {};

  const items = staplesData.items
    .filter((item) => item.stapleSet === "both" || item.stapleSet === v)
    .map((item) => ({
      ...item,
      checked: checks[item.id] || "unchecked", // "unchecked" | "hay" | "falta"
      note: v === "A" ? item.noteA || item.note || "" : item.noteB || item.note || "",
    }));

  return items;
}

/**
 * Get items grouped by a key (kitchenZone or storeSection).
 */
export function groupBy(items, key) {
  const groups = {};
  // Use the defined order from staples.json
  const orderedKeys =
    key === "kitchenZone" ? staplesData.kitchenZones : staplesData.storeSections;

  // Initialize groups in order
  orderedKeys.forEach((k) => {
    groups[k] = [];
  });

  items.forEach((item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });

  // Remove empty groups
  for (const k of Object.keys(groups)) {
    if (groups[k].length === 0) delete groups[k];
  }

  return groups;
}

/**
 * Get the helper view: all items grouped by kitchen zone.
 */
export function getHelperView(version) {
  const items = buildGroceryList(version);
  return groupBy(items, "kitchenZone");
}

/**
 * Get the shopper view: only items marked "falta", grouped by store section.
 */
export function getShopperView(version) {
  const items = buildGroceryList(version).filter((item) => item.checked === "falta");
  return groupBy(items, "storeSection");
}

/**
 * Update the check state of an item.
 * status: "unchecked" | "hay" | "falta"
 */
export function setItemCheck(itemId, status) {
  const state = loadGroceryState();
  if (!state.checks) state.checks = {};
  state.checks[itemId] = status;
  saveGroceryState(state);
}

/**
 * Get items by an array of IDs (for shared shopper links).
 * Returns items with storeSection preserved, ordered by store section.
 */
export function getItemsByIds(ids) {
  const idSet = new Set(ids);
  const items = staplesData.items.filter((item) => idSet.has(item.id));

  // Sort by store section order
  const sectionOrder = staplesData.storeSections;
  items.sort(
    (a, b) =>
      sectionOrder.indexOf(a.storeSection) - sectionOrder.indexOf(b.storeSection)
  );

  return items;
}

/**
 * Reset all checks (start fresh for a new week).
 */
export function resetAllChecks() {
  const state = loadGroceryState();
  state.checks = {};
  saveGroceryState(state);
}

// ── Persistence ──

function loadGroceryState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { activeVersion: "A", checks: {} };
  } catch {
    return { activeVersion: "A", checks: {} };
  }
}

function saveGroceryState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save grocery state:", e);
  }
}
