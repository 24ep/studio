import type {
    LoadedSystemPreferenceStateSetters,
    LoadedSystemPreferencesState,
} from './loaded-state-types';

export function applyLoadedSystemPreferenceState(
    loadedPreferences: LoadedSystemPreferencesState,
    setters: LoadedSystemPreferenceStateSetters
) {
    setters.setThemePreference(loadedPreferences.themePreference);
    setters.setAppName(loadedPreferences.appName);
    setters.setSavedLogoUrl(loadedPreferences.appLogoDataUrl);
    setters.setLogoPreviewUrl(loadedPreferences.appLogoDataUrl);
    setters.setSavedLoginPageLogoLightModeUrl(loadedPreferences.loginPageLogoLightMode);
    setters.setLoginPageLogoLightModePreviewUrl(loadedPreferences.loginPageLogoLightMode);
    setters.setSavedLoginPageLogoDarkModeUrl(loadedPreferences.loginPageLogoDarkMode);
    setters.setLoginPageLogoDarkModePreviewUrl(loadedPreferences.loginPageLogoDarkMode);
    setters.setSavedSidebarLogoCollapsedLightModeUrl(loadedPreferences.sidebarLogoCollapsedLightMode);
    setters.setSidebarLogoCollapsedLightModePreviewUrl(loadedPreferences.sidebarLogoCollapsedLightMode);
    setters.setSavedSidebarLogoExpandedLightModeUrl(loadedPreferences.sidebarLogoExpandedLightMode);
    setters.setSidebarLogoExpandedLightModePreviewUrl(loadedPreferences.sidebarLogoExpandedLightMode);
    setters.setSavedSidebarLogoCollapsedDarkModeUrl(loadedPreferences.sidebarLogoCollapsedDarkMode);
    setters.setSidebarLogoCollapsedDarkModePreviewUrl(loadedPreferences.sidebarLogoCollapsedDarkMode);
    setters.setSavedSidebarLogoExpandedDarkModeUrl(loadedPreferences.sidebarLogoExpandedDarkMode);
    setters.setSidebarLogoExpandedDarkModePreviewUrl(loadedPreferences.sidebarLogoExpandedDarkMode);
    setters.setShowLogoOnly(loadedPreferences.showLogoOnly);
    setters.setLoginBackgroundType(loadedPreferences.loginBackgroundType);
    setters.setSavedLoginImageDataUrl(loadedPreferences.loginBackgroundImage);
    setters.setLoginImagePreviewUrl(loadedPreferences.loginBackgroundImage);
    setters.setLoginBackgroundGradient(loadedPreferences.loginBackgroundGradient);
    setters.setLoginBackgroundColor(loadedPreferences.loginBackgroundColor);
    setters.setLoginPageLogoSize(loadedPreferences.loginPageLogoSize);
    setters.setLoginLayoutType(loadedPreferences.loginLayoutType);
    setters.setLoginBackgroundTypeMobile(loadedPreferences.loginBackgroundTypeMobile);
    setters.setSavedLoginImageDataUrlMobile(loadedPreferences.loginBackgroundImageMobile);
    setters.setLoginImagePreviewUrlMobile(loadedPreferences.loginBackgroundImageMobile);
    setters.setLoginBackgroundGradientMobile(loadedPreferences.loginBackgroundGradientMobile);
    setters.setLoginBackgroundColorMobile(loadedPreferences.loginBackgroundColorMobile);
    setters.setEvaluateHeaderBackgroundType(loadedPreferences.evaluateHeaderBackgroundType);
    setters.setSavedEvaluateHeaderImageDataUrl(loadedPreferences.evaluateHeaderBackgroundImage);
    setters.setEvaluateHeaderImagePreviewUrl(loadedPreferences.evaluateHeaderBackgroundImage);
    setters.setEvaluateHeaderBackgroundGradient(loadedPreferences.evaluateHeaderBackgroundGradient);
    setters.setEvaluateHeaderBackgroundColor(loadedPreferences.evaluateHeaderBackgroundColor);
    setters.setEvaluateHeaderTextColor(loadedPreferences.evaluateHeaderTextColor);
    setters.setSavedEvaluatePlatformLogoUrl(loadedPreferences.evaluatePlatformLogoDataUrl);
    setters.setEvaluatePlatformLogoPreviewUrl(loadedPreferences.evaluatePlatformLogoDataUrl);
    setters.setSavedEvaluateReportLogoUrl(loadedPreferences.evaluateReportLogoDataUrl);
    setters.setEvaluateReportLogoPreviewUrl(loadedPreferences.evaluateReportLogoDataUrl);
    setters.setSidebarColors(loadedPreferences.sidebarColors);
    setters.applySidebarStyles(loadedPreferences.sidebarColors);
    setters.setSidebarBackgroundType(loadedPreferences.sidebarBackgroundType);
    setters.setSavedSidebarImageUrl(loadedPreferences.sidebarBackgroundImage);
    setters.setSidebarImagePreviewUrl(loadedPreferences.sidebarBackgroundImage);
    setters.setSidebarImageFit(loadedPreferences.sidebarImageFit);
    setters.setSidebarImagePosition(loadedPreferences.sidebarImagePosition);
    setters.setSidebarBackgroundBlurPercent(loadedPreferences.sidebarBackgroundBlurPercent);
    setters.setSidebarBackgroundTranslucencyPercent(loadedPreferences.sidebarBackgroundTranslucencyPercent);
    setters.setSidebarNavigationMode(loadedPreferences.sidebarNavigationMode);
    setters.setSidebarSecondaryGroupLabels(loadedPreferences.sidebarSecondaryGroupLabels);
    setters.setSplashBackgroundColor(loadedPreferences.splashBackgroundColor);
    setters.setSplashAnimationType(loadedPreferences.splashAnimationType);
    setters.setSavedSplashLogoDataUrl(loadedPreferences.splashLogoDataUrl);
    setters.setSplashLogoPreviewUrl(loadedPreferences.splashLogoDataUrl);
    setters.setHeaderBackgroundType(loadedPreferences.headerBackgroundType);
    setters.setSavedHeaderImageDataUrl(loadedPreferences.headerBackgroundImage);
    setters.setHeaderImagePreviewUrl(loadedPreferences.headerBackgroundImage);
    setters.setHeaderBackgroundGradient(loadedPreferences.headerBackgroundGradient);
    setters.setHeaderBackgroundColor(loadedPreferences.headerBackgroundColor);
    setters.setHeaderTextColor(loadedPreferences.headerTextColor);
    setters.setGenerativeAICanvasMode(loadedPreferences.generativeAICanvasMode);
    setters.setDefaultLanguage(loadedPreferences.defaultLanguage);
    setters.setDrawerStyle(loadedPreferences.drawerStyle);
    setters.setThemeAndColors(loadedPreferences.themeConfig);
}
