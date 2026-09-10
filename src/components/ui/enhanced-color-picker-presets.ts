import type { CSSProperties } from 'react';

import type { GradientStop } from './enhanced-color-picker-types';

export const PRESET_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#F97316',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
  '#6366F1',
  '#F43F5E',
  '#14B8A6',
  '#000000',
  '#FFFFFF',
  '#808080',
];

export const PRESET_TEXTURES = [
  { id: 'dots', name: 'Dots', pattern: 'radial-gradient(circle, currentColor 1px, transparent 1px)' },
  { id: 'lines', name: 'Lines', pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)' },
  { id: 'grid', name: 'Grid', pattern: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)' },
  { id: 'diagonal', name: 'Diagonal', pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)' },
];

export const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
  { color: '#3B82F6', position: 0 },
  { color: '#8B5CF6', position: 100 },
];

export const EXPANDED_GRADIENT_STOPS: GradientStop[] = [
  { color: '#3B82F6', position: 0 },
  { color: '#8B5CF6', position: 50 },
  { color: '#EC4899', position: 100 },
];

export const DEFAULT_GRADIENT_POSITION = { x: 50, y: 50 };
export const TEXTURE_PREVIEW_STYLE: CSSProperties = {
  backgroundSize: '20px 20px',
  backgroundColor: '#f0f0f0',
};
