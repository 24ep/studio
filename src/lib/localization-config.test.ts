import { describe, expect, it } from 'vitest';

import { createRuntimeLocalizationSnapshot } from './localization-config';

describe('createRuntimeLocalizationSnapshot', () => {
  it('removes AppKit authoring data that the application runtime does not use', () => {
    const snapshot = createRuntimeLocalizationSnapshot({
      config: {
        activePackageId: 'package-1',
        defaultLanguage: 'en',
        enabled: true,
        packages: [{ id: 'package-1', keywords: [{ key: 'hello', translation: 'Hello' }] }],
        supportedLanguages: [{ code: 'en', name: 'English' }],
        terminology: [{ key: 'hello', translation: 'Hello' }],
        translations: { en: { hello: 'Hello' } },
      },
      environment: 'production',
      loadedAt: '2026-08-08T00:00:00.000Z',
    });

    expect(snapshot.config).toEqual({
      defaultLanguage: 'en',
      enabled: true,
      fallbackLanguage: undefined,
      localeCookieKey: undefined,
      supportedLanguages: [{ code: 'en', name: 'English' }],
      translations: { en: { hello: 'Hello' } },
    });
    expect(snapshot.config).not.toHaveProperty('packages');
    expect(snapshot.config).not.toHaveProperty('terminology');
  });
});
