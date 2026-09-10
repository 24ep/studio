const CLOSED_DIALOG_SELECTORS = [
  '[data-radix-dialog-overlay][data-state="closed"]',
  '[data-radix-alert-dialog-overlay][data-state="closed"]',
  '[data-radix-dialog-content][data-state="closed"]',
  '[data-radix-alert-dialog-content][data-state="closed"]',
];

const MODAL_PORTAL_SELECTORS = [
  '[data-Applicant-modal-portal="true"]',
  '[data-portal-container]',
];

const FORCE_REMOVAL_SELECTORS = [
  '[data-radix-dialog-overlay]',
  '[data-radix-alert-dialog-overlay]',
  '[data-radix-dialog-content]',
  '[data-radix-alert-dialog-content]',
  '[data-Applicant-modal-portal]',
  '[data-portal-container]',
  '.fixed[style*="z-index"]',
];

function removeElement(element: Element) {
  element.parentNode?.removeChild(element);
}

function removeMatchingElements(selectors: string, predicate: (element: Element) => boolean = () => true) {
  document.querySelectorAll(selectors).forEach(element => {
    if (predicate(element)) {
      removeElement(element);
    }
  });
}

function hasClosedOrMissingState(element: Element) {
  const state = element.getAttribute('data-state');
  return state === 'closed' || !state;
}

export function removeClosedModalElements() {
  removeMatchingElements(CLOSED_DIALOG_SELECTORS.join(', '));
}

export function removePortalContainers() {
  removeMatchingElements(MODAL_PORTAL_SELECTORS.join(', '));
}

export function removeClosedOverlaysAndContents() {
  removeMatchingElements(
    '[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay], [data-radix-dialog-content], [data-radix-alert-dialog-content]',
    hasClosedOrMissingState
  );
}

export function removePopoverAndSelectPortals() {
  document.querySelectorAll('[data-radix-portal]').forEach((portal) => {
    const hasPopover = portal.querySelector('[data-radix-popover-content]');
    const hasSelect = portal.querySelector('[data-radix-select-content]');
    if (hasPopover || hasSelect) {
      removeElement(portal);
    }
  });
}

export function clickExpandedFloatingTriggers() {
  document
    .querySelectorAll('[data-radix-popover-trigger][aria-expanded="true"], [data-radix-select-trigger][aria-expanded="true"]')
    .forEach((trigger) => {
      (trigger as HTMLElement).click();
    });
}

export function resetDocumentInteractionStyles() {
  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
  document.documentElement.style.pointerEvents = '';
}

export function forceDocumentReflow() {
  document.body.offsetHeight;
}

export function hasBlockingModalElements() {
  return CLOSED_DIALOG_SELECTORS.some(selector => document.querySelector(selector));
}

export function removeAllModalRelatedElements() {
  removeMatchingElements(FORCE_REMOVAL_SELECTORS.join(', '));
}
