import {
    DEFAULT_EVALUATE_HEADER_BACKGROUND_COLOR,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
    DEFAULT_EVALUATE_HEADER_BACKGROUND_TYPE,
    DEFAULT_EVALUATE_HEADER_TEXT_COLOR,
    DEFAULT_LOGIN_BACKGROUND_COLOR,
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_END,
    DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
    DEFAULT_LOGIN_BACKGROUND_TYPE,
    DEFAULT_LOGIN_BACKGROUND_TYPE_MOBILE,
    DEFAULT_LOGIN_PAGE_LOGO_SIZE,
    EVALUATE_HEADER_BACKGROUND_COLOR_KEY,
    EVALUATE_HEADER_BACKGROUND_GRADIENT_END_KEY,
    EVALUATE_HEADER_BACKGROUND_GRADIENT_START_KEY,
    EVALUATE_HEADER_BACKGROUND_IMAGE_KEY,
    EVALUATE_HEADER_BACKGROUND_TYPE_KEY,
    EVALUATE_HEADER_TEXT_COLOR_KEY,
    EVALUATE_PLATFORM_LOGO_DATA_URL_KEY,
    EVALUATE_REPORT_LOGO_DATA_URL_KEY,
    LOGIN_BACKGROUND_COLOR_KEY,
    LOGIN_BACKGROUND_COLOR_MOBILE_KEY,
    LOGIN_BACKGROUND_GRADIENT_END_KEY,
    LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY,
    LOGIN_BACKGROUND_GRADIENT_KEY,
    LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY,
    LOGIN_BACKGROUND_GRADIENT_START_KEY,
    LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY,
    LOGIN_BACKGROUND_IMAGE_KEY,
    LOGIN_BACKGROUND_IMAGE_MOBILE_KEY,
    LOGIN_BACKGROUND_TYPE_KEY,
    LOGIN_BACKGROUND_TYPE_MOBILE_KEY,
    LOGIN_PAGE_LAYOUT_TYPE_KEY,
    LOGIN_PAGE_LOGO_SIZE_KEY,
    type EvaluateHeaderBackgroundType,
    type LoginBackgroundType,
    type LoginPageLayoutType,
} from './constants';
import { hslGradientToGradientString } from './color-utils';
import type { LoadedSystemPreferencesState } from './loaded-state-types';
import {
    asNumberPreference,
    asStringOrNull,
    buildGradientPreference,
    type SettingsRecord,
} from './loaded-state-value-utils';

type LoadedLoginBackgroundState = Pick<
    LoadedSystemPreferencesState,
    | 'loginBackgroundType'
    | 'loginBackgroundImage'
    | 'loginBackgroundGradient'
    | 'loginBackgroundColor'
    | 'loginPageLogoSize'
    | 'loginLayoutType'
    | 'loginBackgroundTypeMobile'
    | 'loginBackgroundImageMobile'
    | 'loginBackgroundGradientMobile'
    | 'loginBackgroundColorMobile'
>;

type LoadedEvaluateHeaderState = Pick<
    LoadedSystemPreferencesState,
    | 'evaluateHeaderBackgroundType'
    | 'evaluateHeaderBackgroundImage'
    | 'evaluateHeaderBackgroundGradient'
    | 'evaluateHeaderBackgroundColor'
    | 'evaluateHeaderTextColor'
    | 'evaluatePlatformLogoDataUrl'
    | 'evaluateReportLogoDataUrl'
>;

export function buildLoadedLoginBackgroundState(settings: SettingsRecord): LoadedLoginBackgroundState {
    const loginBackgroundGradient = buildGradientPreference(
        settings,
        LOGIN_BACKGROUND_GRADIENT_KEY,
        LOGIN_BACKGROUND_GRADIENT_START_KEY,
        LOGIN_BACKGROUND_GRADIENT_END_KEY,
        DEFAULT_LOGIN_BACKGROUND_GRADIENT_START,
        DEFAULT_LOGIN_BACKGROUND_GRADIENT_END
    ) ?? hslGradientToGradientString(DEFAULT_LOGIN_BACKGROUND_GRADIENT_START, DEFAULT_LOGIN_BACKGROUND_GRADIENT_END);

    return {
        loginBackgroundType: (settings[LOGIN_BACKGROUND_TYPE_KEY] as LoginBackgroundType) || DEFAULT_LOGIN_BACKGROUND_TYPE,
        loginBackgroundImage: asStringOrNull(settings[LOGIN_BACKGROUND_IMAGE_KEY]),
        loginBackgroundGradient,
        loginBackgroundColor: (settings[LOGIN_BACKGROUND_COLOR_KEY] as string) || DEFAULT_LOGIN_BACKGROUND_COLOR,
        loginPageLogoSize: asNumberPreference(settings[LOGIN_PAGE_LOGO_SIZE_KEY], DEFAULT_LOGIN_PAGE_LOGO_SIZE),
        loginLayoutType: (settings[LOGIN_PAGE_LAYOUT_TYPE_KEY] as LoginPageLayoutType) || 'center',
        loginBackgroundTypeMobile: (settings[LOGIN_BACKGROUND_TYPE_MOBILE_KEY] as LoginBackgroundType) || DEFAULT_LOGIN_BACKGROUND_TYPE_MOBILE,
        loginBackgroundImageMobile: asStringOrNull(settings[LOGIN_BACKGROUND_IMAGE_MOBILE_KEY]),
        loginBackgroundGradientMobile: buildGradientPreference(
            settings,
            LOGIN_BACKGROUND_GRADIENT_MOBILE_KEY,
            LOGIN_BACKGROUND_GRADIENT_START_MOBILE_KEY,
            LOGIN_BACKGROUND_GRADIENT_END_MOBILE_KEY
        ),
        loginBackgroundColorMobile: (settings[LOGIN_BACKGROUND_COLOR_MOBILE_KEY] as string) || DEFAULT_LOGIN_BACKGROUND_COLOR,
    };
}

export function buildLoadedEvaluateHeaderState(settings: SettingsRecord): LoadedEvaluateHeaderState {
    const evaluateHeaderBackgroundGradient = buildGradientPreference(
        settings,
        'evaluateHeaderBackgroundGradient',
        EVALUATE_HEADER_BACKGROUND_GRADIENT_START_KEY,
        EVALUATE_HEADER_BACKGROUND_GRADIENT_END_KEY,
        DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
        DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END
    ) ?? hslGradientToGradientString(
        DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_START,
        DEFAULT_EVALUATE_HEADER_BACKGROUND_GRADIENT_END
    );

    return {
        evaluateHeaderBackgroundType: (settings[EVALUATE_HEADER_BACKGROUND_TYPE_KEY] as EvaluateHeaderBackgroundType) || DEFAULT_EVALUATE_HEADER_BACKGROUND_TYPE,
        evaluateHeaderBackgroundImage: asStringOrNull(settings[EVALUATE_HEADER_BACKGROUND_IMAGE_KEY]),
        evaluateHeaderBackgroundGradient,
        evaluateHeaderBackgroundColor: (settings[EVALUATE_HEADER_BACKGROUND_COLOR_KEY] as string) || DEFAULT_EVALUATE_HEADER_BACKGROUND_COLOR,
        evaluateHeaderTextColor: (settings[EVALUATE_HEADER_TEXT_COLOR_KEY] as string) || DEFAULT_EVALUATE_HEADER_TEXT_COLOR,
        evaluatePlatformLogoDataUrl: asStringOrNull(settings[EVALUATE_PLATFORM_LOGO_DATA_URL_KEY]),
        evaluateReportLogoDataUrl: asStringOrNull(settings[EVALUATE_REPORT_LOGO_DATA_URL_KEY]),
    };
}
