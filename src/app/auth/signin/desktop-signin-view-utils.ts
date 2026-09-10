import { convertMinIOUrlToSecureUrl } from '../../../lib/imageUtils';
import { sanitizeUrl } from '../../../lib/security';

interface DesktopSignInLogoInput {
  appLogoUrl: string | null;
  contextualLogos: {
    loginPageLogoLightMode?: string | null;
    loginPageLogoDarkMode?: string | null;
  };
  isThemeDark: boolean;
}

export function selectDesktopSignInLogoUrl({
  appLogoUrl,
  contextualLogos,
  isThemeDark,
}: DesktopSignInLogoInput) {
  if (isThemeDark && contextualLogos.loginPageLogoDarkMode?.trim()) {
    return contextualLogos.loginPageLogoDarkMode;
  }

  if (!isThemeDark && contextualLogos.loginPageLogoLightMode?.trim()) {
    return contextualLogos.loginPageLogoLightMode;
  }

  return appLogoUrl;
}

export function buildDesktopSignInSecureLogoUrl(input: DesktopSignInLogoInput) {
  const logoUrl = selectDesktopSignInLogoUrl(input);
  return logoUrl ? sanitizeUrl(convertMinIOUrlToSecureUrl(logoUrl, true) || '') : null;
}
