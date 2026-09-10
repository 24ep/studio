'use client';

import { useEffect, useState } from 'react';
import { fetchSystemProtectionEnabled } from './security-protection-utils';

/**
 * RightClickProtection
 * 
 * A client component that disables right-click context menu across the entire application
 * when the 'appRightClickProtectionEnabled' system setting is set to 'true'.
 * 
 * Default: Protection is DISABLED (value is 'false' or not set)
 */
export function RightClickProtection({ enabled }: { enabled?: boolean }) {
  const [protectionEnabled, setProtectionEnabled] = useState(enabled ?? false);

  useEffect(() => {
    if (enabled !== undefined) {
      setProtectionEnabled(enabled);
      return;
    }

    async function fetchSetting() {
      try {
        setProtectionEnabled(await fetchSystemProtectionEnabled('rightClickProtectionEnabled'));
      } catch (e) {
        console.error('[RightClickProtection] Error fetching settings:', e);
        setProtectionEnabled(false);
      }
    }

    fetchSetting();
  }, [enabled]);

  useEffect(() => {
    if (!protectionEnabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [protectionEnabled]);

  return null;
}
