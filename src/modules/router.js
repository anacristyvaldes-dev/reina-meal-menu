/**
 * Simple hash-based router with bottom tab bar.
 * Pages are toggled via [data-page] sections in the HTML.
 * Special route: #super?items=id1,id2 renders a standalone shopper view.
 */
import { renderSharedShopperView } from "./grocery-views.js";

const TABS = [
  {
    id: "catalogo",
    hash: "#catalogo",
    label: "Catálogo",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`,
  },
  {
    id: "lista",
    hash: "#lista",
    label: "Lista",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/>
      <path d="M5 6l-1 1 2 2"/><path d="M5 12l-1 1 2 2"/><path d="M5 18l-1 1 2 2"/>
    </svg>`,
  },
  {
    id: "planner",
    hash: "#planner",
    label: "Menú",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
      <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>
      <path d="M8 18h.01"/><path d="M12 18h.01"/>
    </svg>`,
  },
];

const DEFAULT_TAB = "catalogo";

/**
 * Initialize the router: render tab bar, listen for hash changes.
 */
export function initRouter() {
  renderTabBar();
  window.addEventListener("hashchange", onRouteChange);
  // Handle initial load
  onRouteChange();
}

/**
 * Get the active tab id from the current hash.
 */
function getActiveTab() {
  const hash = window.location.hash;
  const tab = TABS.find((t) => t.hash === hash);
  return tab ? tab.id : DEFAULT_TAB;
}

/**
 * Handle route changes: toggle page visibility and tab active state.
 * Special case: #super?items=id1,id2 renders standalone shopper view.
 */
function onRouteChange() {
  const hash = window.location.hash;

  // Check for shared shopper link: #super?items=id1,id2
  if (hash.startsWith("#super?items=")) {
    const itemIds = hash.replace("#super?items=", "").split(",").filter(Boolean);
    if (itemIds.length > 0) {
      // Hide all pages, show the super page
      document.querySelectorAll("[data-page]").forEach((el) => {
        el.hidden = el.dataset.page !== "super";
      });
      // Hide tab bar — shopper doesn't need navigation
      document.getElementById("tab-bar").hidden = true;
      // Render the shared shopper view
      const superPage = document.querySelector('[data-page="super"]');
      if (superPage) {
        superPage.hidden = false;
        superPage.innerHTML = "";
        renderSharedShopperView(superPage, itemIds);
      }
      window.scrollTo(0, 0);
      return;
    }
  }

  // Normal tab routing
  const activeId = getActiveTab();

  // Show tab bar (in case coming back from #super)
  document.getElementById("tab-bar").hidden = false;

  // Toggle page sections
  document.querySelectorAll("[data-page]").forEach((el) => {
    el.hidden = el.dataset.page !== activeId;
  });

  // Update tab bar active states
  document.querySelectorAll("#tab-bar a[data-tab]").forEach((link) => {
    const isActive = link.dataset.tab === activeId;
    if (isActive) {
      link.className = TAB_ACTIVE;
    } else {
      link.className = TAB_INACTIVE;
    }
  });

  // Scroll to top on page switch
  window.scrollTo(0, 0);
}

// Tab style constants (same pattern as cards.js filter buttons)
const TAB_BASE =
  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full no-underline transition-colors duration-100";
const TAB_ACTIVE = `${TAB_BASE} text-terracotta`;
const TAB_INACTIVE = `${TAB_BASE} text-text-secondary`;

/**
 * Render the fixed bottom tab bar.
 */
function renderTabBar() {
  const nav = document.getElementById("tab-bar");
  if (!nav) return;

  nav.className =
    "fixed bottom-0 left-0 right-0 z-50 bg-card-bg border-t border-border flex items-center h-16 tab-bar-safe";

  TABS.forEach((tab) => {
    const link = document.createElement("a");
    link.href = tab.hash;
    link.dataset.tab = tab.id;
    link.className = TAB_INACTIVE;
    link.innerHTML = `
      ${tab.icon}
      <span class="font-label text-[0.6rem] font-bold uppercase tracking-wide leading-none">${tab.label}</span>
    `;
    nav.appendChild(link);
  });
}
