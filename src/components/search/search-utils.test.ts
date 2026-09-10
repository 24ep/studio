import { describe, expect, it } from 'vitest';
import {
  buildHeaderSearchResults,
  EMPTY_HEADER_SEARCH_RESULTS,
  filterHeaderPageResults,
  formatSearchMeta,
  getCurrentPageSearchAction,
  getSearchResultBadge,
  getSearchResultIconClassName,
} from './search-utils';
import type { SessionLikeUser } from '@/lib/permissions';

describe('search-utils', () => {
  it('formats metadata by omitting empty parts', () => {
    expect(formatSearchMeta(['Engineering', undefined, 'Bangkok'])).toBe('Engineering - Bangkok');
    expect(formatSearchMeta([undefined, undefined])).toBe('');
  });

  it('maps result types to badge labels and icon classes', () => {
    expect(getSearchResultBadge('applicant')).toBe('Applicant');
    expect(getSearchResultBadge('position')).toBe('Position');
    expect(getSearchResultBadge('user')).toBe('User');
    expect(getSearchResultBadge('action')).toBe('Action');
    expect(getSearchResultBadge('page')).toBe('Page');

    expect(getSearchResultIconClassName('applicant')).toContain('blue');
    expect(getSearchResultIconClassName('position')).toContain('emerald');
    expect(getSearchResultIconClassName('user')).toContain('amber');
    expect(getSearchResultIconClassName('action')).toContain('violet');
    expect(getSearchResultIconClassName('page')).toContain('slate');
  });

  it('filters header page results by title or subtitle after two characters', () => {
    expect(filterHeaderPageResults('a')).toEqual([]);
    expect(filterHeaderPageResults('candidate').map(result => result.id)).toEqual(['page-applicants']);
    expect(filterHeaderPageResults('settings').map(result => result.id)).toContain('page-system-settings');
  });

  it('filters registered destinations by the current user permissions', () => {
    const employee: SessionLikeUser = { role: 'Employee', modulePermissions: [] };
    const recruiter: SessionLikeUser = { role: 'Recruiter', modulePermissions: ['applicantS_VIEW'] };

    expect(filterHeaderPageResults('candidate', 6, employee)).toEqual([]);
    expect(filterHeaderPageResults('candidate', 6, recruiter).map(result => result.id)).toEqual(['page-applicants']);
  });

  it('builds current-page search actions from the pathname', () => {
    expect(getCurrentPageSearchAction('/applicants', 'ada')).toMatchObject({
      id: 'action-filter-applicants',
      target: { type: 'current-page-filter', query: 'ada' },
    });
    expect(getCurrentPageSearchAction('/positions/1', 'designer')).toMatchObject({
      id: 'action-filter-positions',
      target: { type: 'current-page-filter', query: 'designer' },
    });
    expect(getCurrentPageSearchAction('/my-tasks', 'review')).toMatchObject({
      id: 'action-filter-mytasks',
      target: { type: 'tasks-focus' },
    });
    expect(getCurrentPageSearchAction('/dashboard', 'ada')).toBeNull();
    expect(getCurrentPageSearchAction('/applicants', 'a')).toBeNull();
  });

  it('flattens action, talent, user, and page results in display order', () => {
    const results = buildHeaderSearchResults({
      currentPageAction: getCurrentPageSearchAction('/applicants', 'ada'),
      pageResults: filterHeaderPageResults('candidate'),
      results: {
        applicants: [{ id: 'a1', type: 'applicant', title: 'Ada Lovelace', subtitle: 'Engineer' }],
        positions: [{ id: 'p1', type: 'position', title: 'Frontend Lead' }],
        users: [{ id: 'u1', type: 'user', title: 'Grace Hopper' }],
        hris: [{ id: 't1', type: 'task', title: 'Approve leave', deepLink: '/leave' }],
      },
    });

    expect(results.map(result => result.id)).toEqual([
      'action-filter-applicants',
      'applicant-a1',
      'position-p1',
      'user-u1',
      'task-t1',
      'page-applicants',
    ]);
    expect(results[1].target).toEqual({ type: 'route', href: '/applicants?query=Ada%20Lovelace' });
    expect(results[2].target).toEqual({ type: 'route', href: '/positions/p1' });
    expect(results[3].target).toEqual({ type: 'route', href: '/settings/users?search=Grace%20Hopper' });
  });

  it('exports empty header search results with all result buckets', () => {
    expect(EMPTY_HEADER_SEARCH_RESULTS).toEqual({ applicants: [], positions: [], users: [], hris: [] });
  });
});
