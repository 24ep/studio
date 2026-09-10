export const DEFAULT_APP_NAME = "hrive";

export const APP_THEME_KEY = "appThemePreference";
export const APP_LOGO_DATA_URL_KEY = "appLogoDataUrl";
export const APP_FAVICON_DATA_URL_KEY = "appFaviconDataUrl";
export const APP_NAME_KEY = "appName";
export const APP_CONFIG_APP_NAME_KEY = "appConfigAppName";
export const GENERATIVE_AI_CANVAS_MODE_KEY = "generativeAICanvasMode";
export const DEFAULT_LANGUAGE_KEY = "defaultLanguage";

export const LOGIN_BACKGROUND_TYPE_KEY = "loginBackgroundType";
export const LOGIN_BACKGROUND_IMAGE_KEY = "loginPageBackgroundImageUrl";
export const LOGIN_BACKGROUND_GRADIENT_START_KEY = "loginBackgroundGradientStart";
export const LOGIN_BACKGROUND_GRADIENT_END_KEY = "loginBackgroundGradientEnd";
export const LOGIN_BACKGROUND_COLOR_KEY = "loginBackgroundColor";
export const LOGIN_BACKGROUND_GRADIENT_KEY = "loginBackgroundGradient";

export const LOGIN_BACKGROUND_TYPE_MOBILE_KEY = "loginBackgroundTypeMobile";
export const LOGIN_BACKGROUND_IMAGE_MOBILE_KEY = "loginPageBackgroundImageUrlMobile";
export const LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY = "loginBackgroundGradientStartMobile";
export const LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY = "loginBackgroundGradientEndMobile";
export const LOGIN_BACKGROUND_COLOR_MOBILE_KEY = "loginBackgroundColorMobile";
export const LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY = "loginBackgroundGradientMobile";

export const LOGIN_PAGE_LAYOUT_TYPE_KEY = "loginPageLayoutType";
export const LOGIN_PAGE_LOGO_SIZE_KEY = "loginPageLogoSize";

export const EVALUATE_HEADER_BACKGROUND_TYPE_KEY = "evaluateHeaderBackgroundType";
export const EVALUATE_HEADER_BACKGROUND_IMAGE_KEY = "evaluateHeaderBackgroundImageUrl";
export const EVALUATE_HEADER_BACKGROUND_GRADIENT_START_KEY = "evaluateHeaderBackgroundGradientStart";
export const EVALUATE_HEADER_BACKGROUND_GRADIENT_END_KEY = "evaluateHeaderBackgroundGradientEnd";
export const EVALUATE_HEADER_BACKGROUND_COLOR_KEY = "evaluateHeaderBackgroundColor";
export const EVALUATE_HEADER_TEXT_COLOR_KEY = "evaluateHeaderTextColor";
export const EVALUATE_PLATFORM_LOGO_DATA_URL_KEY = "evaluatePlatformLogoDataUrl";
export const EVALUATE_REPORT_LOGO_DATA_URL_KEY = "evaluateReportLogoDataUrl";
export const ORGANIZATION_LOGO_DATA_URL_KEY = "organizationLogoDataUrl";

export const HEADER_BACKGROUND_TYPE_KEY = "headerBackgroundType";
export const HEADER_BACKGROUND_IMAGE_KEY = "headerBackgroundImageUrl";
export const HEADER_BACKGROUND_COLOR_KEY = "headerBackgroundColor";
export const HEADER_BACKGROUND_GRADIENT_KEY = "headerBackgroundGradient";
export const HEADER_TEXT_COLOR_KEY = "headerTextColor";

export const INTERVIEWER_SELECTED_BG_COLOR_KEY = "interviewerSelectedBackgroundColor";
export const INTERVIEWER_SELECTED_TEXT_COLOR_KEY = "interviewerSelectedTextColor";
export const INTERVIEWER_SELECTED_BORDER_COLOR_KEY = "interviewerSelectedBorderColor";
export const INTERVIEWER_SELECTED_BORDER_WIDTH_KEY = "interviewerSelectedBorderWidth";
export const INTERVIEWER_NON_SELECTED_BG_COLOR_KEY = "interviewerNonSelectedBackgroundColor";
export const INTERVIEWER_NON_SELECTED_TEXT_COLOR_KEY = "interviewerNonSelectedTextColor";
export const INTERVIEWER_NON_SELECTED_BORDER_COLOR_KEY = "interviewerNonSelectedBorderColor";
export const INTERVIEWER_NON_SELECTED_BORDER_WIDTH_KEY = "interviewerNonSelectedBorderWidth";
export const INTERVIEWER_NAME_COLOR_KEY = "interviewerNameColor";

export const SIDEBAR_BACKGROUND_TYPE_KEY = "sidebarBackgroundType";
export const SIDEBAR_BACKGROUND_IMAGE_KEY = "sidebarBackgroundImageUrl";
export const SIDEBAR_BACKGROUND_IMAGE_FIT_KEY = "sidebarBackgroundImageFit";
export const SIDEBAR_BACKGROUND_IMAGE_POSITION_KEY = "sidebarBackgroundImagePosition";
export const SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY = "sidebarBackgroundBlurPercent";
export const SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY = "sidebarBackgroundTranslucencyPercent";
export const SIDEBAR_NAVIGATION_MODE_KEY = "sidebarNavigationMode";
export const SIDEBAR_SECONDARY_GROUP_LABELS_KEY = "sidebarSecondaryGroupLabels";

export const SPLASH_BACKGROUND_COLOR_KEY = "splashBackgroundColor";
export const SPLASH_LOGO_DATA_URL_KEY = "splashLogoDataUrl";
export const SPLASH_ANIMATION_TYPE_KEY = "splashAnimationType";

export const DRAWER_STYLE_KEY = "drawerStyle";

export type ThemePreference = "light" | "dark" | "system";
export type LoginBackgroundType = "image" | "gradient" | "solid";
export type EvaluateHeaderBackgroundType = "image" | "gradient" | "solid";
export type HeaderBackgroundType = "image" | "gradient" | "solid";
export type SidebarBackgroundType = "gradient" | "solid" | "image";
export type SidebarImageFit = "cover" | "contain" | "fill" | "none" | "scale-down";
export type { SidebarNavigationMode } from "../../layout/sidebar-layout-settings";
export type SidebarImagePosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type SplashAnimationType = "spinner" | "pulse" | "bar" | "dots" | "none";
export type DrawerStyle = "classic" | "modern";
export type LoginPageLayoutType = "center" | "2column";
