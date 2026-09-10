import type { SystemSetting } from '@/lib/types';
import { setThemeAndColors } from '../../../lib/themeUtils';
import {
  DEFAULT_PRIMARY_GRADIENT_END_SIGNIN,
  DEFAULT_PRIMARY_GRADIENT_START_SIGNIN,
} from './signin-page-utils';
import { getSettingValue } from './signin-page-settings-background';

export function applySignInThemeSettings(initialSettings: SystemSetting[]) {
  const primaryGradient = getSettingValue(initialSettings, 'primaryGradient');
  const primaryStart = getSettingValue(initialSettings, 'primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
  const primaryEnd = getSettingValue(initialSettings, 'primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
  const themePref = (getSettingValue(initialSettings, 'appThemePreference') as 'system' | 'light' | 'dark') || 'system';

  setThemeAndColors({
    themePreference: themePref,
    primaryGradient: primaryGradient || null,
    primaryGradientStart: primaryStart,
    primaryGradientEnd: primaryEnd,
  });
}
