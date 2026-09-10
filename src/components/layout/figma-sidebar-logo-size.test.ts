import { describe, expect, it } from 'vitest';

import { getFigmaSidebarLogoDisplaySize } from './figma-sidebar-logo-size';

describe('getFigmaSidebarLogoDisplaySize', () => {
  it.each([
    [32, 20],
    [48, 24],
    [64, 32],
    [72, 32],
  ])('maps configured size %i to the compact Figma size %i', (configured, expected) => {
    expect(getFigmaSidebarLogoDisplaySize(configured)).toBe(expected);
  });
});
