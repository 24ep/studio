import type {
    DrawerStyle,
    EvaluateHeaderBackgroundType,
    HeaderBackgroundType,
    LoginBackgroundType,
    LoginPageLayoutType,
    SidebarNavigationMode,
    SidebarBackgroundType,
    SidebarColors,
    SidebarImageFit,
    SidebarImagePosition,
    SplashAnimationType,
    ThemePreference,
} from './constants';

export interface ThemeConfiguration {
    themePreference: ThemePreference;
    primaryGradient?: string | null;
    sidebarColors: SidebarColors;
    primaryButtonShadows: {
        primaryButtonShadowL?: string | null;
        primaryButtonShadowHoverL?: string | null;
        primaryButtonShadowD?: string | null;
        primaryButtonShadowHoverD?: string | null;
    };
}

export interface LoadedSystemPreferencesState {
    themePreference: ThemePreference;
    appName: string;
    appLogoDataUrl: string | null;
    appFaviconDataUrl: string | null;
    loginPageLogoLightMode: string | null;
    loginPageLogoDarkMode: string | null;
    sidebarLogoCollapsedLightMode: string | null;
    sidebarLogoExpandedLightMode: string | null;
    sidebarLogoCollapsedDarkMode: string | null;
    sidebarLogoExpandedDarkMode: string | null;
    showLogoOnly: boolean;
    loginBackgroundType: LoginBackgroundType;
    loginBackgroundImage: string | null;
    loginBackgroundGradient: string;
    loginBackgroundColor: string;
    loginPageLogoSize: number;
    loginLayoutType: LoginPageLayoutType;
    loginBackgroundTypeMobile: LoginBackgroundType;
    loginBackgroundImageMobile: string | null;
    loginBackgroundGradientMobile: string | null;
    loginBackgroundColorMobile: string;
    evaluateHeaderBackgroundType: EvaluateHeaderBackgroundType;
    evaluateHeaderBackgroundImage: string | null;
    evaluateHeaderBackgroundGradient: string;
    evaluateHeaderBackgroundColor: string;
    evaluateHeaderTextColor: string;
    evaluatePlatformLogoDataUrl: string | null;
    evaluateReportLogoDataUrl: string | null;
    sidebarColors: SidebarColors;
    sidebarBackgroundType: SidebarBackgroundType;
    sidebarBackgroundImage: string | null;
    sidebarImageFit: SidebarImageFit;
    sidebarImagePosition: SidebarImagePosition;
    sidebarBackgroundBlurPercent: number;
    sidebarBackgroundTranslucencyPercent: number;
    sidebarNavigationMode: SidebarNavigationMode;
    sidebarSecondaryGroupLabels: string[];
    splashBackgroundColor: string;
    splashAnimationType: SplashAnimationType;
    splashLogoDataUrl: string | null;
    headerBackgroundType: HeaderBackgroundType;
    headerBackgroundImage: string | null;
    headerBackgroundGradient: string | null;
    headerBackgroundColor: string;
    headerTextColor: string;
    generativeAICanvasMode: boolean;
    drawerStyle: DrawerStyle;
    defaultLanguage: string;
    themeConfig: ThemeConfiguration;
}

type PreferenceSetter<T> = (value: T) => void;

export interface LoadedSystemPreferenceStateSetters {
    setThemePreference: PreferenceSetter<ThemePreference>;
    setAppName: PreferenceSetter<string>;
    setSavedLogoUrl: PreferenceSetter<string | null>;
    setLogoPreviewUrl: PreferenceSetter<string | null>;
    setSavedLoginPageLogoLightModeUrl: PreferenceSetter<string | null>;
    setLoginPageLogoLightModePreviewUrl: PreferenceSetter<string | null>;
    setSavedLoginPageLogoDarkModeUrl: PreferenceSetter<string | null>;
    setLoginPageLogoDarkModePreviewUrl: PreferenceSetter<string | null>;
    setSavedSidebarLogoCollapsedLightModeUrl: PreferenceSetter<string | null>;
    setSidebarLogoCollapsedLightModePreviewUrl: PreferenceSetter<string | null>;
    setSavedSidebarLogoExpandedLightModeUrl: PreferenceSetter<string | null>;
    setSidebarLogoExpandedLightModePreviewUrl: PreferenceSetter<string | null>;
    setSavedSidebarLogoCollapsedDarkModeUrl: PreferenceSetter<string | null>;
    setSidebarLogoCollapsedDarkModePreviewUrl: PreferenceSetter<string | null>;
    setSavedSidebarLogoExpandedDarkModeUrl: PreferenceSetter<string | null>;
    setSidebarLogoExpandedDarkModePreviewUrl: PreferenceSetter<string | null>;
    setShowLogoOnly: PreferenceSetter<boolean>;
    setLoginBackgroundType: PreferenceSetter<LoginBackgroundType>;
    setSavedLoginImageDataUrl: PreferenceSetter<string | null>;
    setLoginImagePreviewUrl: PreferenceSetter<string | null>;
    setLoginBackgroundGradient: PreferenceSetter<string | null>;
    setLoginBackgroundColor: PreferenceSetter<string>;
    setLoginPageLogoSize: PreferenceSetter<number>;
    setLoginLayoutType: PreferenceSetter<LoginPageLayoutType>;
    setLoginBackgroundTypeMobile: PreferenceSetter<LoginBackgroundType>;
    setSavedLoginImageDataUrlMobile: PreferenceSetter<string | null>;
    setLoginImagePreviewUrlMobile: PreferenceSetter<string | null>;
    setLoginBackgroundGradientMobile: PreferenceSetter<string | null>;
    setLoginBackgroundColorMobile: PreferenceSetter<string>;
    setEvaluateHeaderBackgroundType: PreferenceSetter<EvaluateHeaderBackgroundType>;
    setSavedEvaluateHeaderImageDataUrl: PreferenceSetter<string | null>;
    setEvaluateHeaderImagePreviewUrl: PreferenceSetter<string | null>;
    setEvaluateHeaderBackgroundGradient: PreferenceSetter<string | null>;
    setEvaluateHeaderBackgroundColor: PreferenceSetter<string>;
    setEvaluateHeaderTextColor: PreferenceSetter<string>;
    setSavedEvaluatePlatformLogoUrl: PreferenceSetter<string | null>;
    setEvaluatePlatformLogoPreviewUrl: PreferenceSetter<string | null>;
    setSavedEvaluateReportLogoUrl: PreferenceSetter<string | null>;
    setEvaluateReportLogoPreviewUrl: PreferenceSetter<string | null>;
    setSidebarColors: PreferenceSetter<SidebarColors>;
    applySidebarStyles: (colors: SidebarColors) => void;
    setSidebarBackgroundType: PreferenceSetter<SidebarBackgroundType>;
    setSavedSidebarImageUrl: PreferenceSetter<string | null>;
    setSidebarImagePreviewUrl: PreferenceSetter<string | null>;
    setSidebarImageFit: PreferenceSetter<SidebarImageFit>;
    setSidebarImagePosition: PreferenceSetter<SidebarImagePosition>;
    setSidebarBackgroundBlurPercent: PreferenceSetter<number>;
    setSidebarBackgroundTranslucencyPercent: PreferenceSetter<number>;
    setSidebarNavigationMode: PreferenceSetter<SidebarNavigationMode>;
    setSidebarSecondaryGroupLabels: PreferenceSetter<string[]>;
    setSplashBackgroundColor: PreferenceSetter<string>;
    setSplashAnimationType: PreferenceSetter<string>;
    setSavedSplashLogoDataUrl: PreferenceSetter<string | null>;
    setSplashLogoPreviewUrl: PreferenceSetter<string | null>;
    setHeaderBackgroundType: PreferenceSetter<HeaderBackgroundType>;
    setSavedHeaderImageDataUrl: PreferenceSetter<string | null>;
    setHeaderImagePreviewUrl: PreferenceSetter<string | null>;
    setHeaderBackgroundGradient: PreferenceSetter<string | null>;
    setHeaderBackgroundColor: PreferenceSetter<string>;
    setHeaderTextColor: PreferenceSetter<string>;
    setGenerativeAICanvasMode: PreferenceSetter<boolean>;
    setDrawerStyle: PreferenceSetter<DrawerStyle>;
    setDefaultLanguage: PreferenceSetter<string>;
    setThemeAndColors: (themeConfig: ThemeConfiguration) => void;
}
