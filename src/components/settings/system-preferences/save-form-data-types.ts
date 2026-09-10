import type {
  DrawerStyle,
  EvaluateHeaderBackgroundType,
  HeaderBackgroundType,
  LoginBackgroundType,
  LoginPageLayoutType,
  SidebarBackgroundType,
  SidebarColors,
  SidebarImageFit,
  SidebarImagePosition,
  SidebarNavigationMode,
  ThemePreference,
} from './constants';

export interface SystemPreferencesSaveInput {
  themePreference: ThemePreference;
  appName: string;
  generativeAICanvasMode: boolean;
  drawerStyle: DrawerStyle;
  defaultLanguage: string;
  sidebarColors: SidebarColors;
  loginBackgroundType: LoginBackgroundType;
  loginBackgroundColor: string;
  loginLayoutType: LoginPageLayoutType;
  loginPageLogoSize: number;
  loginBackgroundGradient: string | null;
  loginBackgroundTypeMobile: LoginBackgroundType;
  loginBackgroundColorMobile: string;
  loginBackgroundGradientMobile: string | null;
  evaluateHeaderBackgroundType: EvaluateHeaderBackgroundType;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
  evaluateHeaderBackgroundGradient: string | null;
  sidebarBackgroundType: SidebarBackgroundType;
  sidebarImageFit: SidebarImageFit;
  sidebarImagePosition: SidebarImagePosition;
  sidebarBackgroundBlurPercent: number;
  sidebarBackgroundTranslucencyPercent: number;
  sidebarNavigationMode: SidebarNavigationMode;
  sidebarSecondaryGroupLabels: string[];
  headerBackgroundType: HeaderBackgroundType;
  headerBackgroundColor: string;
  headerBackgroundGradient: string | null;
  headerTextColor: string;
  splashBackgroundColor: string;
  splashAnimationType: string;
  selectedLoginImageFile: File | null;
  selectedLoginImageFileMobile: File | null;
  selectedEvaluateHeaderImageFile: File | null;
  selectedSidebarImageFile: File | null;
  selectedSplashLogoFile: File | null;
  savedLogoUrl: string | null;
  savedLoginPageLogoLightModeUrl: string | null;
  savedLoginPageLogoDarkModeUrl: string | null;
  savedSidebarLogoCollapsedLightModeUrl: string | null;
  savedSidebarLogoExpandedLightModeUrl: string | null;
  savedSidebarLogoCollapsedDarkModeUrl: string | null;
  savedSidebarLogoExpandedDarkModeUrl: string | null;
  savedSplashLogoDataUrl: string | null;
}

export interface SystemPreferenceEntry {
  key: string;
  value: string | null;
}
