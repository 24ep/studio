import { describe, expect, it } from 'vitest';
import {
    APP_NAME_KEY,
    APP_THEME_KEY,
    DEFAULT_APP_NAME,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_END,
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
    DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT,
    DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT,
    GENERATIVE_AI_CANVAS_MODE_KEY,
    EVALUATE_HEADER_BACKGROUND_GRADIENT_END_KEY,
    EVALUATE_HEADER_BACKGROUND_GRADIENT_START_KEY,
    HEADER_BACKGROUND_GRADIENT_KEY,
    LOGIN_BACKGROUND_GRADIENT_END_KEY,
    LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY,
    LOGIN_BACKGROUND_GRADIENT_START_KEY,
    LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY,
    LOGIN_PAGE_LOGO_SIZE_KEY,
    SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY,
    SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY,
    SIDEBAR_COLOR_KEYS,
    SIDEBAR_NAVIGATION_MODE_KEY,
    SIDEBAR_SECONDARY_GROUP_LABELS_KEY,
    SPLASH_LOGO_DATA_URL_KEY,
    createInitialSidebarColors,
} from './constants';
import {
    buildBasicSystemPreferencesSavePayload,
    buildBasicSystemPreferencesState,
    DEFAULT_BASIC_THEME,
    DEFAULT_SIDEBAR_LOGO_SIZE,
    SIDEBAR_LOGO_SIZE_KEY,
    SHOW_LOGO_ONLY_KEY,
} from './basic-form-utils';
import {
    applyLoadedSystemPreferenceState,
    applySavedSystemPreferenceAssetUpdates,
    buildLoadedSystemPreferencesState,
    buildSystemPreferencesFormData,
    canEditSystemPreferences,
    getSavedSystemPreferenceAssetUpdates,
    getUploadImageUrl,
    hslGradientToGradientString,
    shouldRevokeTrackedPreviewUrl,
    validateSystemPreferenceImageFile,
    type LoadedSystemPreferenceStateSetters,
    type SystemPreferencesSaveInput,
} from './utils';

describe('system preferences utilities', () => {
    it('validates image uploads by MIME type and size', () => {
        expect(validateSystemPreferenceImageFile({ type: 'image/png', size: 1024 })).toEqual({ valid: true });
        expect(validateSystemPreferenceImageFile({ type: 'application/pdf', size: 1024 })).toEqual({
            valid: false,
            message: 'Please select an image file',
        });
        expect(validateSystemPreferenceImageFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 })).toEqual({
            valid: false,
            message: 'File size must be less than 5MB',
        });
    });

    it('extracts uploaded image URLs from supported response shapes', () => {
        expect(getUploadImageUrl({ url: '/uploads/logo.png' })).toBe('/uploads/logo.png');
        expect(getUploadImageUrl({ file: { url: '/uploads/file-logo.png' } })).toBe('/uploads/file-logo.png');
        expect(getUploadImageUrl({ url: '   ', file: { url: '' } })).toBeNull();
        expect(getUploadImageUrl(null)).toBeNull();
    });

    it('extracts saved asset updates from save responses', () => {
        expect(getSavedSystemPreferenceAssetUpdates({
            appLogoDataUrl: '/app-logo.png',
            loginPageBackgroundImageUrl: '/login.png',
            loginPageBackgroundImageUrlMobile: '/login-mobile.png',
            splashLogoDataUrl: '/splash.png',
            ignored: '/ignored.png',
        })).toEqual({
            appLogoDataUrl: '/app-logo.png',
            loginBackgroundImage: '/login.png',
            loginBackgroundImageMobile: '/login-mobile.png',
            splashLogoDataUrl: '/splash.png',
        });

        expect(getSavedSystemPreferenceAssetUpdates({
            appLogoDataUrl: '',
            loginPageBackgroundImageUrl: null,
        })).toEqual({});
    });

    it('applies returned saved asset updates without touching missing assets', () => {
        const calls: string[] = [];

        applySavedSystemPreferenceAssetUpdates({
            appLogoDataUrl: '/logo.png',
            loginBackgroundImageMobile: '/mobile.png',
        }, {
            setSavedLogoUrl: value => calls.push(`logo:${value}`),
            setSavedLoginImageDataUrl: value => calls.push(`login:${value}`),
            setSavedLoginImageDataUrlMobile: value => calls.push(`mobile:${value}`),
            setSavedSplashLogoDataUrl: value => calls.push(`splash:${value}`),
        });

        expect(calls).toEqual([
            'logo:/logo.png',
            'mobile:/mobile.png',
        ]);
    });

    it('checks system preference edit permission from role or module permission', () => {
        expect(canEditSystemPreferences({ role: 'Admin', modulePermissions: [] })).toBe(true);
        expect(canEditSystemPreferences({ role: 'Recruiter', modulePermissions: ['SYSTEM_SETTINGS_EDIT'] })).toBe(true);
        expect(canEditSystemPreferences({ role: 'Recruiter', modulePermissions: ['OTHER'] })).toBe(false);
        expect(canEditSystemPreferences(null)).toBe(false);
    });

    it('normalizes basic system preference form state', () => {
        expect(buildBasicSystemPreferencesState({})).toEqual({
            appName: DEFAULT_APP_NAME,
            appLogoUrl: null,
            appFaviconUrl: null,
            themePreference: DEFAULT_BASIC_THEME,
            showLogoOnly: false,
            sidebarLogoSize: DEFAULT_SIDEBAR_LOGO_SIZE,
        });

        expect(buildBasicSystemPreferencesState({
            settings: [
                { key: APP_NAME_KEY, value: 'Studio' },
                { key: 'appLogoDataUrl', value: '/logo.png' },
                { key: 'appFaviconDataUrl', value: '/favicon.ico' },
                { key: APP_THEME_KEY, value: 'dark' },
                { key: SHOW_LOGO_ONLY_KEY, value: 'true' },
                { key: SIDEBAR_LOGO_SIZE_KEY, value: '64' },
            ],
        })).toEqual({
            appName: 'Studio',
            appLogoUrl: '/logo.png',
            appFaviconUrl: '/favicon.ico',
            themePreference: 'dark',
            showLogoOnly: true,
            sidebarLogoSize: 64,
        });
    });

    it('builds basic system preference save payloads without persisting the Account-owned app logo', () => {
        expect(buildBasicSystemPreferencesSavePayload({
            appName: 'Studio',
            appLogoUrl: null,
            appFaviconUrl: '/favicon.ico',
            themePreference: 'dark',
            showLogoOnly: true,
            sidebarLogoSize: 72,
        })).toEqual([
            { key: APP_NAME_KEY, value: 'Studio' },
            { key: 'appFaviconDataUrl', value: '/favicon.ico' },
            { key: APP_THEME_KEY, value: 'dark' },
            { key: SHOW_LOGO_ONLY_KEY, value: 'true' },
            { key: SIDEBAR_LOGO_SIZE_KEY, value: '72' },
        ]);
    });

    it('detects only preview URLs tracked for revocation', () => {
        const trackedUrls = new Set(['blob:tracked']);

        expect(shouldRevokeTrackedPreviewUrl('blob:tracked', trackedUrls)).toBe(true);
        expect(shouldRevokeTrackedPreviewUrl('https://cdn.example.com/logo.png', trackedUrls)).toBe(false);
        expect(shouldRevokeTrackedPreviewUrl(null, trackedUrls)).toBe(false);
    });

    it('normalizes loaded preferences with defaults', () => {
        const loadedPreferences = buildLoadedSystemPreferencesState({});

        expect(loadedPreferences.themePreference).toBe('system');
        expect(loadedPreferences.appName).toBe(DEFAULT_APP_NAME);
        expect(loadedPreferences.loginBackgroundGradient).toBe(hslGradientToGradientString(
            DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
            DEFAULT_LOGIN_BACKGROUND_GRADIENT_END
        ));
        expect(loadedPreferences.loginBackgroundGradientMobile).toBeNull();
        expect(loadedPreferences.evaluateHeaderBackgroundGradient).toBe(hslGradientToGradientString(
            DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
            DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END
        ));
        expect(loadedPreferences.headerBackgroundGradient).toBeNull();
        expect(loadedPreferences.sidebarNavigationMode).toBe('single');
        expect(loadedPreferences.sidebarSecondaryGroupLabels).toEqual(['Settings']);
        expect(loadedPreferences.sidebarBackgroundBlurPercent).toBe(DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT);
        expect(loadedPreferences.sidebarBackgroundTranslucencyPercent).toBe(DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT);
        expect(loadedPreferences.generativeAICanvasMode).toBe(false);
        expect(loadedPreferences.themeConfig.themePreference).toBe('system');
        expect(loadedPreferences.themeConfig.sidebarColors).toBe(loadedPreferences.sidebarColors);
    });

    it('normalizes loaded preferences with legacy gradients and sidebar color overrides', () => {
        const sidebarOverrideKey = SIDEBAR_COLOR_KEYS[0];
        const loadedPreferences = buildLoadedSystemPreferencesState({
            [APP_THEME_KEY]: 'dark',
            [APP_NAME_KEY]: 'Studio',
            appLogoDataUrl: '/logo.png',
            showLogoOnly: 'true',
            [LOGIN_BACKGROUND_GRADIENT_START_KEY]: '210 100% 50%',
            [LOGIN_BACKGROUND_GRADIENT_END_KEY]: '220 100% 40%',
            [LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY]: '120 50% 50%',
            [LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY]: '140 50% 50%',
            [EVALUATE_HEADER_BACKGROUND_GRADIENT_START_KEY]: '10 50% 50%',
            [EVALUATE_HEADER_BACKGROUND_GRADIENT_END_KEY]: '20 50% 50%',
            [LOGIN_PAGE_LOGO_SIZE_KEY]: '180',
            [SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY]: '40',
            [SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY]: '25',
            [sidebarOverrideKey]: '1 2% 3%',
            [GENERATIVE_AI_CANVAS_MODE_KEY]: true,
            primaryGradient: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
        });

        expect(loadedPreferences.themePreference).toBe('dark');
        expect(loadedPreferences.appName).toBe('Studio');
        expect(loadedPreferences.appLogoDataUrl).toBe('/logo.png');
        expect(loadedPreferences.showLogoOnly).toBe(true);
        expect(loadedPreferences.loginBackgroundGradient).toMatch(/^linear-gradient/);
        expect(loadedPreferences.loginBackgroundGradientMobile).toMatch(/^linear-gradient/);
        expect(loadedPreferences.evaluateHeaderBackgroundGradient).toMatch(/^linear-gradient/);
        expect(loadedPreferences.loginPageLogoSize).toBe(180);
        expect(loadedPreferences.sidebarBackgroundBlurPercent).toBe(40);
        expect(loadedPreferences.sidebarBackgroundTranslucencyPercent).toBe(25);
        expect(loadedPreferences.sidebarColors[sidebarOverrideKey]).toBe('1 2% 3%');
        expect(loadedPreferences.generativeAICanvasMode).toBe(true);
        expect(loadedPreferences.themeConfig.primaryGradient).toBe('linear-gradient(135deg, #111111 0%, #222222 100%)');
        expect(loadedPreferences.themeConfig.sidebarColors).toBe(loadedPreferences.sidebarColors);
    });

    it('applies loaded preferences to page state setters and style callbacks', () => {
        const calls: Record<string, unknown[]> = {};
        const recordCall = (name: string) => (value: unknown) => {
            calls[name] = [...(calls[name] || []), value];
        };
        const setters = new Proxy({}, {
            get: (_target, property) => recordCall(String(property)),
        }) as unknown as LoadedSystemPreferenceStateSetters;

        const loadedPreferences = buildLoadedSystemPreferencesState({
            [APP_THEME_KEY]: 'dark',
            [APP_NAME_KEY]: 'Studio',
            appLogoDataUrl: '/logo.png',
            loginPageLogoLightMode: '/login-light.png',
            sidebarLogoExpandedDarkMode: '/expanded-dark.png',
            loginPageBackgroundImageUrl: '/login-bg.png',
            splashLogoDataUrl: '/splash.png',
            primaryGradient: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
        });

        applyLoadedSystemPreferenceState(loadedPreferences, setters);

        expect(calls.setThemePreference).toEqual(['dark']);
        expect(calls.setAppName).toEqual(['Studio']);
        expect(calls.setSavedLogoUrl).toEqual(['/logo.png']);
        expect(calls.setLogoPreviewUrl).toEqual(['/logo.png']);
        expect(calls.setSavedLoginPageLogoLightModeUrl).toEqual(['/login-light.png']);
        expect(calls.setLoginPageLogoLightModePreviewUrl).toEqual(['/login-light.png']);
        expect(calls.setSavedSidebarLogoExpandedDarkModeUrl).toEqual(['/expanded-dark.png']);
        expect(calls.setSidebarLogoExpandedDarkModePreviewUrl).toEqual(['/expanded-dark.png']);
        expect(calls.setSavedSplashLogoDataUrl).toEqual(['/splash.png']);
        expect(calls.setSplashLogoPreviewUrl).toEqual(['/splash.png']);
        expect(calls.setSidebarColors).toEqual([loadedPreferences.sidebarColors]);
        expect(calls.applySidebarStyles).toEqual([loadedPreferences.sidebarColors]);
        expect(calls.setThemeAndColors).toEqual([loadedPreferences.themeConfig]);
    });

    it('builds the system preferences save form data without duplicate header entries', () => {
        const input: SystemPreferencesSaveInput = {
            themePreference: 'dark',
            appName: 'HRI',
            generativeAICanvasMode: true,
            defaultLanguage: 'en',
            drawerStyle: 'modern',
            sidebarColors: createInitialSidebarColors(),
            loginBackgroundType: 'gradient',
            loginBackgroundColor: '220 25% 97%',
            loginLayoutType: 'center',
            loginPageLogoSize: 120,
            loginBackgroundGradient: 'linear-gradient(135deg, #111111 0%, #222222 100%)',
            loginBackgroundTypeMobile: 'solid',
            loginBackgroundColorMobile: '220 25% 90%',
            loginBackgroundGradientMobile: null,
            evaluateHeaderBackgroundType: 'solid',
            evaluateHeaderBackgroundColor: '210 40% 96%',
            evaluateHeaderTextColor: '0 0% 0%',
            evaluateHeaderBackgroundGradient: null,
            sidebarBackgroundType: 'gradient',
            sidebarImageFit: 'cover',
            sidebarImagePosition: 'center',
            sidebarBackgroundBlurPercent: 35,
            sidebarBackgroundTranslucencyPercent: 20,
            sidebarNavigationMode: 'split',
            sidebarSecondaryGroupLabels: ['Settings', 'Hiring'],
            headerBackgroundType: 'solid',
            headerBackgroundColor: '0 0% 100%',
            headerBackgroundGradient: null,
            headerTextColor: '222 47% 11%',
            splashBackgroundColor: '0 0% 100%',
            splashAnimationType: 'fade',
            selectedLoginImageFile: null,
            selectedLoginImageFileMobile: null,
            selectedEvaluateHeaderImageFile: null,
            selectedSidebarImageFile: null,
            selectedSplashLogoFile: null,
            savedLogoUrl: '/logo.png',
            savedLoginPageLogoLightModeUrl: null,
            savedLoginPageLogoDarkModeUrl: '/login-dark.png',
            savedSidebarLogoCollapsedLightModeUrl: null,
            savedSidebarLogoExpandedLightModeUrl: null,
            savedSidebarLogoCollapsedDarkModeUrl: null,
            savedSidebarLogoExpandedDarkModeUrl: null,
            savedSplashLogoDataUrl: '/splash.png',
        };

        const { formData, preferencesToSave } = buildSystemPreferencesFormData(input);
        const preferenceMap = new Map(preferencesToSave.map(preference => [preference.key, preference.value]));

        expect(JSON.parse(String(formData.get('preferences')))).toEqual(preferencesToSave);
        expect(preferenceMap.get(APP_THEME_KEY)).toBe('dark');
        expect(preferenceMap.get(APP_NAME_KEY)).toBe('HRI');
        expect(preferenceMap.get(GENERATIVE_AI_CANVAS_MODE_KEY)).toBe('true');
        expect(preferenceMap.get(SPLASH_LOGO_DATA_URL_KEY)).toBe('/splash.png');
        expect(preferenceMap.get(SIDEBAR_BACKGROUND_BLUR_PERCENT_KEY)).toBe('35');
        expect(preferenceMap.get(SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT_KEY)).toBe('20');
        expect(preferenceMap.get(SIDEBAR_NAVIGATION_MODE_KEY)).toBe('split');
        expect(preferenceMap.get(SIDEBAR_SECONDARY_GROUP_LABELS_KEY)).toBe(JSON.stringify(['Settings', 'Hiring']));
        expect(preferenceMap.get(HEADER_BACKGROUND_GRADIENT_KEY)).toBeNull();
        expect(SIDEBAR_COLOR_KEYS.every(key => preferenceMap.has(key))).toBe(true);

        const headerGradientEntries = preferencesToSave.filter(preference => preference.key === HEADER_BACKGROUND_GRADIENT_KEY);
        expect(headerGradientEntries).toHaveLength(1);
    });
});