import type { CSSProperties } from 'react';

export interface MobileSignInContextualLogos {
    loginPageLogoLightMode?: string | null;
    loginPageLogoDarkMode?: string | null;
}

export interface MobileSignInViewProps {
    loginPageStyle: CSSProperties;
    appName: string;
    appLogoUrl: string | null;
    showLogoOnly: boolean;
    isThemeDark: boolean;
    contextualLogos: MobileSignInContextualLogos;
    errorMessage: string;
    basicAuthEnabled: boolean;
    isAzureAdConfigured: boolean;
    activeFontColor: string;
    activeBgStart: string;
    activeBgEnd: string;
    loginPageContent: string;
    loginPageFooter: string;
    loginPageLogoSize: number;
    mobileHeaderGradient1?: string;
    mobileHeaderGradient2?: string;
    mobileHeaderGradient3?: string;
    mobileHeaderGradient4?: string;
    mobileHeaderFontColor?: string;
    mobileHeaderBackgroundType?: 'gradient' | 'transparent' | 'solid';
    mobileLoginLogoDataUrl?: string | null;
    organizationName?: string;
    loginStage: 'email' | 'otp';
    onStageChange: (stage: 'email' | 'otp') => void;
}
