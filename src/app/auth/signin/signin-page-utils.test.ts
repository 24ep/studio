import { describe, expect, it } from 'vitest';

import type { SystemSetting } from '@/lib/types';
import {
  DEFAULT_PRIMARY_GRADIENT_END_SIGNIN,
  DEFAULT_PRIMARY_GRADIENT_START_SIGNIN,
  buildSignInActiveColors,
  buildSignInAuthConfigState,
  getInitialSignInSetting,
  getSafeSignInRedirectUrl,
  normalizeSignInSettingsPayload,
} from './signin-page-utils';
import {
  DEFAULT_LOGIN_BG_GRADIENT,
  DEFAULT_LOGIN_BG_GRADIENT_DARK,
  buildLoginPageStyle,
} from './signin-page-settings-style';
import {
  APP_CONFIG_APP_NAME_KEY,
  APP_LOGO_DATA_URL_KEY,
  DEFAULT_APP_NAME,
  buildFetchedSignInPageSettings,
} from './signin-page-fetched-settings';
import {
  loadSignInAuthConfigState,
  loadSignInPageSettings,
} from './signin-page-settings-api';
import { buildInitialSignInPageSettingsState } from './signin-page-settings-state';
import {
  buildMobileSignInHeaderStyle,
  selectMobileSignInLogoUrl,
  shouldShowMobileSignInAzureDivider,
  shouldShowMobileSignInAzureOnly,
} from './mobile-signin-view-utils';

describe('signin page utilities', () => {
  it('normalizes system settings payloads from array and object API shapes', () => {
    expect(normalizeSignInSettingsPayload({
      settings: [
        { key: 'appName', value: 'Talent Desk' },
        { key: 'basicAuthEnabled', value: 'false' },
        { value: 'ignored' },
      ],
    })).toEqual({
      appName: 'Talent Desk',
      basicAuthEnabled: 'false',
    });

    expect(normalizeSignInSettingsPayload({
      appName: 'Object Shape',
      isAzureAdConfigured: true,
    })).toEqual({
      appName: 'Object Shape',
      isAzureAdConfigured: true,
    });

    expect(normalizeSignInSettingsPayload(null)).toEqual({});
  });

  it('reads initial signin settings with fallback values', () => {
    const settings: SystemSetting[] = [{ key: 'appName', value: 'HRI Pro' }];

    expect(getInitialSignInSetting(settings, 'appName', 'HRI')).toBe('HRI Pro');
    expect(getInitialSignInSetting(settings, 'missing', 'fallback')).toBe('fallback');
    expect(getInitialSignInSetting(undefined, 'appName', 'HRI')).toBe('HRI');
  });

  it('builds initial signin page state from server-provided settings', () => {
    expect(buildInitialSignInPageSettingsState([
      { key: 'appName', value: 'Talent Desk' },
      { key: APP_LOGO_DATA_URL_KEY, value: '/logo.png' },
      { key: 'showLogoOnly', value: 'true' },
      { key: 'loginPageLayoutType', value: 'split' },
      { key: 'loginPageLogoSize', value: '132' },
    ])).toEqual({
      appLogoUrl: '/logo.png',
      currentAppName: 'Talent Desk',
      loginLayoutType: 'split',
      loginPageLogoSize: 132,
      showLogoOnly: true,
    });

    expect(buildInitialSignInPageSettingsState(undefined)).toMatchObject({
      appLogoUrl: null,
      currentAppName: DEFAULT_APP_NAME,
      showLogoOnly: false,
    });
  });

  it('builds active signin colors from light, dark, and default states', () => {
    const settings: SystemSetting[] = [
      { key: 'primaryGradientStart', value: '1 2% 3%' },
      { key: 'primaryGradientEnd', value: '4 5% 6%' },
      { key: 'sidebarActiveTextL', value: '#111111' },
      { key: 'sidebarActiveTextD', value: '#eeeeee' },
    ];

    expect(buildSignInActiveColors({ initialSettings: settings, isThemeDark: false })).toEqual({
      activeFontColor: '#111111',
      activeBgStart: '1 2% 3%',
      activeBgEnd: '4 5% 6%',
    });
    expect(buildSignInActiveColors({ initialSettings: settings, isThemeDark: true }).activeFontColor).toBe('#eeeeee');
    expect(buildSignInActiveColors({ initialSettings: undefined, isThemeDark: false })).toEqual({
      activeFontColor: '#fff',
      activeBgStart: DEFAULT_PRIMARY_GRADIENT_START_SIGNIN,
      activeBgEnd: DEFAULT_PRIMARY_GRADIENT_END_SIGNIN,
    });
  });

  it('hardens signin callback redirects', () => {
    expect(getSafeSignInRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeSignInRedirectUrl('https://evil.example')).toBe('/');
    expect(getSafeSignInRedirectUrl('//evil.example')).toBe('/');
    expect(getSafeSignInRedirectUrl('/auth/signin?callbackUrl=/dashboard')).toBe('/');
    expect(getSafeSignInRedirectUrl(null)).toBe('/');
  });

  it('builds signin auth config state from either API shape', () => {
    expect(buildSignInAuthConfigState({
      settings: [{ key: 'basicAuthEnabled', value: 'false' }],
      isAzureAdConfigured: 'true',
    })).toEqual({
      settings: { basicAuthEnabled: 'false' },
      isAzureAdConfigured: true,
      basicAuthEnabled: false,
    });

    expect(buildSignInAuthConfigState({
      basicAuthEnabled: true,
      isAzureAdConfigured: false,
    })).toEqual({
      settings: {
        basicAuthEnabled: true,
        isAzureAdConfigured: false,
      },
      isAzureAdConfigured: false,
      basicAuthEnabled: true,
    });
  });

  it('loads signin page settings from the system settings API', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      settings: [
        { key: 'appName', value: 'Talent Desk' },
        { key: APP_LOGO_DATA_URL_KEY, value: '/logo.png' },
        { key: 'showLogoOnly', value: 'true' },
      ],
    }));

    const result = await loadSignInPageSettings({
      fetcher,
      isMobile: false,
      isThemeDark: false,
    });

    expect(result.appName).toBe('Talent Desk');
    expect(result.logoUrl).toBe('/logo.png');
    expect(result.pageSettings).toMatchObject({
      currentAppName: 'Talent Desk',
      appLogoUrl: '/logo.png',
      showLogoOnly: true,
    });
  });

  it('falls back to local signin settings when the settings API throws', async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error('offline');
    };
    const storage = {
      getItem: (key: string) => {
        if (key === APP_CONFIG_APP_NAME_KEY) {
          return 'Stored App';
        }
        if (key === APP_LOGO_DATA_URL_KEY) {
          return '/stored-logo.png';
        }
        return null;
      },
    };

    const result = await loadSignInPageSettings({
      fetcher,
      isMobile: false,
      isThemeDark: false,
      storage,
    });

    expect(result).toEqual({
      appName: 'Stored App',
      logoUrl: '/stored-logo.png',
      pageSettings: null,
    });
  });

  it('uses safe signin defaults when settings API responses are unavailable', async () => {
    const failingFetcher: typeof fetch = async () => new Response(null, {
      status: 503,
    });

    await expect(loadSignInPageSettings({
      fetcher: failingFetcher,
      isMobile: false,
      isThemeDark: false,
    })).resolves.toEqual({
      appName: DEFAULT_APP_NAME,
      logoUrl: null,
      pageSettings: null,
    });

    await expect(loadSignInAuthConfigState(failingFetcher)).resolves.toEqual({
      settings: {},
      isAzureAdConfigured: false,
      basicAuthEnabled: true,
    });
  });

  it('builds signin background styles for image, solid, and gradient backgrounds', () => {
    expect(buildLoginPageStyle({
      isThemeDark: false,
      loginBgType: 'image',
      loginBgImageUrl: '/login.png',
      loginBgColor1: null,
      loginBgColor2: null,
      activeLoginGradient: null,
      activeLoginSolidColor: null,
    })).toMatchObject({
      backgroundImage: 'url("/login.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });

    expect(buildLoginPageStyle({
      isThemeDark: false,
      loginBgType: 'solid',
      loginBgImageUrl: null,
      loginBgColor1: '220 15% 10%',
      loginBgColor2: null,
      activeLoginGradient: null,
      activeLoginSolidColor: null,
    }).backgroundColor).toBe('hsl(220 15% 10%)');

    expect(buildLoginPageStyle({
      isThemeDark: false,
      loginBgType: 'gradient',
      loginBgImageUrl: null,
      loginBgColor1: null,
      loginBgColor2: null,
      activeLoginGradient: null,
      activeLoginSolidColor: null,
    }).backgroundImage).toBe(DEFAULT_LOGIN_BG_GRADIENT);

    expect(buildLoginPageStyle({
      isThemeDark: true,
      loginBgType: 'gradient',
      loginBgImageUrl: null,
      loginBgColor1: null,
      loginBgColor2: null,
      activeLoginGradient: null,
      activeLoginSolidColor: null,
    }).backgroundImage).toBe(DEFAULT_LOGIN_BG_GRADIENT_DARK);
  });

  it('builds fetched signin page settings for mobile-specific backgrounds', () => {
    const settings = buildFetchedSignInPageSettings({
      isMobile: true,
      isThemeDark: false,
      settings: {
        appName: 'Talent Desk',
        appLogoDataUrl: '/logo.png',
        loginPageLayoutType: 'split',
        loginPageLogoSize: '144',
        loginBackgroundType: 'solid',
        loginBackgroundColor: '#ffffff',
        loginBackgroundTypeMobile: 'gradient',
        loginBackgroundGradientMobile: 'linear-gradient(red, blue)',
        mobileHeaderFontColor: '#111111',
        mobileLoginLogoDataUrl: '/mobile-logo.png',
        organizationName: 'Example Org',
        showLogoOnly: 'true',
      },
    });

    expect(settings.currentAppName).toBe('Talent Desk');
    expect(settings.loginLayoutType).toBe('split');
    expect(settings.loginPageLogoSize).toBe(144);
    expect(settings.loginPageStyle.background).toBe('linear-gradient(red, blue)');
    expect(settings.mobileHeaderFontColor).toBe('#111111');
    expect(settings.mobileLoginLogoDataUrl).toBe('/mobile-logo.png');
    expect(settings.organizationName).toBe('Example Org');
    expect(settings.showLogoOnly).toBe(true);
  });

  it('derives mobile signin logo, header style, and Azure button visibility', () => {
    expect(selectMobileSignInLogoUrl({
      appLogoUrl: '/app-logo.png',
      contextualLogos: {
        loginPageLogoLightMode: '/light-logo.png',
        loginPageLogoDarkMode: '/dark-logo.png',
      },
      isThemeDark: true,
      mobileLoginLogoDataUrl: '/mobile-logo.png',
    })).toBe('/mobile-logo.png');

    expect(selectMobileSignInLogoUrl({
      appLogoUrl: '/app-logo.png',
      contextualLogos: {
        loginPageLogoLightMode: '/light-logo.png',
        loginPageLogoDarkMode: ' ',
      },
      isThemeDark: true,
    })).toBe('/app-logo.png');

    expect(buildMobileSignInHeaderStyle({
      mobileHeaderBackgroundType: 'solid',
      mobileHeaderFontColor: '#111111',
      mobileHeaderGradient1: '#eeeeee',
    })).toMatchObject({
      color: '#111111',
      backgroundColor: '#eeeeee',
      backgroundImage: 'none',
    });

    expect(buildMobileSignInHeaderStyle({
      mobileHeaderBackgroundType: 'transparent',
    }).background).toBe('transparent');

    expect(shouldShowMobileSignInAzureDivider({
      basicAuthEnabled: true,
      isAzureAdConfigured: true,
      loginStage: 'email',
    })).toBe(true);
    expect(shouldShowMobileSignInAzureOnly({
      basicAuthEnabled: false,
      isAzureAdConfigured: true,
      loginStage: 'email',
    })).toBe(true);
    expect(shouldShowMobileSignInAzureOnly({
      basicAuthEnabled: false,
      isAzureAdConfigured: true,
      loginStage: 'otp',
    })).toBe(false);
  });
});
