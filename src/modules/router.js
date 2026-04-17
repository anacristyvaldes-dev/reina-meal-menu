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
      <path d="M4 6.5l1.5 1.5 3-3"/><path d="M4 12.5l1.5 1.5 3-3"/><path d="M4 18.5l1.5 1.5 3-3"/>
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

  // Update tab bar active states (both mobile + desktop links)
  TABS.forEach((tab) => setTabActive(tab.id, activeId));

  // Scroll to top on page switch
  window.scrollTo(0, 0);
}

// Tab style constants (same pattern as cards.js filter buttons)
// Mobile: vertical icon+label stack; Desktop: horizontal text links
const TAB_BASE_MOBILE =
  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full no-underline transition-colors duration-100 md:hidden";
const TAB_BASE_DESKTOP =
  "hidden md:flex items-center gap-2 no-underline transition-colors duration-100 font-label text-sm font-bold uppercase tracking-wide py-2 px-4 border-b-2";

const TAB_ACTIVE_MOBILE = `${TAB_BASE_MOBILE} text-terracotta`;
const TAB_INACTIVE_MOBILE = `${TAB_BASE_MOBILE} text-text-secondary`;
const TAB_ACTIVE_DESKTOP = `${TAB_BASE_DESKTOP} border-terracotta text-terracotta`;
const TAB_INACTIVE_DESKTOP = `${TAB_BASE_DESKTOP} border-transparent text-text-secondary hover:text-text-primary`;

/**
 * Apply active/inactive classes to both mobile and desktop links for a tab.
 */
function setTabActive(tabId, activeId) {
  const isActive = tabId === activeId;
  const mobileLink = document.querySelector(`#tab-bar a[data-tab="${tabId}"][data-device="mobile"]`);
  const desktopLink = document.querySelector(`#tab-bar a[data-tab="${tabId}"][data-device="desktop"]`);
  if (mobileLink) mobileLink.className = isActive ? TAB_ACTIVE_MOBILE : TAB_INACTIVE_MOBILE;
  if (desktopLink) desktopLink.className = isActive ? TAB_ACTIVE_DESKTOP : TAB_INACTIVE_DESKTOP;
}

/**
 * Render the tab bar — bottom on mobile, top horizontal on desktop.
 */
function renderTabBar() {
  const nav = document.getElementById("tab-bar");
  if (!nav) return;

  // Container: fixed bottom on mobile, sticky top on desktop
  nav.className =
    "fixed bottom-0 left-0 right-0 z-50 bg-card-bg border-t border-border flex items-center h-16 tab-bar-safe md:static md:border-t-0 md:border-b md:h-auto md:justify-center md:gap-2 md:py-0 md:bg-bg";

  TABS.forEach((tab) => {
    // Mobile link (icon + label, vertical)
    const mobileLink = document.createElement("a");
    mobileLink.href = tab.hash;
    mobileLink.dataset.tab = tab.id;
    mobileLink.dataset.device = "mobile";
    mobileLink.className = TAB_INACTIVE_MOBILE;
    mobileLink.innerHTML = `
      ${tab.icon}
      <span class="font-label text-[0.6rem] font-bold uppercase tracking-wide leading-none">${tab.label}</span>
    `;
    nav.appendChild(mobileLink);

    // Desktop link (text only, horizontal)
    const desktopLink = document.createElement("a");
    desktopLink.href = tab.hash;
    desktopLink.dataset.tab = tab.id;
    desktopLink.dataset.device = "desktop";
    desktopLink.className = TAB_INACTIVE_DESKTOP;
    desktopLink.textContent = tab.label;
    nav.appendChild(desktopLink);
  });
}
