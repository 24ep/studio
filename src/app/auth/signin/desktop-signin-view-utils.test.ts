import { describe, expect, it } from 'vitest';
import { selectDesktopSignInLogoUrl } from './desktop-signin-view-utils';

describe('desktop-signin-view-utils', () => {
  it('selects contextual logos by active theme', () => {
    const contextualLogos = {
      loginPageLogoLightMode: '/light.png',
      loginPageLogoDarkMode: '/dark.png',
    };

    expect(selectDesktopSignInLogoUrl({
      appLogoUrl: '/app.png',
      contextualLogos,
      isThemeDark: false,
    })).toBe('/light.png');
    expect(selectDesktopSignInLogoUrl({
      appLogoUrl: '/app.png',
      contextualLogos,
      isThemeDark: true,
    })).toBe('/dark.png');
  });

  it('falls back to app logo when contextual logo is missing', () => {
    expect(selectDesktopSignInLogoUrl({
      appLogoUrl: '/app.png',
      contextualLogos: { loginPageLogoLightMode: ' ' },
      isThemeDark: false,
    })).toBe('/app.png');
  });
});
