import {
    APP_FAVICON_DATA_URL_KEY,
    APP_LOGO_DATA_URL_KEY,
    DEFAULT_LANGUAGE_KEY,
    APP_NAME_KEY,
    APP_THEME_KEY,
    DEFAULT_APP_NAME,
    DEFAULT_DRAWER_STYLE,
    DEFAULT_HEADER_BACKGROUND_COLOR,
    DEFAULT_HEADER_BACKGROUND_TYPE,
    DEFAULT_HEADER_TEXT_COLOR,
    DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT,
    DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT,
    DEFAULT_SPLASH_ANIMATION_TYPE,
    DEFAULT_SPLASH_BACKGROUND_COLOR,
    DRAWER_STYLE_KEY,
    GENERATIVE_AI_CANVAS_MODE_KEY,
    HEADER_BACKGROUND_COLOR_KEY,
    HEADER_BACKGROUND_GRADIENT_KEY,
    HEADER_BACKGROUND_IMAGE_KEY,
    HEADER_BACKGROUND_TYPE_KEY,
    HEADER_TEXT_COLOR_KEY,
    SIDEBAR_BACKGROUND_IMAGE_FIT_KEY,
    SIDEBAR_BACKGROUND_IMAGE_KEY,
    SIDEBAR_BACKGROUND_IMAGE_POSITION_KEY,
    SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY,
    SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY,
    SIDEBAR_BACKGROUND_TYPE_KEY,
    SIDEBAR_NAVIGATION_MODE_KEY,
    SIDEBAR_SECONDARY_GROUP_LABELS_KEY,
    SPLASH_ANIMATION_TYPE_KEY,
    SPLASH_BACKGROUND_COLOR_KEY,
    SPLASH_LOGO_DATA_URL_KEY,
    type DrawerStyle,
    type HeaderBackgroundType,
    type SidebarBackgroundType,
    type SidebarImageFit,
    type SidebarImagePosition,
    type SplashAnimationType,
    type ThemePreference,
} from './constants';
import { buildSidebarLayoutSettings } from '../../layout/sidebar-layout-settings';
import type { LoadedSystemPreferencesState } from './loaded-state-types';
import {
    buildLoadedEvaluateHeaderState,
    buildLoadedLoginBackgroundState,
} from './loaded-state-background-builders';
import {
    asBooleanPreference,
    asNumberPreference,
    asStringOrNull,
    buildLoadedSidebarColors,
    type SettingsRecord,
} from './loaded-state-value-utils';

const DEFAULT_THEME: ThemePreference = 'system';

function normalizeDefaultLanguage(value: unknown) {
    const normalizedValue = asStringOrNull(value)?.trim().toLowerCase() || '';
    if (normalizedValue.startsWith('th')) return 'th';
    if (normalizedValue.startsWith('en')) return 'en';
    return 'en';
}

function asPercentPreference(value: unknown, fallback: number): number {
    return Math.min(100, Math.max(0, asNumberPreference(value, fallback)));
}

export function buildLoadedSystemPreferencesState(settings: SettingsRecord): LoadedSystemPreferencesState {
    const themePreference = (settings[APP_THEME_KEY] as ThemePreference) || DEFAULT_THEME;
    const sidebarColors = buildLoadedSidebarColors(settings);
    const sidebarLayoutSettings = buildSidebarLayoutSettings({
        [SIDEBAR_NAVIGATION_MODE_KEY]: settings[SIDEBAR_NAVIGATION_MODE_KEY],
        [SIDEBAR_SECONDARY_GROUP_LABELS_KEY]: settings[SIDEBAR_SECONDARY_GROUP_LABELS_KEY],
    });

    return {
        themePreference,
        appName: (settings[APP_NAME_KEY] as string) || DEFAULT_APP_NAME,
        appLogoDataUrl: asStringOrNull(settings[APP_LOGO_DATA_URL_KEY]),
        appFaviconDataUrl: asStringOrNull(settings[APP_FAVICON_DATA_URL_KEY]),
        loginPageLogoLightMode: asStringOrNull(settings.loginPageLogoLightMode),
        loginPageLogoDarkMode: asStringOrNull(settings.loginPageLogoDarkMode),
        sidebarLogoCollapsedLightMode: asStringOrNull(settings.sidebarLogoCollapsedLightMode),
        sidebarLogoExpandedLightMode: asStringOrNull(settings.sidebarLogoExpandedLightMode),
        sidebarLogoCollapsedDarkMode: asStringOrNull(settings.sidebarLogoCollapsedDarkMode),
        sidebarLogoExpandedDarkMode: asStringOrNull(settings.sidebarLogoExpandedDarkMode),
        showLogoOnly: asBooleanPreference(settings.showLogoOnly),
        ...buildLoadedLoginBackgroundState(settings),
        ...buildLoadedEvaluateHeaderState(settings),
        sidebarColors,
        sidebarBackgroundType: (settings[SIDEBAR_BACKGROUND_TYPE_KEY] as SidebarBackgroundType) || 'gradient',
        sidebarBackgroundImage: asStringOrNull(settings[SIDEBAR_BACKGROUND_IMAGE_KEY]),
        sidebarImageFit: (settings[SIDEBAR_BACKGROUND_IMAGE_FIT_KEY] as SidebarImageFit) || 'cover',
        sidebarImagePosition: (settings[SIDEBAR_BACKGROUND_IMAGE_POSITION_KEY] as SidebarImagePosition) || 'center',
        sidebarBackgroundBlurPercent: asPercentPreference(
            settings[SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY],
            DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT
        ),
        sidebarBackgroundTranslucencyPercent: asPercentPreference(
            settings[SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY],
            DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT
        ),
        sidebarNavigationMode: sidebarLayoutSettings.mode,
        sidebarSecondaryGroupLabels: sidebarLayoutSettings.secondaryGroupLabels,
        splashBackgroundColor: (settings[SPLASH_BACKGROUND_COLOR_KEY] as string) || DEFAULT_SPLASH_BACKGROUND_COLOR,
        splashAnimationType: (settings[SPLASH_ANIMATION_TYPE_KEY] as SplashAnimationType) || DEFAULT_SPLASH_ANIMATION_TYPE,
        splashLogoDataUrl: asStringOrNull(settings[SPLASH_LOGO_DATA_URL_KEY]),
        defaultLanguage: normalizeDefaultLanguage(settings[DEFAULT_LANGUAGE_KEY]),
        headerBackgroundType: (settings[HEADER_BACKGROUND_TYPE_KEY] as HeaderBackgroundType) || DEFAULT_HEADER_BACKGROUND_TYPE,
        headerBackgroundImage: asStringOrNull(settings[HEADER_BACKGROUND_IMAGE_KEY]),
        headerBackgroundGradient: asStringOrNull(settings[HEADER_BACKGROUND_GRADIENT_KEY]),
        headerBackgroundColor: (settings[HEADER_BACKGROUND_COLOR_KEY] as string) || DEFAULT_HEADER_BACKGROUND_COLOR,
        headerTextColor: (settings[HEADER_TEXT_COLOR_KEY] as string) || DEFAULT_HEADER_TEXT_COLOR,
        generativeAICanvasMode: asBooleanPreference(settings[GENERATIVE_AI_CANVAS_MODE_KEY]),
        drawerStyle: (settings[DRAWER_STYLE_KEY] as DrawerStyle) || DEFAULT_DRAWER_STYLE,
        themeConfig: {
            themePreference,
            primaryGradient: asStringOrNull(settings.primaryGradient),
            sidebarColors,
            primaryButtonShadows: {
                primaryButtonShadowL: asStringOrNull(settings.primaryButtonShadowL),
                primaryButtonShadowHoverL: asStringOrNull(settings.primaryButtonShadowHoverL),
                primaryButtonShadowD: asStringOrNull(settings.primaryButtonShadowD),
                primaryButtonShadowHoverD: asStringOrNull(settings.primaryButtonShadowHoverD),
            },
        },
    };
}

export interface SystemPreferencesPermissionUser {
    role?: string | null;
    modulePermissions?: readonly string[] | null;
}

export function canEditSystemPreferences(user: SystemPreferencesPermissionUser | null | undefined) {
    return user?.role === 'Admin' || Boolean(user?.modulePermissions?.includes('SYSTEM_SETTINGS_EDIT'));
}
