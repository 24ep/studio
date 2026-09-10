import { describe, expect, it } from 'vitest';
import {
  getMobileSearchEventName,
  isHeaderHiddenOnMobileDetail,
  shouldShowMobileSearchButton,
} from './header-utils';

describe('header-utils', () => {
  it('detects top-level mobile search pages case-insensitively', () => {
    expect(shouldShowMobileSearchButton('/applicants')).toBe(true);
    expect(shouldShowMobileSearchButton('/Applicants')).toBe(true);
    expect(shouldShowMobileSearchButton('/positions')).toBe(true);
    expect(shouldShowMobileSearchButton('/positions/123')).toBe(false);
    expect(shouldShowMobileSearchButton('/settings')).toBe(false);
  });

  it('maps searchable routes to mobile search events', () => {
    expect(getMobileSearchEventName('/applicants')).toBe('applicants:toggle-mobile-search');
    expect(getMobileSearchEventName('/positions')).toBe('positions:toggle-mobile-search');
    expect(getMobileSearchEventName('/settings')).toBeNull();
  });

  it('hides the mobile header on applicant and position detail pages', () => {
    expect(isHeaderHiddenOnMobileDetail('/applicants/abc')).toBe(true);
    expect(isHeaderHiddenOnMobileDetail('/Applicants/abc')).toBe(true);
    expect(isHeaderHiddenOnMobileDetail('/positions/abc')).toBe(true);
    expect(isHeaderHiddenOnMobileDetail('/applicants')).toBe(false);
    expect(isHeaderHiddenOnMobileDetail('/settings/users')).toBe(false);
  });
});
