import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCollectionItems: vi.fn(),
  getLocalizationConfig: vi.fn(),
  getSystemSetting: vi.fn(),
  appKitConstructor: vi.fn(),
}));

vi.mock('@outborn/appkit-sdk', () => ({
  AppKit: class MockAppKit {
    cms = { getCollectionItems: mocks.getCollectionItems };
    localization = { getConfig: mocks.getLocalizationConfig };

    constructor(options: unknown) {
      mocks.appKitConstructor(options);
    }
  },
}));

vi.mock('@/lib/systemSettings', () => ({
  getSystemSetting: mocks.getSystemSetting,
}));

import {
  fetchAppKitSeedCollection,
  fetchAppKitSeedCollectionOrThrow,
  fetchAppKitLocalizationConfig,
  materializeAppKitLocalizationConfig,
} from './appkit-sdk-client';

describe('fetchAppKitSeedCollection', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const settings: Record<string, string> = {
      appkitApiBaseUrl: 'https://appkit.example.com/',
      appkitApiKey: '',
      appkitClientId: 'client-id',
      appkitClientSecretId: 'client-secret',
      appkitDevelopmentAppId: 'development-app',
      appkitProductionAppId: 'production-app',
    };
    mocks.getSystemSetting.mockImplementation(async (key: string) => settings[key] || null);
  });

  it('uses SDK 1.5 CMS collections and preserves the existing flattened record shape', async () => {
    mocks.getCollectionItems.mockResolvedValue({
      items: [{
        id: 'holiday-1',
        type: 'holiday_list',
        applicationId: 'production-app',
        status: 'published',
        attributes: { name: 'New Year', date: '2027-01-01', enabled: true },
      }],
      total: 1,
      page: 1,
      limit: 500,
      collection: 'holiday_list',
    });

    const records = await fetchAppKitSeedCollection<{
      name: string;
      date: string;
      enabled: boolean;
    }>('production', 'holiday_list');

    expect(mocks.appKitConstructor).toHaveBeenCalledWith({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      appId: 'production-app',
      domain: 'https://appkit.example.com',
    });
    expect(mocks.getCollectionItems).toHaveBeenCalledWith('holiday_list', {
      page: 1,
      limit: 500,
    });
    expect(records).toEqual([{
      name: 'New Year',
      date: '2027-01-01',
      enabled: true,
      __appkitId: 'holiday-1',
      __appkitAppId: 'production-app',
    }]);
  });

  it('reports missing integration settings instead of treating them as an empty collection', async () => {
    mocks.getSystemSetting.mockResolvedValue(null);

    await expect(fetchAppKitSeedCollectionOrThrow('production', 'document_templates'))
      .rejects.toMatchObject({ code: 'not_configured' });
    expect(mocks.getCollectionItems).not.toHaveBeenCalled();
  });

  it('supports an API key without a separate client ID', async () => {
    mocks.getSystemSetting.mockImplementation(async (key: string) => ({
      appkitApiBaseUrl: 'https://appkit.example.com',
      appkitApiKey: 'scoped-api-key',
      appkitProductionAppId: 'production-app',
    })[key] || null);
    mocks.getCollectionItems.mockResolvedValue({
      items: [], total: 0, page: 1, limit: 500, collection: 'document_templates',
    });

    await fetchAppKitSeedCollectionOrThrow('production', 'document_templates');

    expect(mocks.appKitConstructor).toHaveBeenCalledWith({
      apiKey: 'scoped-api-key',
      appId: 'production-app',
      clientId: 'production-app',
      domain: 'https://appkit.example.com',
    });
  });

  it('accepts deployment environment variables when database settings are absent', async () => {
    mocks.getSystemSetting.mockResolvedValue(null);
    vi.stubEnv('appkitApiBaseUrl', 'https://env-appkit.example.com/');
    vi.stubEnv('appkitClientId', 'env-client-id');
    vi.stubEnv('appkitClientSecretId', 'env-client-secret');
    vi.stubEnv('appkitProductionAppId', 'env-production-app');
    mocks.getCollectionItems.mockResolvedValue({
      items: [], total: 0, page: 1, limit: 500, collection: 'document_templates',
    });

    await fetchAppKitSeedCollectionOrThrow('production', 'document_templates');

    expect(mocks.appKitConstructor).toHaveBeenCalledWith({
      clientId: 'env-client-id',
      clientSecret: 'env-client-secret',
      appId: 'env-production-app',
      domain: 'https://env-appkit.example.com',
    });
  });

  it('loads the application localization configuration through the SDK', async () => {
    const localization = {
      enabled: true,
      defaultLanguage: 'en',
      supportedLanguages: [{ code: 'en' }, { code: 'th' }],
      translations: { en: { 'nav.home': 'Home' }, th: { 'nav.home': 'หน้าหลัก' } },
    };
    mocks.getLocalizationConfig.mockResolvedValue(localization);

    await expect(fetchAppKitLocalizationConfig('production')).resolves.toEqual(localization);
    expect(mocks.getLocalizationConfig).toHaveBeenCalledOnce();
  });

  it('materializes every active-package keyword into the language maps', () => {
    const config = materializeAppKitLocalizationConfig({
      activePackageId: 'core-copy',
      defaultLanguage: 'en',
      translations: { en: { 'site.action.login': 'Log in' } },
      packages: [{
        id: 'core-copy',
        keywords: [
          {
            key: 'site.action.login',
            label: 'Log in',
            translations: { en: 'Log in', th: 'เข้าสู่ระบบ' },
          },
          {
            key: 'site.hero.title',
            label: 'Clearer HR operations',
            translations: { en: 'Clearer HR operations', th: 'งาน HR ที่ชัดเจนขึ้น' },
          },
        ],
      }],
    });

    expect(config.translations).toEqual({
      en: {
        'site.action.login': 'Log in',
        'site.hero.title': 'Clearer HR operations',
      },
      th: {
        'site.action.login': 'เข้าสู่ระบบ',
        'site.hero.title': 'งาน HR ที่ชัดเจนขึ้น',
      },
    });
  });

  it('materializes top-level AppKit languages and terminology', () => {
    const config = materializeAppKitLocalizationConfig({
      defaultLanguage: 'en',
      languages: [{ code: 'en' }, { code: 'th', nativeName: 'ไทย' }],
      terminology: [{
        key: 'nav.dashboard',
        label: 'Dashboard',
        translations: { en: 'Dashboard', th: 'แดชบอร์ด' },
      }],
    });

    expect(config.supportedLanguages).toEqual([
      { code: 'en' },
      { code: 'th', nativeName: 'ไทย' },
    ]);
    expect(config.translations).toEqual({
      en: { 'nav.dashboard': 'Dashboard' },
      th: { 'nav.dashboard': 'แดชบอร์ด' },
    });
  });

  it('merges shared terminology with active-package keywords', () => {
    const config = materializeAppKitLocalizationConfig({
      activePackageId: 'workspace',
      defaultLanguage: 'en',
      terminology: [{
        key: 'nav.dashboard',
        label: 'Dashboard',
        translations: { en: 'Dashboard', th: 'แดชบอร์ด' },
      }],
      packages: [{
        id: 'workspace',
        keywords: [{
          key: 'people.title',
          label: 'People',
          translations: { en: 'People', th: 'บุคลากร' },
        }],
      }],
    });

    expect(config.translations).toEqual({
      en: { 'nav.dashboard': 'Dashboard', 'people.title': 'People' },
      th: { 'nav.dashboard': 'แดชบอร์ด', 'people.title': 'บุคลากร' },
    });
  });
});
