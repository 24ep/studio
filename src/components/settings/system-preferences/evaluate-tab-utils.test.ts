import { describe, expect, it } from 'vitest';
import {
  EVALUATE_HEADER_BACKGROUND_TYPE_OPTIONS,
  getDefaultEvaluateHeaderGradient,
  getEvaluateHeaderPreviewImageSrc,
} from './evaluate-tab-utils';

describe('evaluate-tab-utils', () => {
  it('defines stable evaluate header background options', () => {
    expect(EVALUATE_HEADER_BACKGROUND_TYPE_OPTIONS).toEqual([
      { value: 'gradient', label: 'Gradient' },
      { value: 'image', label: 'Image' },
      { value: 'solid', label: 'Solid Color' },
    ]);
  });

  it('builds the default evaluate header gradient', () => {
    expect(getDefaultEvaluateHeaderGradient()).toMatch(/^linear-gradient/);
  });

  it('prefers preview images before saved evaluate header images', () => {
    expect(getEvaluateHeaderPreviewImageSrc('/preview.png', '/saved.png')).toBe('/preview.png');
    expect(getEvaluateHeaderPreviewImageSrc(null, '/saved.png')).toBe('/saved.png');
    expect(getEvaluateHeaderPreviewImageSrc(null, null)).toBeNull();
  });
});
