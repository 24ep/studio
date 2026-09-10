import type { LoginPageBackgroundType, SystemSetting } from '@/lib/types';
import { convertMinIOUrlToSecureUrl } from '../../../lib/imageUtils';
import { sanitizeUrl } from '../../../lib/security';
import {
  LEGACY_LOGIN_BG_COLOR1_KEY,
  LEGACY_LOGIN_BG_COLOR2_KEY,
  LEGACY_LOGIN_BG_TYPE_KEY,
  LOGIN_BACKGROUND_COLOR_KEY,
  LOGIN_BACKGROUND_COLOR_MOBILE_KEY,
  LOGIN_BACKGROUND_GRADIENT_END_KEY,
  LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY,
  LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY,
  LOGIN_BACKGROUND_GRADIENT_START_KEY,
  LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY,
  LOGIN_BACKGROUND_IMAGE_KEY,
  LOGIN_BACKGROUND_IMAGE_MOBILE_KEY,
  LOGIN_BACKGROUND_TYPE_KEY,
  LOGIN_BACKGROUND_TYPE_MOBILE_KEY,
} from './signin-page-settings-constants';

export function getSettingValue(initialSettings: SystemSetting[], key: string) {
  return initialSettings.find((setting) => setting.key === key)?.value || null;
}

function getSecureSettingImageUrl(initialSettings: SystemSetting[], key: string) {
  const rawUrl = getSettingValue(initialSettings, key);
  return rawUrl ? sanitizeUrl(convertMinIOUrlToSecureUrl(rawUrl, true) || '') : null;
}

export function getDesktopBackgroundSettings(initialSettings: SystemSetting[]) {
  return {
    type: (
      getSettingValue(initialSettings, LOGIN_BACKGROUND_TYPE_KEY)
      || getSettingValue(initialSettings, LEGACY_LOGIN_BG_TYPE_KEY)
      || 'gradient'
    ) as LoginPageBackgroundType,
    imageUrl: getSecureSettingImageUrl(initialSettings, LOGIN_BACKGROUND_IMAGE_KEY),
    color1: getSettingValue(initialSettings, LOGIN_BACKGROUND_GRADIENT_START_KEY)
      || getSettingValue(initialSettings, LEGACY_LOGIN_BG_COLOR1_KEY),
    color2: getSettingValue(initialSettings, LOGIN_BACKGROUND_GRADIENT_END_KEY)
      || getSettingValue(initialSettings, LEGACY_LOGIN_BG_COLOR2_KEY),
    gradient: getSettingValue(initialSettings, 'loginBackgroundGradient'),
    solidColor: getSettingValue(initialSettings, LOGIN_BACKGROUND_COLOR_KEY),
  };
}

export function getMobileBackgroundSettings(initialSettings: SystemSetting[]) {
  return {
    type: getSettingValue(initialSettings, LOGIN_BACKGROUND_TYPE_MOBILE_KEY) as LoginPageBackgroundType | null,
    imageUrl: getSecureSettingImageUrl(initialSettings, LOGIN_BACKGROUND_IMAGE_MOBILE_KEY),
    color1: getSettingValue(initialSettings, LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY),
    color2: getSettingValue(initialSettings, LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY),
    gradient: getSettingValue(initialSettings, LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY),
    solidColor: getSettingValue(initialSettings, LOGIN_BACKGROUND_COLOR_MOBILE_KEY),
  };
}
