import { describe, expect, it } from 'vitest';

import { localizeSidebarText } from './sidebar-localization';

describe('localizeSidebarText', () => {
  it('uses navigation namespace entries from legacy AppKit catalogs', () => {
    const translations: Record<string, string> = {
      'navigation.applicants': 'ผู้สมัคร',
      'navigation.group.recruitment': 'การสรรหา',
    };
    const t = (key: string, fallback?: string) => translations[key] || fallback || key;

    expect(localizeSidebarText(t, 'item', 'applicants', 'Applicants')).toBe('ผู้สมัคร');
    expect(localizeSidebarText(t, 'group', 'recruitment', 'Recruitment')).toBe('การสรรหา');
  });

  it('keeps the original label when no catalog key exists', () => {
    expect(localizeSidebarText((key, fallback) => fallback || key, 'item', 'payroll', 'Payroll')).toBe('Payroll');
  });

  it('falls back to catalog matching by visible source copy', () => {
    const t = (key: string, fallback?: string) => {
      if (fallback === 'Applicants') return 'ผู้สมัคร';
      return fallback || key;
    };

    expect(localizeSidebarText(t, 'item', 'applicants', 'Applicants')).toBe('ผู้สมัคร');
  });
});
