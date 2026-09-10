/**
 * Global modal cleanup utilities to prevent page from becoming unclickable.
 */

import {
  clickExpandedFloatingTriggers,
  forceDocumentReflow,
  hasBlockingModalElements,
  removeAllModalRelatedElements,
  removeClosedModalElements,
  removeClosedOverlaysAndContents,
  removePopoverAndSelectPortals,
  removePortalContainers,
  resetDocumentInteractionStyles,
} from './modal-cleanup-dom';
export { useModalCleanupMonitor } from './modal-cleanup-monitor';

declare global {
  interface Window {
    emergencyModalCleanup?: typeof emergencyModalCleanup;
    cleanupAllModals?: typeof cleanupAllModals;
    forceModalCleanup?: typeof forceModalCleanup;
  }
}

export function cleanupAllModals() {
  removeClosedModalElements();
  removePortalContainers();
  resetDocumentInteractionStyles();
  forceDocumentReflow();
}

export function checkForBlockingModals(): boolean {
  return hasBlockingModalElements();
}

export function forceModalCleanup() {
  removeClosedOverlaysAndContents();
  removePopoverAndSelectPortals();
  clickExpandedFloatingTriggers();
  cleanupAllModals();
  resetDocumentInteractionStyles();
  forceDocumentReflow();
}

export function emergencyModalCleanup() {
  removeAllModalRelatedElements();
  resetDocumentInteractionStyles();
  forceDocumentReflow();
}

if (typeof window !== 'undefined') {
  window.emergencyModalCleanup = emergencyModalCleanup;
  window.cleanupAllModals = cleanupAllModals;
  window.forceModalCleanup = forceModalCleanup;
}
