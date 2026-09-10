import type { PlatformModuleId } from '@/lib/types';

export type HrModuleKey =
  | 'clients'
  | 'people'
  | 'onboarding'
  | 'documents'
  | 'teams'
  | 'attendance'
  | 'leave'
  | 'performance'
  | 'learning'
  | 'payroll'
  | 'payroll-runs'
  | 'payslips'
  | 'compensation'
  | 'benefits'
  | 'payroll-reports';

export interface HrModuleConfig {
  key: HrModuleKey;
  title: string;
  eyebrow: string;
  description: string;
  apiPath: string;
  permission: PlatformModuleId;
  managePermission: PlatformModuleId;
  primaryMetricLabel: string;
  secondaryMetricLabel: string;
  resourceViews?: Array<{
    label: string;
    view?: string;
  }>;
}

export const HR_MODULE_CONFIGS: Record<HrModuleKey, HrModuleConfig> = {
  clients: {
    key: 'clients',
    title: 'Client List',
    eyebrow: 'Clients',
    description: 'Customer organizations, primary contacts, and subcontract employee assignments.',
    apiPath: '/api/hr/clients',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    primaryMetricLabel: 'Clients',
    secondaryMetricLabel: 'Active clients',
  },
  people: {
    key: 'people',
    title: 'Employee Directory',
    eyebrow: 'People',
    description: 'Core employee records, departments, managers, and employment status.',
    apiPath: '/api/hr/employees',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    primaryMetricLabel: 'Employees',
    secondaryMetricLabel: 'Active employees',
  },
  onboarding: {
    key: 'onboarding',
    title: 'Onboarding',
    eyebrow: 'People',
    description: 'New hire onboarding progress, templates, and setup tasks.',
    apiPath: '/api/hr/onboarding',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    primaryMetricLabel: 'Onboarding cases',
    secondaryMetricLabel: 'Avg progress',
    resourceViews: [
      { label: 'Cases' },
      { label: 'Templates', view: 'templates' },
      { label: 'Tasks', view: 'tasks' },
    ],
  },
  documents: {
    key: 'documents',
    title: 'Employee Documents',
    eyebrow: 'People',
    description: 'Document register for contracts, policies, certifications, and expiring files.',
    apiPath: '/api/hr/documents',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    primaryMetricLabel: 'Documents',
    secondaryMetricLabel: 'Pending documents',
  },
  teams: {
    key: 'teams',
    title: 'Departments',
    eyebrow: 'People',
    description: 'Organization structure across division, department, and section.',
    apiPath: '/api/hr/departments',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    primaryMetricLabel: 'Departments',
    secondaryMetricLabel: 'Active departments',
  },
  attendance: {
    key: 'attendance',
    title: 'Attendance',
    eyebrow: 'Workforce',
    description: 'Daily attendance records, exceptions, hours worked, and clock-in status.',
    apiPath: '/api/hr/attendance',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    primaryMetricLabel: 'Attendance records',
    secondaryMetricLabel: 'Present records',
    resourceViews: [
      { label: 'Attendance' },
      { label: 'Schedules', view: 'schedules' },
      { label: 'Shifts', view: 'shifts' },
      { label: 'Holidays', view: 'holidays' },
    ],
  },
  leave: {
    key: 'leave',
    title: 'Leave',
    eyebrow: 'Workforce',
    description: 'Leave requests, balances, approvals, and upcoming planned absence.',
    apiPath: '/api/hr/leave',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    primaryMetricLabel: 'Leave requests',
    secondaryMetricLabel: 'Pending approval',
    resourceViews: [
      { label: 'Requests' },
      { label: 'Policies', view: 'policies' },
      { label: 'Balances', view: 'balances' },
      { label: 'Holidays', view: 'holidays' },
      { label: 'Leave blocks', view: 'blocks' },
    ],
  },
  performance: {
    key: 'performance',
    title: 'Performance',
    eyebrow: 'Workforce',
    description: 'Performance cycles, employee reviews, goals, and completion progress.',
    apiPath: '/api/hr/performance',
    permission: 'HR_PERFORMANCE_VIEW',
    managePermission: 'HR_PERFORMANCE_MANAGE',
    primaryMetricLabel: 'Reviews',
    secondaryMetricLabel: 'Completed reviews',
    resourceViews: [
      { label: 'Reviews' },
      { label: 'Cycles', view: 'cycles' },
      { label: 'Goals', view: 'goals' },
    ],
  },
  learning: {
    key: 'learning',
    title: 'Learning',
    eyebrow: 'Workforce',
    description: 'Courses, enrollments, certifications, and required learning progress.',
    apiPath: '/api/hr/learning',
    permission: 'HR_LEARNING_VIEW',
    managePermission: 'HR_LEARNING_MANAGE',
    primaryMetricLabel: 'Enrollments',
    secondaryMetricLabel: 'Completed enrollments',
    resourceViews: [
      { label: 'Enrollments' },
      { label: 'Courses', view: 'courses' },
      { label: 'Certifications', view: 'certifications' },
    ],
  },
  payroll: {
    key: 'payroll',
    title: 'Payroll Dashboard',
    eyebrow: 'Payroll',
    description: 'Payroll periods, run status, gross/net totals, and pending adjustments.',
    apiPath: '/api/hr/payroll',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Payroll runs',
    secondaryMetricLabel: 'Net total',
    resourceViews: [
      { label: 'Runs' },
      { label: 'Periods', view: 'periods' },
      { label: 'Run items', view: 'items' },
      { label: 'Adjustments', view: 'adjustments' },
    ],
  },
  'payroll-runs': {
    key: 'payroll-runs',
    title: 'Payroll Runs',
    eyebrow: 'Payroll',
    description: 'Payroll run tracking by period, status, gross total, and net total.',
    apiPath: '/api/hr/payroll?view=runs',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Payroll runs',
    secondaryMetricLabel: 'Processed runs',
    resourceViews: [
      { label: 'Runs', view: 'runs' },
      { label: 'Periods', view: 'periods' },
      { label: 'Run items', view: 'items' },
      { label: 'Adjustments', view: 'adjustments' },
    ],
  },
  payslips: {
    key: 'payslips',
    title: 'Payslips',
    eyebrow: 'Payroll',
    description: 'Payslip generation, publication status, and employee access tracking.',
    apiPath: '/api/hr/payroll?view=payslips',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Payslips',
    secondaryMetricLabel: 'Published payslips',
    resourceViews: [
      { label: 'Payslips', view: 'payslips' },
      { label: 'Run items', view: 'items' },
    ],
  },
  compensation: {
    key: 'compensation',
    title: 'Compensation',
    eyebrow: 'Payroll',
    description: 'Base salary, pay frequency, currency, and compensation effective dates.',
    apiPath: '/api/hr/payroll?view=compensation',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Packages',
    secondaryMetricLabel: 'Monthly packages',
    resourceViews: [
      { label: 'Compensation', view: 'compensation' },
      { label: 'Adjustments', view: 'adjustments' },
    ],
  },
  benefits: {
    key: 'benefits',
    title: 'Benefits',
    eyebrow: 'Payroll',
    description: 'Benefit plans, enrollment status, employer cost, and employee cost.',
    apiPath: '/api/hr/benefits',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Benefit plans',
    secondaryMetricLabel: 'Active enrollments',
    resourceViews: [
      { label: 'Plans' },
      { label: 'Enrollments', view: 'enrollments' },
    ],
  },
  'payroll-reports': {
    key: 'payroll-reports',
    title: 'Payroll Reports',
    eyebrow: 'Payroll',
    description: 'Payroll reporting summaries across periods, payslips, compensation, and benefits.',
    apiPath: '/api/hr/payroll?view=reports',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    primaryMetricLabel: 'Report lines',
    secondaryMetricLabel: 'Pending items',
    resourceViews: [
      { label: 'Runs', view: 'runs' },
      { label: 'Periods', view: 'periods' },
      { label: 'Run items', view: 'items' },
      { label: 'Payslips', view: 'payslips' },
      { label: 'Adjustments', view: 'adjustments' },
    ],
  },
};

export function getHrModuleConfig(key: HrModuleKey) {
  return HR_MODULE_CONFIGS[key];
}
