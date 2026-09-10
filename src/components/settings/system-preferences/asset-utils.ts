import {
    APP_LOGO_DATA_URL_KEY,
    LOGIN_BACKGROUND_IMAGE_KEY,
    LOGIN_BACKGROUND_IMAGE_MOBILE_KEY,
    SPLASH_LOGO_DATA_URL_KEY,
} from './constants';

const DEFAULT_MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type ImageFileLike = Pick<File, 'size' | 'type'>;
type SettingsRecord = Record<string, unknown>;

export type ImageFileValidationResult =
    | { valid: true }
    | { valid: false; message: string };

export type UploadImageResponse = {
    url?: unknown;
    file?: {
        url?: unknown;
    } | null;
};

export interface SavedSystemPreferenceAssetUpdates {
    appLogoDataUrl?: string;
    loginBackgroundImage?: string;
    loginBackgroundImageMobile?: string;
    splashLogoDataUrl?: string;
}

export interface SavedSystemPreferenceAssetSetters {
    setSavedLogoUrl: (value: string) => void;
    setSavedLoginImageDataUrl: (value: string) => void;
    setSavedLoginImageDataUrlMobile: (value: string) => void;
    setSavedSplashLogoDataUrl: (value: string) => void;
}

function asStringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value ? value : null;
}

export function validateSystemPreferenceImageFile(
    file: ImageFileLike,
    maxSizeBytes: number = DEFAULT_MAX_IMAGE_FILE_SIZE_BYTES
): ImageFileValidationResult {
    if (!file.type.startsWith('image/')) {
        return { valid: false, message: 'Please select an image file' };
    }

    if (file.size > maxSizeBytes) {
        return { valid: false, message: 'File size must be less than 5MB' };
    }

    return { valid: true };
}

export function getUploadImageUrl(uploadData: UploadImageResponse | null | undefined): string | null {
    if (typeof uploadData?.url === 'string' && uploadData.url.trim()) {
        return uploadData.url;
    }

    if (typeof uploadData?.file?.url === 'string' && uploadData.file.url.trim()) {
        return uploadData.file.url;
    }

    return null;
}

export function shouldRevokeTrackedPreviewUrl(
    previewUrl: string | null | undefined,
    trackedUrls: ReadonlySet<string>
): previewUrl is string {
    return Boolean(previewUrl && trackedUrls.has(previewUrl));
}

export function getSavedSystemPreferenceAssetUpdates(data: SettingsRecord): SavedSystemPreferenceAssetUpdates {
    const updates: SavedSystemPreferenceAssetUpdates = {};

    const appLogoDataUrl = asStringOrNull(data[APP_LOGO_DATA_URL_KEY]);
    const loginBackgroundImage = asStringOrNull(data[LOGIN_BACKGROUND_IMAGE_KEY]);
    const loginBackgroundImageMobile = asStringOrNull(data[LOGIN_BACKGROUND_IMAGE_MOBILE_KEY]);
    const splashLogoDataUrl = asStringOrNull(data[SPLASH_LOGO_DATA_URL_KEY]);

    if (appLogoDataUrl) updates.appLogoDataUrl = appLogoDataUrl;
    if (loginBackgroundImage) updates.loginBackgroundImage = loginBackgroundImage;
    if (loginBackgroundImageMobile) updates.loginBackgroundImageMobile = loginBackgroundImageMobile;
    if (splashLogoDataUrl) updates.splashLogoDataUrl = splashLogoDataUrl;

    return updates;
}

export function applySavedSystemPreferenceAssetUpdates(
    updates: SavedSystemPreferenceAssetUpdates,
    setters: SavedSystemPreferenceAssetSetters
) {
    if (updates.appLogoDataUrl) setters.setSavedLogoUrl(updates.appLogoDataUrl);
    if (updates.loginBackgroundImage) setters.setSavedLoginImageDataUrl(updates.loginBackgroundImage);
    if (updates.loginBackgroundImageMobile) setters.setSavedLoginImageDataUrlMobile(updates.loginBackgroundImageMobile);
    if (updates.splashLogoDataUrl) setters.setSavedSplashLogoDataUrl(updates.splashLogoDataUrl);
}
