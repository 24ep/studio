import { hslGradientToGradientString } from './color-utils';
import { getUnderlineNavTriggerClassName } from '../../ui/underline-nav';
import {
  DEFAULT_LOGIN_BACKGROUND_GRADIENT_END,
  DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
  type DrawerStyle,
  type LoginBackgroundType,
  type LoginPageLayoutType,
} from './constants';

export type AppearanceDeviceTabId = 'desktop' | 'mobile';

export interface AppearanceSelectOption<TValue extends string> {
  value: TValue;
  label: string;
}

export const APPEARANCE_DEVICE_TABS: Array<AppearanceSelectOption<AppearanceDeviceTabId>> = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
];

export const LOGIN_BACKGROUND_TYPE_OPTIONS: Array<AppearanceSelectOption<LoginBackgroundType>> = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
  { value: 'solid', label: 'Solid Color' },
];

export const LOGIN_LAYOUT_OPTIONS: Array<AppearanceSelectOption<LoginPageLayoutType>> = [
  { value: 'center', label: 'Center' },
  { value: '2column', label: '2-Column (Right Aligned)' },
];

export const DRAWER_STYLE_OPTIONS: Array<AppearanceSelectOption<DrawerStyle>> = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
];

export function getAppearanceDeviceTabClass(isActive: boolean) {
  return getUnderlineNavTriggerClassName(isActive, 'appearance-none px-6 py-3');
}

export function getDefaultLoginBackgroundGradient() {
  return hslGradientToGradientString(
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_END
  );
}

export function getDrawerStylePreviewText(drawerStyle: DrawerStyle) {
  if (drawerStyle === 'modern') {
    return '- Drawers appear as modal-like panels on the right side with margins and rounded corners';
  }

  return '- Drawers slide in from the side and take full height';
}
