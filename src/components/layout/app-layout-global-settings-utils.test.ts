import { describe, expect, it, vi } from 'vitest';

import {
  clearAppLayoutTimeout,
  handleAppConfigChangedEvent,
} from './app-layout-global-settings-utils';

describe('app-layout-global-settings-utils', () => {
  it('applies sparse app config updates from custom events without overriding the Account-owned logo', () => {
    const updateAppConfig = vi.fn();
    const event = new CustomEvent('appConfigChanged', {
      detail: {
        appName: 'Acme Hiring',
        logoUrl: null,
        sidebarLogoSize: 64,
      },
    });

    handleAppConfigChangedEvent({
      event,
      isMounted: true,
      updateAppConfig,
    });

    expect(updateAppConfig).toHaveBeenCalledWith({
      currentAppName: 'Acme Hiring',
      sidebarLogoSize: 64,
    });
  });

  it('ignores app config events while unmounted or empty', () => {
    const updateAppConfig = vi.fn();

    handleAppConfigChangedEvent({
      event: new CustomEvent('appConfigChanged', { detail: { appName: 'Acme' } }),
      isMounted: false,
      updateAppConfig,
    });
    handleAppConfigChangedEvent({
      event: new CustomEvent('appConfigChanged', { detail: {} }),
      isMounted: true,
      updateAppConfig,
    });

    expect(updateAppConfig).not.toHaveBeenCalled();
  });

  it('clears pending layout timeout refs', () => {
    const timeoutRef = { current: setTimeout(() => undefined, 1000) };

    clearAppLayoutTimeout(timeoutRef);

    expect(timeoutRef.current).toBeNull();
  });
});