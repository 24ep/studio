import { describe, expect, it } from 'vitest';

import { SECURITY_CONTROL_ITEMS } from './security-controls-tab-config';

describe('security controls tab config', () => {
  it('defines unique switch ids and state keys', () => {
    expect(new Set(SECURITY_CONTROL_ITEMS.map(item => item.id)).size).toBe(SECURITY_CONTROL_ITEMS.length);
    expect(new Set(SECURITY_CONTROL_ITEMS.map(item => item.key)).size).toBe(SECURITY_CONTROL_ITEMS.length);
  });

  it('includes the expected security controls', () => {
    expect(SECURITY_CONTROL_ITEMS.map(item => item.key)).toEqual([
      'screenCaptureProtectionEnabled',
      'rightClickProtectionEnabled',
      'loginPageDevToolsProtectionEnabled',
      'globalTwoFactorEnabled',
    ]);
  });
});
