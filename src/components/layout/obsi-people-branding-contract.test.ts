import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { normalizeAppName } from '../../lib/branding';
import { DEFAULT_APP_NAME } from '../../lib/constants';

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Obsi People branding contract', () => {
  it('uses Obsi People as the default and migrates legacy Hrive names', () => {
    expect(DEFAULT_APP_NAME).toBe('Obsi People');
    expect(normalizeAppName('hrive')).toBe('Obsi People');
    expect(normalizeAppName('HRI')).toBe('Obsi People');
    expect(normalizeAppName('fitscan')).toBe('Obsi People');
  });

  it('renders the shared header lockup as Obsi People with theme-aware emphasis', () => {
    const lockup = source('src/components/layout/HeaderBrandLockup.tsx');
    const header = source('src/components/layout/Header.tsx');

    expect(lockup).toContain('Obsi');
    expect(lockup).toContain('People');
    expect(lockup).toContain('text-foreground');
    expect(lockup).toContain('text-muted-foreground');
    expect(lockup).toContain('bg-border');
    expect(lockup).not.toContain('text-slate-500');
    expect(lockup).not.toContain('/brand/hrive-wordmark-transparent.png');
    expect(lockup).not.toContain('hrive application');
    expect(header).not.toContain('— hrive —');
  });

  it('uses Outborn Account as the only runtime authority for the application logo', () => {
    const layoutSettingsApi = source('src/components/layout/layout-system-settings-api.ts');
    const appLayoutSettings = source('src/components/layout/app-layout-settings.ts');
    const brandingSettings = source('src/components/settings/SystemPreferencesLogoSettingsCard.tsx');
    const basicSettings = source('src/components/settings/system-preferences/basic-form-utils.ts');

    expect(layoutSettingsApi).toContain("fetch('/api/outborn/application-launcher'");
    expect(layoutSettingsApi).toContain('appLogoDataUrl: accountBranding?.appLogoDataUrl ?? null');
    expect(layoutSettingsApi).not.toContain("'appLogoDataUrl', 'appName'");
    expect(appLayoutSettings).not.toContain('detail.logoUrl !== undefined');
    expect(brandingSettings).toContain('Application logo is managed by Outborn Account');
    expect(brandingSettings).not.toContain('id="appLogo"');
    expect(basicSettings).not.toContain('{ key: APP_LOGO_DATA_URL_KEY, value: appLogoUrl');
  });
});
