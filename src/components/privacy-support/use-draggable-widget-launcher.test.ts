import { describe, expect, it } from 'vitest';

import { clampLauncherPosition } from './use-draggable-widget-launcher';

describe('clampLauncherPosition', () => {
  it('keeps the launcher inside every viewport edge', () => {
    expect(clampLauncherPosition({ x: -50, y: 900 }, 166, 48, 1280, 720)).toEqual({
      x: 8,
      y: 664,
    });
  });

  it('preserves a position that is already visible', () => {
    expect(clampLauncherPosition({ x: 420, y: 300 }, 166, 48, 1280, 720)).toEqual({
      x: 420,
      y: 300,
    });
  });
});
