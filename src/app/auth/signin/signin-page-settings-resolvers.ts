import type { LoginPageBackgroundType } from '@/lib/types';
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
} from './signin-page-settings-style';

export function getDesktopBackgroundSettings(settings: Record<string, unknown>) {
  return {
    activeLoginGradient: getStringSetting(settings, 'loginBackgroundGradient'),
    activeLoginSolidColor: getStringSetting(settings, LOGIN_BACKGROUND_COLOR_KEY),
    loginBgColor1: getStringSetting(settings, LOGIN_BACKGROUND_GRADIENT_START_KEY)
      || getStringSetting(settings, LEGACY_LOGIN_BG_COLOR1_KEY),
    loginBgColor2: getStringSetting(settings, LOGIN_BACKGROUND_GRADIENT_END_KEY)
      || getStringSetting(settings, LEGACY_LOGIN_BG_COLOR2_KEY),
    loginBgImageUrl: getSecureImageUrl(getStringSetting(settings, LOGIN_BACKGROUND_IMAGE_KEY)),
    loginBgType: (
      settings[LOGIN_BACKGROUND_TYPE_KEY] ||
      settings[LEGACY_LOGIN_BG_TYPE_KEY] ||
      'gradient'
    ) as LoginPageBackgroundType,
  };
}

export function getMobileBackgroundSettings(settings: Record<string, unknown>) {
  return {
    activeLoginGradient: getStringSetting(settings, LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY),
    activeLoginSolidColor: getStringSetting(settings, LOGIN_BACKGROUND_COLOR_MOBILE_KEY),
    loginBgColor1: getStringSetting(settings, LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY),
    loginBgColor2: getStringSetting(settings, LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY),
    loginBgImageUrl: getSecureImageUrl(getStringSetting(settings, LOGIN_BACKGROUND_IMAGE_MOBILE_KEY)),
    loginBgType: (settings[LOGIN_BACKGROUND_TYPE_MOBILE_KEY] as LoginPageBackgroundType) || null,
  };
}

export function getStringSetting(settings: Record<string, unknown>, key: string) {
  return typeof settings[key] === 'string' ? settings[key] : null;
}

function getSecureImageUrl(rawUrl: string | null) {
  return rawUrl ? sanitizeUrl(convertMinIOUrlToSecureUrl(rawUrl, true) || '') : null;
}
