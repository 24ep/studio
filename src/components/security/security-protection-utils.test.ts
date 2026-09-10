import { describe, expect, it, vi } from 'vitest';
import {
  applyProtectedContentVisibility,
  fetchSystemProtectionEnabled,
  getBooleanSystemSetting,
  isMacScreenshotShortcut,
  isOverlayScreenshotShortcut,
  isScreenshotAttemptShortcut,
  isWindowsSnippingShortcut,
  SYSTEM_SETTINGS_URL,
} from './security-protection-utils';

function keyboardEvent(input: {
  key: string;
  shiftKey?: boolean;
  metaKey?: boolean;
  osKey?: boolean;
  winKey?: boolean;
}) {
  return {
    key: input.key,
    shiftKey: Boolean(input.shiftKey),
    metaKey: Boolean(input.metaKey),
    getModifierState: (modifier: string) => (
      (modifier === 'OS' && Boolean(input.osKey)) ||
      (modifier === 'Win' && Boolean(input.winKey))
    ),
  };
}

describe('security-protection-utils', () => {
  it('reads boolean system settings from array and object responses', () => {
    expect(
      getBooleanSystemSetting({
        settings: [{ key: 'rightClickProtectionEnabled', value: 'true' }],
      }, 'rightClickProtectionEnabled')
    ).toBe(true);
    expect(getBooleanSystemSetting({ rightClickProtectionEnabled: true }, 'rightClickProtectionEnabled')).toBe(true);
    expect(getBooleanSystemSetting({ rightClickProtectionEnabled: 'false' }, 'rightClickProtectionEnabled')).toBe(false);
    expect(getBooleanSystemSetting({}, 'missing', true)).toBe(true);
  });

  it('fetches a protection setting through the provided fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        settings: [{ key: 'screenCaptureProtectionEnabled', value: 'true' }],
      }),
    });

    await expect(fetchSystemProtectionEnabled('screenCaptureProtectionEnabled', fetcher as unknown as typeof fetch))
      .resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(`${SYSTEM_SETTINGS_URL}?keys=screenCaptureProtectionEnabled`);
  });

  it('throws when protection setting fetch fails', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
    });

    await expect(fetchSystemProtectionEnabled('rightClickProtectionEnabled', fetcher as unknown as typeof fetch))
      .rejects.toThrow('Failed to fetch settings: Server error');
  });

  it('detects screenshot-related keyboard shortcuts', () => {
    expect(isOverlayScreenshotShortcut(keyboardEvent({ key: 'PrintScreen' }))).toBe(true);
    expect(isWindowsSnippingShortcut(keyboardEvent({ key: 'S', shiftKey: true, winKey: true }))).toBe(true);
    expect(isWindowsSnippingShortcut(keyboardEvent({ key: 's', shiftKey: true, osKey: true }))).toBe(true);
    expect(isMacScreenshotShortcut(keyboardEvent({ key: '4', shiftKey: true, metaKey: true }))).toBe(true);
    expect(isScreenshotAttemptShortcut(keyboardEvent({ key: '5', shiftKey: true, metaKey: true }))).toBe(true);
    expect(isScreenshotAttemptShortcut(keyboardEvent({ key: 'S', shiftKey: false, winKey: true }))).toBe(false);
  });

  it('applies and clears protected content visibility styles', () => {
    const element = {
      style: {
        filter: '',
        pointerEvents: '',
        userSelect: '',
      },
    } as HTMLElement;

    applyProtectedContentVisibility(element, true);
    expect(element.style.filter).toBe('blur(20px)');
    expect(element.style.pointerEvents).toBe('none');
    expect(element.style.userSelect).toBe('none');

    applyProtectedContentVisibility(element, false);
    expect(element.style.filter).toBe('');
    expect(element.style.pointerEvents).toBe('');
    expect(element.style.userSelect).toBe('');
  });
});
