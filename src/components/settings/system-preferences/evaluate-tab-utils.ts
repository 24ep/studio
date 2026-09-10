import { hslGradientToGradientString } from './color-utils';
import {
  DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END,
  DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
  type EvaluateHeaderBackgroundType,
} from './constants';

export interface EvaluateSelectOption<TValue extends string> {
  value: TValue;
  label: string;
}

export const EVALUATE_HEADER_BACKGROUND_TYPE_OPTIONS: Array<EvaluateSelectOption<EvaluateHeaderBackgroundType>> = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
  { value: 'solid', label: 'Solid Color' },
];

export function getDefaultEvaluateHeaderGradient() {
  return hslGradientToGradientString(
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END
  );
}

export function getEvaluateHeaderPreviewImageSrc(
  previewUrl: string | null,
  savedImageUrl: string | null
) {
  return previewUrl || savedImageUrl || null;
}
