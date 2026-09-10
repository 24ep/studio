import type { DevicePlatform } from '../../hooks/use-device-platform';
export { isPwaEnabledFromSettings, normalizeSystemSettingsResponse } from './pwa-settings-utils';

export const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
export const PWA_INSTALL_ACCEPTED_KEY = 'pwa-install-accepted';

export function isAndroidTabletUserAgent(userAgent: string) {
  return /android/i.test(userAgent) && !/mobile/i.test(userAgent);
}

export function isMobileOrTabletDevice({
  isMobileDevice,
  userAgent,
  innerWidth,
}: {
  isMobileDevice: boolean;
  userAgent: string;
  innerWidth: number;
}) {
  return isMobileDevice || isAndroidTabletUserAgent(userAgent) || innerWidth <= 1024;
}

export function getPwaInstallPromptDelay(devicePlatform: DevicePlatform, userAgent: string) {
  return devicePlatform === 'android' || /android/i.test(userAgent) ? 2000 : 3000;
}

export function shouldTreatPwaAsInstalled({
  isStandalone,
  installAccepted,
}: {
  isStandalone: boolean;
  installAccepted: string | null;
}) {
  return isStandalone || installAccepted === 'true';
}

export function shouldShowDelayedPwaPrompt({
  isStandalone,
  installAccepted,
  installDismissed,
  isMobileOrTablet,
}: {
  isStandalone: boolean;
  installAccepted: string | null;
  installDismissed: string | null;
  isMobileOrTablet: boolean;
}) {
  return isMobileOrTablet && !isStandalone && installAccepted !== 'true' && installDismissed !== 'true';
}

export function getPwaInstallInstructions(devicePlatform: DevicePlatform) {
  if (devicePlatform === 'ios') {
    return 'To install: Tap the share button and select "Add to Home Screen"';
  }

  if (devicePlatform === 'android') {
    return 'To install: Tap the menu (...) and select "Install app" or "Add to Home screen"';
  }

  return "To install: Use your browser's install option in the address bar";
}
