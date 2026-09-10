import { describe, expect, it } from 'vitest';
import {
  localeMatches,
  localizationKeyCandidates,
  preserveTextWhitespace,
  resolveSupportedLocale,
  translateWithConfig,
} from './localization-utils';

describe('localization utilities', () => {
  it('matches regional and base locale codes', () => {
    expect(localeMatches('th-TH', 'th')).toBe(true);
    expect(localeMatches('en_US', 'en-us')).toBe(true);
  });

  it('resolves a preferred base locale to the configured regional code', () => {
    expect(resolveSupportedLocale('th', ['en-US', 'th-TH'])).toBe('th-TH');
    expect(resolveSupportedLocale('fr', ['en-US', 'th-TH'], 'th')).toBe('th-TH');
  });

  it('resolves semantic keys and source-copy aliases', () => {
    const config = {
      defaultLanguage: 'en',
      translations: {
        en: { 'nav.dashboard': 'Dashboard' },
        th: { 'nav.dashboard': 'แดชบอร์ด' },
      },
    };
    expect(translateWithConfig(config, 'th', 'nav.dashboard', 'Dashboard')).toBe('แดชบอร์ด');
    expect(translateWithConfig(config, 'th', 'dashboard.title', 'Dashboard')).toBe('แดชบอร์ด');
  });

  it('uses one canonical common label across legacy key namespaces', () => {
    const config = {
      defaultLanguage: 'en',
      translations: {
        en: { 'common.loading': 'Loading…' },
        th: { 'common.loading': '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14…' },
      },
    };

    expect(localizationKeyCandidates('app-common.loading')[0]).toBe('common.loading');
    expect(translateWithConfig(config, 'th', 'app.common.loading', 'Loading...'))
      .toBe('\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14…');
  });

  it('translates rendered copy from an AppKit placeholder template', () => {
    const config = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      translations: {
        en: { 'source.edit': 'Edit {0}' },
        th: { 'source.edit': '\u0e41\u0e01\u0e49\u0e44\u0e02 {0}' },
      },
    };

    expect(translateWithConfig(config, 'th', 'Edit Ada', 'Edit Ada')).toBe('\u0e41\u0e01\u0e49\u0e44\u0e02 Ada');
  });

  it('keeps named placeholder values when a translation reorders them', () => {
    const config = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      translations: {
        en: { 'source.assignment': '{person} assigned to {position}' },
        th: { 'source.assignment': '{position} \u2190 {person}' },
      },
    };

    expect(translateWithConfig(config, 'th', 'Ada assigned to Recruiter', 'Ada assigned to Recruiter'))
      .toBe('Recruiter \u2190 Ada');
  });

  it('preserves whitespace around translated text', () => {
    expect(preserveTextWhitespace('  Dashboard\n', 'แดชบอร์ด')).toBe('  แดชบอร์ด\n');
  });
});
