import {
  APP_NAME_KEY,
  APP_THEME_KEY,
  DEFAULT_LANGUAGE_KEY,
  DRAWER_STYLE_KEY,
  EVALUATE_HEADER_BACKGROUND_COLOR_KEY,
  EVALUATE_HEADER_BACKGROUND_TYPE_KEY,
  EVALUATE_HEADER_TEXT_COLOR_KEY,
  GENERATIVE_AI_CANVAS_MODE_KEY,
  HEADER_BACKGROUND_COLOR_KEY,
  HEADER_BACKGROUND_GRADIENT_KEY,
  HEADER_BACKGROUND_TYPE_KEY,
  HEADER_TEXT_COLOR_KEY,
  LOGIN_BACKGROUND_COLOR_KEY,
  LOGIN_BACKGROUND_COLOR_MOBILE_KEY,
  LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY,
  LOGIN_BACKGROUND_TYPE_KEY,
  LOGIN_BACKGROUND_TYPE_MOBILE_KEY,
  LOGIN_PAGE_LAYOUT_TYPE_KEY,
  LOGIN_PAGE_LOGO_SIZE_KEY,
  SIDEBAR_BACKGROUND_IMAGE_FIT_KEY,
  SIDEBAR_BACKGROUND_IMAGE_POSITION_KEY,
  SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY,
  SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY,
  SIDEBAR_BACKGROUND_TYPE_KEY,
  SIDEBAR_NAVIGATION_MODE_KEY,
  SIDEBAR_SECONDARY_GROUP_LABELS_KEY,
  SIDEBAR_COLOR_KEYS,
  SPLASH_ANIMATION_TYPE_KEY,
  SPLASH_BACKGROUND_COLOR_KEY,
  SPLASH_LOGO_DATA_URL_KEY,
} from './constants';
import type {
  SystemPreferenceEntry,
  SystemPreferencesSaveInput,
} from './save-form-data-types';

function pushIfValue(
  preferences: SystemPreferenceEntry[],
  key: string,
  value: string | null | undefined,
) {
  if (value) {
    preferences.push({ key, value });
  }
}

function percentValue(value: number) {
  return String(Math.min(100, Math.max(0, Math.round(value))));
}

export function buildSystemPreferenceEntries(input: SystemPreferencesSaveInput) {
  const preferencesToSave: SystemPreferenceEntry[] = [
    { key: APP_THEME_KEY, value: input.themePreference },
    { key: APP_NAME_KEY, value: input.appName },
    { key: DEFAULT_LANGUAGE_KEY, value: input.defaultLanguage },
    { key: GENERATIVE_AI_CANVAS_MODE_KEY, value: String(input.generativeAICanvasMode) },
    { key: DRAWER_STYLE_KEY, value: input.drawerStyle },
  ];

  SIDEBAR_COLOR_KEYS.forEach((key) => {
    preferencesToSave.push({ key, value: input.sidebarColors[key] });
  });

  preferencesToSave.push(
    { key: LOGIN_BACKGROUND_TYPE_KEY, value: input.loginBackgroundType },
    { key: LOGIN_BACKGROUND_COLOR_KEY, value: input.loginBackgroundColor },
    { key: LOGIN_PAGE_LAYOUT_TYPE_KEY, value: input.loginLayoutType },
    { key: LOGIN_PAGE_LOGO_SIZE_KEY, value: String(input.loginPageLogoSize) },
    { key: LOGIN_BACKGROUND_TYPE_MOBILE_KEY, value: input.loginBackgroundTypeMobile },
    { key: LOGIN_BACKGROUND_COLOR_MOBILE_KEY, value: input.loginBackgroundColorMobile },
    { key: EVALUATE_HEADER_BACKGROUND_TYPE_KEY, value: input.evaluateHeaderBackgroundType },
    { key: EVALUATE_HEADER_BACKGROUND_COLOR_KEY, value: input.evaluateHeaderBackgroundColor },
    { key: EVALUATE_HEADER_TEXT_COLOR_KEY, value: input.evaluateHeaderTextColor },
    { key: SIDEBAR_BACKGROUND_TYPE_KEY, value: input.sidebarBackgroundType },
    { key: SIDEBAR_BACKGROUND_IMAGE_FIT_KEY, value: input.sidebarImageFit },
    { key: SIDEBAR_BACKGROUND_IMAGE_POSITION_KEY, value: input.sidebarImagePosition },
    { key: SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY, value: percentValue(input.sidebarBackgroundBlurPercent) },
    { key: SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY, value: percentValue(input.sidebarBackgroundTranslucencyPercent) },
    { key: SIDEBAR_NAVIGATION_MODE_KEY, value: input.sidebarNavigationMode },
    { key: SIDEBAR_SECONDARY_GROUP_LABELS_KEY, value: JSON.stringify(input.sidebarSecondaryGroupLabels) },
    { key: HEADER_BACKGROUND_TYPE_KEY, value: input.headerBackgroundType },
    { key: HEADER_BACKGROUND_COLOR_KEY, value: input.headerBackgroundColor },
    { key: HEADER_BACKGROUND_GRADIENT_KEY, value: input.headerBackgroundGradient },
    { key: HEADER_TEXT_COLOR_KEY, value: input.headerTextColor },
    { key: SPLASH_BACKGROUND_COLOR_KEY, value: input.splashBackgroundColor },
    { key: SPLASH_ANIMATION_TYPE_KEY, value: input.splashAnimationType },
  );

  pushIfValue(preferencesToSave, 'loginBackgroundGradient', input.loginBackgroundGradient);
  pushIfValue(preferencesToSave, LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY, input.loginBackgroundGradientMobile);
  pushIfValue(preferencesToSave, 'evaluateHeaderBackgroundGradient', input.evaluateHeaderBackgroundGradient);
  pushIfValue(preferencesToSave, 'appLogoDataUrl', input.savedLogoUrl);
  pushIfValue(preferencesToSave, 'loginPageLogoLightMode', input.savedLoginPageLogoLightModeUrl);
  pushIfValue(preferencesToSave, 'loginPageLogoDarkMode', input.savedLoginPageLogoDarkModeUrl);
  pushIfValue(preferencesToSave, 'sidebarLogoCollapsedLightMode', input.savedSidebarLogoCollapsedLightModeUrl);
  pushIfValue(preferencesToSave, 'sidebarLogoExpandedLightMode', input.savedSidebarLogoExpandedLightModeUrl);
  pushIfValue(preferencesToSave, 'sidebarLogoCollapsedDarkMode', input.savedSidebarLogoCollapsedDarkModeUrl);
  pushIfValue(preferencesToSave, 'sidebarLogoExpandedDarkMode', input.savedSidebarLogoExpandedDarkModeUrl);
  pushIfValue(preferencesToSave, SPLASH_LOGO_DATA_URL_KEY, input.savedSplashLogoDataUrl);

  return preferencesToSave;
}
