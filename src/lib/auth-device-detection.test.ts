import { describe, expect, it } from 'vitest';

import {
  describeDevice,
  detectDevice,
  isDeviceChange,
  serializeDevice,
} from './auth-device-detection';

describe('auth device detection', () => {
  it('detects a desktop Chrome login without retaining browser versions', () => {
    const device = detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36');
    expect(device).toEqual({ type: 'desktop', os: 'Windows', browser: 'Chrome' });
  });

  it('detects mobile Safari', () => {
    const device = detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1');
    expect(device).toEqual({ type: 'mobile', os: 'iOS', browser: 'Safari' });
  });

  it('only reports a change when both comparable descriptors exist and differ', () => {
    const desktop = serializeDevice({ type: 'desktop', os: 'Windows', browser: 'Chrome' });
    const mobile = serializeDevice({ type: 'mobile', os: 'Android', browser: 'Chrome' });
    expect(isDeviceChange(desktop, desktop)).toBe(false);
    expect(isDeviceChange(desktop, mobile)).toBe(true);
    expect(isDeviceChange(null, mobile)).toBe(false);
  });

  it('describes structured and legacy device information', () => {
    const device = serializeDevice({ type: 'desktop', os: 'macOS', browser: 'Safari' });
    expect(describeDevice(device)).toBe('Safari on macOS (desktop)');
    expect(describeDevice('web')).toBe('web');
  });
});
