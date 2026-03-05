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

    // Map sheet columns to app fields
    const tags = [raw["tipo de platillo"], raw["tipo proteina"]]
      .filter(Boolean)
      .join("|");

    return {
      name: raw["proteina"] || "",
      tags,
      available: raw["available"] || "TRUE",
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
  } catch (err) {
    showError();
    console.error("Failed to load menu:", err);
  }
}

document.addEventListener("DOMContentLoaded", fetchAndRender);
