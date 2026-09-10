import type { GlobalTalentSearchResult } from '../../services/globalTalentSearchService';
import { hasAnyPermission, type SessionLikeUser } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export type HeaderSearchResultType = GlobalTalentSearchResult['type'] | 'page' | 'action';

export interface HeaderSearchPageResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  permissionIds?: PlatformModuleId[];
}

export type HeaderSearchTarget =
  | { type: 'route'; href: string }
  | { type: 'current-page-filter'; query: string }
  | { type: 'tasks-focus' };

export interface HeaderSearchResult {
  id: string;
  type: HeaderSearchResultType;
  title: string;
  subtitle?: string;
  meta?: string;
  target?: HeaderSearchTarget;
}

export interface HeaderSearchResultsSource {
  applicants: GlobalTalentSearchResult[];
  positions: GlobalTalentSearchResult[];
  users: GlobalTalentSearchResult[];
  hris: GlobalTalentSearchResult[];
}

export const EMPTY_HEADER_SEARCH_RESULTS: HeaderSearchResultsSource = {
  applicants: [],
  positions: [],
  users: [],
  hris: [],
};

export const HEADER_PAGE_RESULTS: HeaderSearchPageResult[] = [
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Overview', href: '/' },
  { id: 'page-applicants', title: 'Applicants', subtitle: 'Candidate management', href: '/applicants', permissionIds: ['applicantS_VIEW'] },
  { id: 'page-positions', title: 'Positions', subtitle: 'Open roles and hiring', href: '/positions', permissionIds: ['POSITIONS_VIEW'] },
  { id: 'page-my-tasks', title: 'My Tasks', subtitle: 'Task board', href: '/my-tasks', permissionIds: ['TASK_BOARD_VIEW', 'TASK_BOARD_MANAGE_OWN'] },
  { id: 'page-users', title: 'Users', subtitle: 'User management', href: '/settings/users', permissionIds: ['USERS_VIEW'] },
  { id: 'page-stages', title: 'Recruitment Stages', subtitle: 'Pipeline setup', href: '/settings/stages', permissionIds: ['RECRUITMENT_STAGES_VIEW'] },
  { id: 'page-custom-fields', title: 'Custom Fields', subtitle: 'Data configuration', href: '/settings/custom-fields', permissionIds: ['CUSTOM_FIELDS_EDIT'] },
  { id: 'page-system-settings', title: 'System Settings', subtitle: 'Platform configuration', href: '/settings/system-settings', permissionIds: ['SYSTEM_SETTINGS_VIEW'] },
  { id: 'page-people', title: 'People', subtitle: 'Employee records and organization', href: '/people', permissionIds: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'] },
  { id: 'page-performance', title: 'Performance', subtitle: 'Goals, feedback, and check-ins', href: '/workforce/performance', permissionIds: ['HR_PERFORMANCE_VIEW', 'HR_PERFORMANCE_MANAGE'] },
  { id: 'page-appraisal', title: 'Appraisal', subtitle: 'Formal review cycles in Performance', href: '/workforce/performance?tab=appraisal', permissionIds: ['HR_PERFORMANCE_VIEW', 'HR_PERFORMANCE_MANAGE'] },
  { id: 'page-payroll', title: 'Payroll', subtitle: 'Payroll operations and runs', href: '/payroll', permissionIds: ['HR_PAYROLL_VIEW', 'HR_PAYROLL_MANAGE'] },
  { id: 'page-expenses', title: 'Expenses', subtitle: 'Claims, advances, and travel', href: '/expenses', permissionIds: ['EXPENSES_VIEW', 'EXPENSES_APPROVE', 'EXPENSES_FINANCE'] },
  { id: 'page-learning', title: 'Learning', subtitle: 'Courses and certifications', href: '/learning', permissionIds: ['HR_LEARNING_VIEW', 'HR_LEARNING_MANAGE'] },
  { id: 'page-workday', title: 'My Workday', subtitle: 'Personal workday summary and quick actions', href: '/my-workday' },
  { id: 'page-leave', title: 'Leave', subtitle: 'Request leave and review balances', href: '/ess/leave' },
  { id: 'page-attendance', title: 'Attendance', subtitle: 'Clock activity and attendance history', href: '/ess/attendance' },
  { id: 'page-team', title: 'My Team', subtitle: 'Direct reports and manager approvals', href: '/ess/team', permissionIds: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'] },
  { id: 'page-org-chart', title: 'Org Chart', subtitle: 'Reporting lines and organization structure', href: '/people/org-chart', permissionIds: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'] },
  { id: 'page-holidays', title: 'Holidays', subtitle: 'Company holiday calendar', href: '/workforce/holidays', permissionIds: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'] },
  { id: 'page-shifts', title: 'Shifts and Attendance', subtitle: 'Schedules, shifts, and time operations', href: '/workforce/attendance', permissionIds: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'] },
  { id: 'page-expense-claims', title: 'Expense Claims', subtitle: 'Submit and track reimbursement claims', href: '/expenses/claims', permissionIds: ['EXPENSES_VIEW', 'EXPENSES_APPROVE', 'EXPENSES_FINANCE'] },
  { id: 'page-expense-accounting', title: 'Expense Accounting', subtitle: 'Review and post employee expenses', href: '/expenses/accounting', permissionIds: ['EXPENSES_APPROVE', 'EXPENSES_FINANCE'] },
  { id: 'page-financial-dimensions', title: 'Projects', subtitle: 'Govern project codes and cost-center assignments', href: '/settings/projects', permissionIds: ['SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_EDIT'] },
  { id: 'page-user-preferences', title: 'User Preferences', subtitle: 'Appearance, accessibility, locale, and navigation', href: '/settings/user-preferences' },
  { id: 'page-service-desk', title: 'Service Desk', subtitle: 'HR help and support requests', href: '/service-desk' },
  { id: 'page-release-notes', title: 'Release Notes', subtitle: 'Product updates and version history', href: '/privacy-support/releases' },
  { id: 'page-privacy', title: 'Privacy Policy', subtitle: 'Employee privacy and data handling', href: '/privacy-support/privacy-policy' },
];

export function formatSearchMeta(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' - ');
}

export function getSearchResultBadge(type: HeaderSearchResultType) {
  switch (type) {
    case 'applicant':
      return 'Applicant';
    case 'position':
      return 'Position';
    case 'user':
      return 'User';
    case 'employee':
      return 'Employee';
    case 'payroll':
      return 'Payroll';
    case 'expense':
      return 'Expense';
    case 'learning':
      return 'Learning';
    case 'performance':
      return 'Performance';
    case 'appraisal':
      return 'Appraisal';
    case 'case':
      return 'Case';
    case 'task':
      return 'Task';
    case 'setting':
      return 'Setting';
    case 'action':
      return 'Action';
    default:
      return 'Page';
  }
}

export function getSearchResultIconClassName(type: HeaderSearchResultType) {
  switch (type) {
    case 'applicant':
      return 'bg-blue-500/10 text-blue-600';
    case 'position':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'user':
      return 'bg-amber-500/10 text-amber-600';
    case 'employee':
    case 'learning':
      return 'bg-cyan-500/10 text-cyan-700';
    case 'payroll':
    case 'expense':
      return 'bg-green-500/10 text-green-700';
    case 'performance':
    case 'appraisal':
      return 'bg-fuchsia-500/10 text-fuchsia-700';
    case 'case':
    case 'task':
      return 'bg-orange-500/10 text-orange-700';
    case 'action':
      return 'bg-violet-500/10 text-violet-600';
    default:
      return 'bg-slate-500/10 text-slate-600';
  }
}

export function filterHeaderPageResults(query: string, limit = 6, user?: SessionLikeUser | null) {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  return HEADER_PAGE_RESULTS.filter(page => (
    !user || !page.permissionIds || hasAnyPermission(user, page.permissionIds)
  )).filter(
    page => page.title.toLowerCase().includes(trimmed) || page.subtitle?.toLowerCase().includes(trimmed)
  ).slice(0, limit);
}

export function getCurrentPageSearchAction(pathname: string | null | undefined, query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  if (pathname?.startsWith('/applicants')) {
    return {
      id: 'action-filter-applicants',
      type: 'action' as const,
      title: `Filter applicants by "${trimmed}"`,
      subtitle: 'Apply search in the current applicants page',
      target: { type: 'current-page-filter' as const, query: trimmed },
    };
  }

  if (pathname?.startsWith('/positions')) {
    return {
      id: 'action-filter-positions',
      type: 'action' as const,
      title: `Filter positions by "${trimmed}"`,
      subtitle: 'Apply search in the current positions page',
      target: { type: 'current-page-filter' as const, query: trimmed },
    };
  }

  if (pathname?.startsWith('/my-tasks')) {
    return {
      id: 'action-filter-mytasks',
      type: 'action' as const,
      title: `Filter tasks by "${trimmed}"`,
      subtitle: 'Apply search in the current tasks page',
      target: { type: 'tasks-focus' as const },
    };
  }

  return null;
}

export function buildHeaderSearchResults({
  currentPageAction,
  pageResults,
  results,
}: {
  currentPageAction: HeaderSearchResult | null;
  pageResults: HeaderSearchPageResult[];
  results: HeaderSearchResultsSource;
}): HeaderSearchResult[] {
  const mappedApplicants = results.applicants.map(result => ({
    id: `applicant-${result.id}`,
    type: 'applicant' as const,
    title: result.title,
    subtitle: result.subtitle,
    meta: result.meta,
    target: { type: 'route' as const, href: `/applicants?query=${encodeURIComponent(result.title)}` },
  }));

  const mappedPositions = results.positions.map(result => ({
    id: `position-${result.id}`,
    type: 'position' as const,
    title: result.title,
    subtitle: result.subtitle,
    meta: result.meta,
    target: { type: 'route' as const, href: `/positions/${result.id}` },
  }));

  const mappedUsers = results.users.map(result => ({
    id: `user-${result.id}`,
    type: 'user' as const,
    title: result.title,
    subtitle: result.subtitle,
    meta: result.meta,
    target: { type: 'route' as const, href: `/settings/users?search=${encodeURIComponent(result.title)}` },
  }));

  const mappedPages = pageResults.map(result => ({
    id: result.id,
    type: 'page' as const,
    title: result.title,
    subtitle: result.subtitle,
    target: { type: 'route' as const, href: result.href },
  }));

  const mappedHris = results.hris.map(result => ({
    id: `${result.type}-${result.id}`,
    type: result.type,
    title: result.title,
    subtitle: result.subtitle,
    meta: formatSearchMeta([result.domain, result.status, result.meta]),
    target: result.deepLink
      ? { type: 'route' as const, href: result.deepLink }
      : undefined,
  }));

  return [
    ...(currentPageAction ? [currentPageAction] : []),
    ...mappedApplicants,
    ...mappedPositions,
    ...mappedUsers,
    ...mappedHris,
    ...mappedPages,
  ];
}
