import { describe, expect, it } from 'vitest';
import {
  addGradientStop,
  canRemoveGradientStopByCount,
  clampColorPickerPercent,
  createDefaultGradient,
  formatGradientCss,
  formatValue,
  getColorPickerSelectionClassName,
  getDisplayText,
  getGradientAngleLabel,
  getGradientAngleValue,
  getGradientPositionAxisLabel,
  getGradientPositionValue,
  getGradientSizeLabel,
  getGradientSizeValue,
  getGradientStopKey,
  getGradientStopOpacity,
  getMediaActionLabel,
  getMediaAccept,
  getMediaUploadLabel,
  getMediaValue,
  getPresetColorButtonClassName,
  getPreviewStyle,
  getSolidOpacity,
  getSolidOpacityLabel,
  getTexturePreviewStyle,
  getTextureTileClassName,
  hexToRgba,
  normalizeHex,
  parseValue,
  removeMediaValue,
  removeGradientStop,
  setGradientType,
  shouldShowGradientAngleControl,
  shouldShowGradientPositionControl,
  updateGradientStop,
} from './enhanced-color-picker-utils';

describe('enhanced-color-picker-utils', () => {
  it('normalizes and formats solid colors with opacity', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('3B82F6')).toBe('#3B82F6');
    expect(normalizeHex('bad')).toBe('#000000');
    expect(hexToRgba('#3B82F6', 50)).toBe('rgba(59, 130, 246, 0.5)');
    expect(formatValue({ mode: 'solid', solid: '#3B82F6', solidOpacity: 25 })).toBe('rgba(59, 130, 246, 0.25)');
  });

  it('parses and formats linear gradients with ordered stops', () => {
    const parsed = parseValue('linear-gradient(45deg, #8B5CF6 100%, #3B82F6 0%)');

    expect(parsed).toEqual({
      mode: 'gradient',
      gradient: {
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#8B5CF6', position: 100 },
          { color: '#3B82F6', position: 0 },
        ],
      },
    });
    expect(formatValue(parsed)).toBe('linear-gradient(45deg, #3B82F6 0%, #8B5CF6 100%)');
  });

  it('parses radial and conic gradients', () => {
    expect(parseValue('radial-gradient(circle 50% at 20% 80%, #000000 0%, #FFFFFF 100%)')).toMatchObject({
      mode: 'gradient',
      gradient: {
        type: 'radial',
        position: { x: 20, y: 80 },
      },
    });

    expect(parseValue('conic-gradient(from 90deg at 50% 50%, #000000 0%, #FFFFFF 100%)')).toMatchObject({
      mode: 'gradient',
      gradient: {
        type: 'conic',
        angle: 90,
      },
    });
  });

  it('formats gradient css variants and preview styles', () => {
    const gradient = createDefaultGradient([
      { color: '#FFFFFF', position: 100 },
      { color: '#000000', position: 0, opacity: 50 },
    ]);

    expect(formatGradientCss(gradient)).toBe('linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, #FFFFFF 100%)');
    expect(getPreviewStyle({ mode: 'gradient', gradient })).toEqual({
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, #FFFFFF 100%)',
    });
  });

  it('updates, adds, and removes gradient stops immutably', () => {
    const gradient = createDefaultGradient([
      { color: '#FFFFFF', position: 100 },
      { color: '#000000', position: 0 },
    ]);

    expect(updateGradientStop(gradient, 0, { position: 25 })).toMatchObject({
      stops: [
        { color: '#000000', position: 0 },
        { color: '#FFFFFF', position: 25 },
      ],
    });
    expect(gradient.stops[0]).toEqual({ color: '#FFFFFF', position: 100 });

    const expanded = addGradientStop(gradient);
    expect(expanded.stops).toEqual([
      { color: '#000000', position: 0 },
      { color: '#10B981', position: 50 },
      { color: '#FFFFFF', position: 100 },
    ]);
    expect(removeGradientStop(expanded, 1).stops).toEqual([
      { color: '#000000', position: 0 },
      { color: '#FFFFFF', position: 100 },
    ]);
    expect(removeGradientStop(gradient, 0)).toBe(gradient);
  });

  it('sets gradient type with position and size defaults', () => {
    const gradient = createDefaultGradient();

    expect(setGradientType(gradient, 'radial')).toMatchObject({
      type: 'radial',
      position: { x: 50, y: 50 },
      size: 50,
    });
    expect(setGradientType({ ...gradient, position: { x: 10, y: 90 }, size: 75 }, 'conic')).toMatchObject({
      type: 'conic',
      position: { x: 10, y: 90 },
      size: undefined,
    });
    expect(setGradientType(gradient, 'linear')).toMatchObject({
      type: 'linear',
      position: undefined,
      size: undefined,
    });
  });

  it('derives panel defaults and clamps picker percentages', () => {
    expect(clampColorPickerPercent('150')).toBe(100);
    expect(clampColorPickerPercent('-10')).toBe(0);
    expect(clampColorPickerPercent('bad', 25)).toBe(25);
    expect(getSolidOpacity({ mode: 'solid', solid: '#000000' })).toBe(100);
    expect(getSolidOpacity({ mode: 'solid', solidOpacity: 40 })).toBe(40);
    expect(getGradientStopOpacity({ color: '#000000', position: 0 })).toBe(100);
    expect(getGradientStopOpacity({ color: '#000000', position: 0, opacity: 35 })).toBe(35);
  });

  it('derives color and texture panel presentation helpers', () => {
    expect(getColorPickerSelectionClassName(true)).toBe('border-primary ring-2 ring-primary ring-offset-2');
    expect(getColorPickerSelectionClassName(false)).toBe('border-border');
    expect(getPresetColorButtonClassName(true)).toContain('w-8 h-8 rounded');
    expect(getPresetColorButtonClassName(true)).toContain('ring-2');
    expect(getTextureTileClassName(false)).toContain('h-20 rounded');
    expect(getTextureTileClassName(false)).toContain('border-border');
    expect(getTexturePreviewStyle('radial-gradient(red, blue)')).toEqual({
      background: 'radial-gradient(red, blue)',
      backgroundSize: '20px 20px',
      backgroundColor: '#f0f0f0',
    });
    expect(getSolidOpacityLabel(45)).toBe('Opacity: 45%');
  });

  it('derives gradient geometry panel controls', () => {
    const linear = createDefaultGradient();
    const radial = setGradientType(linear, 'radial');
    const conic = setGradientType({ ...linear, angle: 90 }, 'conic');

    expect(shouldShowGradientAngleControl(linear)).toBe(true);
    expect(shouldShowGradientPositionControl(linear)).toBe(false);
    expect(shouldShowGradientAngleControl(radial)).toBe(false);
    expect(shouldShowGradientPositionControl(radial)).toBe(true);
    expect(getGradientAngleValue(linear)).toBe(135);
    expect(getGradientAngleValue(conic)).toBe(90);
    expect(getGradientPositionValue(radial)).toEqual({ x: 50, y: 50 });
    expect(getGradientSizeValue(radial)).toBe(50);
    expect(getGradientStopKey({ color: '#000000', position: 10 }, 2)).toBe('#000000-10-2');
    expect(canRemoveGradientStopByCount(2)).toBe(false);
    expect(canRemoveGradientStopByCount(3)).toBe(true);
    expect(getGradientAngleLabel(135)).toBe('Angle: 135 deg');
    expect(getGradientPositionAxisLabel('X', 25)).toBe('X: 25%');
    expect(getGradientPositionAxisLabel('Y', 75)).toBe('Y: 75%');
    expect(getGradientSizeLabel(60)).toBe('Size: 60%');
  });

  it('derives media panel values and removal payloads', () => {
    expect(getMediaValue({ mode: 'image', image: '/image.png' }, 'image')).toBe('/image.png');
    expect(getMediaValue({ mode: 'video', video: '/video.mp4' }, 'video')).toBe('/video.mp4');
    expect(getMediaAccept('image')).toBe('image/*');
    expect(getMediaAccept('video')).toBe('video/*');
    expect(getMediaUploadLabel('image')).toBe('Image');
    expect(getMediaUploadLabel('video')).toBe('Video');
    expect(getMediaActionLabel('Upload', 'image')).toBe('Upload Image');
    expect(getMediaActionLabel('Remove', 'video')).toBe('Remove Video');
    expect(removeMediaValue({ mode: 'image', image: '/image.png' }, 'image')).toEqual({
      mode: 'image',
      image: '',
    });
    expect(removeMediaValue({ mode: 'video', video: '/video.mp4' }, 'video')).toEqual({
      mode: 'video',
      video: '',
    });
  });

  it('recognizes image, video, texture, and display labels', () => {
    expect(parseValue('/uploads/background.webp')).toEqual({ mode: 'image', image: '/uploads/background.webp' });
    expect(parseValue('https://example.com/clip.mp4')).toEqual({ mode: 'video', video: 'https://example.com/clip.mp4' });
    expect(getPreviewStyle({ mode: 'texture', texture: 'dots' })).toMatchObject({
      background: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    });
    expect(getDisplayText({ mode: 'texture', texture: 'grid' })).toBe('Grid');
    expect(getDisplayText({ mode: 'image', image: '/image.png' })).toBe('Image');
  });
});
