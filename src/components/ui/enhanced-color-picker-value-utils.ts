import type { CSSProperties } from 'react';

import { hexToRgba, isValidHex, normalizeHex } from './enhanced-color-picker-color-utils';
import { formatGradientCss, parseGradientValue } from './enhanced-color-picker-gradient-utils';
import { parseMediaValue } from './enhanced-color-picker-media-utils';
import { PRESET_TEXTURES, TEXTURE_PREVIEW_STYLE } from './enhanced-color-picker-presets';
import type { ColorMode, ColorValue } from './enhanced-color-picker-types';

const DEFAULT_SOLID_COLOR = '#000000';
const DEFAULT_TEXTURE_BACKGROUND = '#f0f0f0';

type ColorValueFormatter<T> = (colorValue: ColorValue) => T;

const valueFormatters: Record<ColorMode, ColorValueFormatter<string>> = {
  solid: (colorValue) => {
    const solidColor = getSolidColor(colorValue);
    const opacity = getSolidOpacity(colorValue);
    return opacity < 100 ? hexToRgba(solidColor, opacity) : solidColor;
  },
  gradient: (colorValue) => formatGradientCss(colorValue.gradient) || DEFAULT_SOLID_COLOR,
  texture: (colorValue) => colorValue.texture || '',
  image: (colorValue) => colorValue.image || '',
  video: (colorValue) => colorValue.video || '',
};

const previewStyleFormatters: Record<ColorMode, ColorValueFormatter<CSSProperties>> = {
  solid: (colorValue) => {
    const solidColor = getSolidColor(colorValue);
    const opacity = getSolidOpacity(colorValue);
    return {
      backgroundColor: opacity < 100 ? hexToRgba(solidColor, opacity) : solidColor,
    };
  },
  gradient: (colorValue) => {
    const gradientCss = formatGradientCss(colorValue.gradient);
    return gradientCss ? { background: gradientCss } : { backgroundColor: DEFAULT_SOLID_COLOR };
  },
  texture: (colorValue) => {
    const texture = getPresetTexture(colorValue.texture);
    return texture ? getTexturePreviewStyle(texture.pattern) : { backgroundColor: DEFAULT_TEXTURE_BACKGROUND };
  },
  image: (colorValue) => ({
    backgroundImage: colorValue.image ? `url(${colorValue.image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }),
  video: () => ({ backgroundColor: DEFAULT_SOLID_COLOR }),
};

const displayTextFormatters: Record<ColorMode, ColorValueFormatter<string>> = {
  solid: getSolidColor,
  gradient: (colorValue) => `${colorValue.gradient?.stops.length || 0} color gradient`,
  texture: (colorValue) => getPresetTexture(colorValue.texture)?.name || 'Texture',
  image: () => 'Image',
  video: () => 'Video',
};

export function getTexturePreviewStyle(pattern: string): CSSProperties {
  return {
    background: pattern,
    ...TEXTURE_PREVIEW_STYLE,
  };
}

export function parseValue(value: string | ColorValue): ColorValue {
  if (typeof value === 'object' && value !== null && 'mode' in value) {
    return value;
  }

  if (typeof value === 'string' && value.includes('gradient')) {
    const gradient = parseGradientValue(value);

    if (gradient) {
      return { mode: 'gradient', gradient };
    }
  }

  if (typeof value === 'string') {
    const mediaValue = parseMediaValue(value);

    if (mediaValue) {
      return mediaValue;
    }
  }

  const hex = typeof value === 'string' ? normalizeHex(value) : DEFAULT_SOLID_COLOR;
  return { mode: 'solid', solid: isValidHex(hex) ? hex : DEFAULT_SOLID_COLOR };
}

export function formatValue(colorValue: ColorValue): string {
  return valueFormatters[colorValue.mode]?.(colorValue) ?? DEFAULT_SOLID_COLOR;
}

export function getPreviewStyle(colorValue: ColorValue): CSSProperties {
  return previewStyleFormatters[colorValue.mode]?.(colorValue) ?? { backgroundColor: DEFAULT_SOLID_COLOR };
}

export function getDisplayText(colorValue: ColorValue): string {
  return displayTextFormatters[colorValue.mode]?.(colorValue) ?? DEFAULT_SOLID_COLOR;
}

function getSolidColor(colorValue: ColorValue) {
  return colorValue.solid || DEFAULT_SOLID_COLOR;
}

function getSolidOpacity(colorValue: ColorValue) {
  return colorValue.solidOpacity !== undefined ? colorValue.solidOpacity : 100;
}

function getPresetTexture(textureId: string | undefined) {
  return PRESET_TEXTURES.find((presetTexture) => presetTexture.id === textureId);
}
