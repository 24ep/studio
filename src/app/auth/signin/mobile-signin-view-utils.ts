import type { CSSProperties } from 'react';

import { convertMinIOUrlToSecureUrl } from '../../../lib/imageUtils';
import { sanitizeUrl } from '../../../lib/security-url';
import type { MobileSignInContextualLogos } from './MobileSignInViewTypes';

export interface MobileSignInLogoInput {
    appLogoUrl: string | null;
    contextualLogos: MobileSignInContextualLogos;
    isThemeDark: boolean;
    mobileLoginLogoDataUrl?: string | null;
}

export interface MobileSignInHeaderStyleInput {
    mobileHeaderBackgroundType?: 'gradient' | 'transparent' | 'solid';
    mobileHeaderFontColor?: string;
    mobileHeaderGradient1?: string;
    mobileHeaderGradient2?: string;
    mobileHeaderGradient3?: string;
    mobileHeaderGradient4?: string;
}

function getTrimmedLogoUrl(value?: string | null) {
    return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function selectMobileSignInLogoUrl({
    appLogoUrl,
    contextualLogos,
    isThemeDark,
    mobileLoginLogoDataUrl,
}: MobileSignInLogoInput) {
    return getTrimmedLogoUrl(mobileLoginLogoDataUrl)
        ?? (isThemeDark
            ? getTrimmedLogoUrl(contextualLogos.loginPageLogoDarkMode)
            : getTrimmedLogoUrl(contextualLogos.loginPageLogoLightMode))
        ?? getTrimmedLogoUrl(appLogoUrl);
}

export function buildMobileSignInSecureLogoUrl(input: MobileSignInLogoInput) {
    const logoToUse = selectMobileSignInLogoUrl(input);
    return logoToUse ? sanitizeUrl(convertMinIOUrlToSecureUrl(logoToUse, true) || '') : null;
}

export function buildMobileSignInHeaderStyle({
    mobileHeaderBackgroundType = 'gradient',
    mobileHeaderFontColor = '#FFFFFF',
    mobileHeaderGradient1 = '#3B82F6',
    mobileHeaderGradient2 = '#2563EB',
    mobileHeaderGradient3 = '#1D4ED8',
    mobileHeaderGradient4 = '#1E40AF',
}: MobileSignInHeaderStyleInput): CSSProperties {
    const headerStyle: CSSProperties = {
        color: mobileHeaderFontColor,
        backgroundImage: 'none',
    };

    if (mobileHeaderBackgroundType === 'gradient') {
        headerStyle.background = `linear-gradient(135deg, ${mobileHeaderGradient1} 0%, ${mobileHeaderGradient2} 33%, ${mobileHeaderGradient3} 66%, ${mobileHeaderGradient4} 100%)`;
    } else if (mobileHeaderBackgroundType === 'solid') {
        headerStyle.backgroundColor = mobileHeaderGradient1;
    } else if (mobileHeaderBackgroundType === 'transparent') {
        headerStyle.background = 'transparent';
    }

    return headerStyle;
}

export function shouldShowMobileSignInAzureDivider({
    basicAuthEnabled,
    isAzureAdConfigured,
    loginStage,
}: {
    basicAuthEnabled: boolean;
    isAzureAdConfigured: boolean;
    loginStage: 'email' | 'otp';
}) {
    return basicAuthEnabled && isAzureAdConfigured && loginStage === 'email';
}

export function shouldShowMobileSignInAzureOnly({
    basicAuthEnabled,
    isAzureAdConfigured,
    loginStage,
}: {
    basicAuthEnabled: boolean;
    isAzureAdConfigured: boolean;
    loginStage: 'email' | 'otp';
}) {
    return !basicAuthEnabled && isAzureAdConfigured && loginStage === 'email';
}
