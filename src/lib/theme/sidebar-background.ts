/**
 * Sidebar Background
 * Functions for managing sidebar background images and settings
 */

import { applySidebarBackgroundToCSS } from './sidebar-background-css';

export {
  applySidebarBackgroundSettings,
  applySidebarBackgroundToCSS,
} from './sidebar-background-css';
export type { SidebarBackgroundSettings } from './sidebar-background-css';

let sidebarBackgroundObserver: MutationObserver | null = null;
let sidebarBackgroundInitialized = false;

export function initializeSidebarBackground() {
  if (typeof window === 'undefined' || sidebarBackgroundInitialized) return;

  sidebarBackgroundInitialized = true;

  const initialTimeout = setTimeout(() => {
    try {
      applySidebarBackgroundToCSS();
    } catch (error) {
      console.error('Error applying initial sidebar background:', error);
    }
  }, 100);

  sidebarBackgroundObserver = createSidebarBackgroundObserver();

  try {
    sidebarBackgroundObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    console.error('Error setting up sidebar background observer:', error);
  }

  return () => {
    clearTimeout(initialTimeout);
    cleanupSidebarBackground();
  };
}

export function cleanupSidebarBackground() {
  if (sidebarBackgroundObserver) {
    sidebarBackgroundObserver.disconnect();
    sidebarBackgroundObserver = null;
  }
  sidebarBackgroundInitialized = false;
}

function createSidebarBackgroundObserver() {
  return new MutationObserver((mutations) => {
    let sidebarFound = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && !sidebarFound) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && hasSidebarElement(node)) {
            sidebarFound = true;
            scheduleSidebarBackgroundApply();
          }
        });
      }
    });
  });
}

function hasSidebarElement(node: Node) {
  const element = node as Element;
  return element.matches('[data-sidebar="sidebar"]') ||
    Boolean(element.querySelector('[data-sidebar="sidebar"]'));
}

function scheduleSidebarBackgroundApply() {
  setTimeout(() => {
    try {
      applySidebarBackgroundToCSS();
    } catch (error) {
      console.error('Error applying sidebar background after DOM change:', error);
    }
  }, 50);
}
