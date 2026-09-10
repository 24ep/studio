import { describe, expect, it } from 'vitest';
import {
  getPwaInstallInstructions,
  getPwaInstallPromptDelay,
  isAndroidTabletUserAgent,
  isMobileOrTabletDevice,
  isPwaEnabledFromSettings,
  normalizeSystemSettingsResponse,
  shouldShowDelayedPwaPrompt,
  shouldTreatPwaAsInstalled,
} from './pwa-install-utils';

describe('pwa-install-utils', () => {
  it('normalizes settings responses from arrays or plain objects', () => {
    expect(
      normalizeSystemSettingsResponse({
        settings: [
          { key: 'pwaEnabled', value: 'true' },
          { key: 'appName', value: 'Studio' },
        ],
      })
    ).toEqual({ pwaEnabled: 'true', appName: 'Studio' });
    expect(normalizeSystemSettingsResponse({ pwaEnabled: 'false' })).toEqual({ pwaEnabled: 'false' });
    expect(normalizeSystemSettingsResponse(null)).toEqual({});
  });

  it('detects whether PWA install support is enabled', () => {
    expect(isPwaEnabledFromSettings({ settings: [{ key: 'pwaEnabled', value: 'true' }] })).toBe(true);
    expect(isPwaEnabledFromSettings({ pwaEnabled: 'false' })).toBe(false);
  });

  it('detects Android tablets and mobile/tablet eligibility', () => {
    expect(isAndroidTabletUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel Tablet)')).toBe(true);
    expect(isAndroidTabletUserAgent('Mozilla/5.0 (Linux; Android 13; Mobile)')).toBe(false);
    expect(isMobileOrTabletDevice({ isMobileDevice: false, userAgent: 'Android Tablet', innerWidth: 1200 })).toBe(true);
    expect(isMobileOrTabletDevice({ isMobileDevice: false, userAgent: 'Desktop', innerWidth: 1024 })).toBe(true);
    expect(isMobileOrTabletDevice({ isMobileDevice: false, userAgent: 'Desktop', innerWidth: 1200 })).toBe(false);
  });

  it('chooses the delayed prompt timing', () => {
    expect(getPwaInstallPromptDelay('android', 'Desktop')).toBe(2000);
    expect(getPwaInstallPromptDelay('desktop', 'Android')).toBe(2000);
    expect(getPwaInstallPromptDelay('ios', 'iPhone')).toBe(3000);
  });

  it('derives installed and delayed prompt states from storage flags', () => {
    expect(shouldTreatPwaAsInstalled({ isStandalone: true, installAccepted: null })).toBe(true);
    expect(shouldTreatPwaAsInstalled({ isStandalone: false, installAccepted: 'true' })).toBe(true);
    expect(shouldTreatPwaAsInstalled({ isStandalone: false, installAccepted: null })).toBe(false);

    expect(
      shouldShowDelayedPwaPrompt({
        isStandalone: false,
        installAccepted: null,
        installDismissed: null,
        isMobileOrTablet: true,
      })
    ).toBe(true);
    expect(
      shouldShowDelayedPwaPrompt({
        isStandalone: false,
        installAccepted: null,
        installDismissed: 'true',
        isMobileOrTablet: true,
      })
    ).toBe(false);
    expect(
      shouldShowDelayedPwaPrompt({
        isStandalone: false,
        installAccepted: null,
        installDismissed: null,
        isMobileOrTablet: false,
      })
    ).toBe(false);
  });

  it('returns platform-specific install instructions', () => {
    expect(getPwaInstallInstructions('ios')).toContain('Add to Home Screen');
    expect(getPwaInstallInstructions('android')).toContain('Install app');
    expect(getPwaInstallInstructions('desktop')).toContain('browser');
  });
});
