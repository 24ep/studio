import * as React from 'react';

import {
  clickExpandedFloatingTriggers,
  forceDocumentReflow,
  hasBlockingModalElements,
  removeClosedModalElements,
  removeClosedOverlaysAndContents,
  removePopoverAndSelectPortals,
  removePortalContainers,
  resetDocumentInteractionStyles,
} from './modal-cleanup-dom';

function forceMonitorModalCleanup() {
  removeClosedOverlaysAndContents();
  removePopoverAndSelectPortals();
  clickExpandedFloatingTriggers();
  removeClosedModalElements();
  removePortalContainers();
  resetDocumentInteractionStyles();
  forceDocumentReflow();
}

export function useModalCleanupMonitor() {
  React.useEffect(() => {
    const checkForIssues = () => {
      if (hasBlockingModalElements()) {
        console.warn('Modal cleanup issues detected, forcing cleanup...');
        forceMonitorModalCleanup();
      }
    };

    const interval = setInterval(checkForIssues, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkForIssues, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
