import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  detectDevicePlatform,
  isStandaloneMode,
} from './use-device-platform';

describe('use-device-platform utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects platform from user agent and referrer inputs', () => {
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe('ios');
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)' })).toBe('android');
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('desktop');
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)' })).toBe('unknown');
  });

  it('treats standalone iOS and Android app referrers as mobile platforms', () => {
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (Macintosh)', standalone: true })).toBe('ios');
    expect(detectDevicePlatform({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', referrer: 'android-app://com.example' })).toBe('android');
  });

  it('detects standalone mode from display-mode media query', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('document', { referrer: '' });
    vi.stubGlobal('navigator', {});

    expect(isStandaloneMode()).toBe(true);
  });

  it('detects standalone mode from navigator standalone and android referrer', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal('document', { referrer: '' });
    vi.stubGlobal('navigator', { standalone: true });

    expect(isStandaloneMode()).toBe(true);

    vi.stubGlobal('navigator', { standalone: false });
    vi.stubGlobal('document', { referrer: 'android-app://com.example' });

    expect(isStandaloneMode()).toBe(true);
  });

  it('returns false outside a browser-like environment', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', undefined);

    expect(isStandaloneMode()).toBe(false);
  });
});
