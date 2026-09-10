import type { CSSProperties } from 'react';

import type { LoginPageBackgroundType } from '@/lib/types';
import {
  DEFAULT_LOGIN_BG_GRADIENT,
  DEFAULT_LOGIN_BG_GRADIENT_DARK,
} from './signin-page-settings-constants';

interface BuildLoginPageStyleInput {
  isThemeDark: boolean;
  loginBgType: LoginPageBackgroundType;
  loginBgImageUrl: string | null;
  loginBgColor1: string | null;
  loginBgColor2: string | null;
  activeLoginGradient: string | null;
  activeLoginSolidColor: string | null;
}

export function buildLoginPageStyle({
  isThemeDark,
  loginBgType,
  loginBgImageUrl,
  loginBgColor1,
  loginBgColor2,
  activeLoginGradient,
  activeLoginSolidColor,
}: BuildLoginPageStyleInput): CSSProperties {
  const style: CSSProperties = {
    transition: 'background 0.5s ease-in-out',
  };

  if (loginBgType === 'image' && loginBgImageUrl) {
    style.backgroundImage = `url("${loginBgImageUrl}")`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.backgroundRepeat = 'no-repeat';
    return style;
  }

  if (loginBgType === 'solid') {
    const solidColor = activeLoginSolidColor || loginBgColor1;
    if (solidColor) {
      style.backgroundColor = solidColor.includes(' ') ? `hsl(${solidColor})` : solidColor;
    }
    return style;
  }

  if (loginBgType === 'gradient') {
    if (activeLoginGradient) {
      style.background = activeLoginGradient;
    } else if (loginBgColor1 && loginBgColor2) {
      style.backgroundImage = `linear-gradient(135deg, hsl(${loginBgColor1}), hsl(${loginBgColor2}))`;
    } else {
      style.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
    }
    return style;
  }

  style.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
  return style;
}
