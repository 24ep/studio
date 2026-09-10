import type { PlatformSetupFeatureId, PlatformSetupFeatureStatus } from '@/lib/admin-platform-setup';

import type { SettingsPageItem } from './settings-page-model';

export type HrSetupView = 'guided' | 'map';
export type HrSetupReadiness = 'ready' | 'attention' | 'available';

export const hrSetupFeatureByLabel: Partial<Record<string, PlatformSetupFeatureId>> = {
  'Company Info': 'company-email-domain',
  'Company References': 'company-reference',
  'Platform Defaults': 'platform-defaults',
  'Dropdown Options': 'dropdown-options',
  'Leave Policies': 'leave-policies',
  'Policy Documents': 'policy-documents',
  'Onboarding Checklist': 'onboarding-templates',
  'Headcount Types': 'headcount-types',
  Grades: 'grades',
  'Position Levels': 'position-levels',
  'Recruitment Stages': 'recruitment-stages',
  'Applicant Sources': 'applicant-sources',
  'Evaluation Configuration': 'evaluation-configuration',
};

export const hrSetupMapColumns = [
  { label: 'Organization', itemLabels: ['Company Info', 'Branch', 'Department'] },
  { label: 'People structure', itemLabels: ['Designation', 'Grades', 'Position Levels', 'Headcount Types', 'Employee Lifecycle Policies', 'Journey Configuration', 'Onboarding Templates', 'Employee Document Templates'] },
  { label: 'Policies & operations', itemLabels: ['Leave Policies', 'Policy Documents', 'Employee Documents', 'Onboarding Checklist', 'Workforce Rules', 'Leave & Absence Policies', 'Leave Policy Assignments', 'Holiday Calendars', 'Leave Block List', 'Payroll & Expense Policies', 'Compensation Approval Routes', 'Payroll Approval Routes'] },
  { label: 'Talent lifecycle', itemLabels: ['Recruitment Stages', 'Applicant Sources', 'Evaluation Configuration', 'Performance & Learning Policies', 'Learning Taxonomy'] },
] as const;

export const hrSetupMilestones = [
  { label: 'Company foundation', itemLabels: ['Company Info', 'Company References', 'Branch', 'Department'] },
  { label: 'Workforce structure', itemLabels: ['Designation', 'Grades', 'Position Levels', 'Headcount Types'] },
  { label: 'Policies & time', itemLabels: ['Leave Policies', 'Policy Documents', 'Employee Documents', 'Onboarding Checklist'] },
  { label: 'Hiring workflow', itemLabels: ['Recruitment Stages', 'Applicant Sources', 'Evaluation Configuration'] },
  { label: 'People lifecycle', itemLabels: ['Employee Lifecycle Policies', 'Journey Configuration', 'Onboarding Templates', 'Employee Document Templates'] },
  { label: 'Workforce', itemLabels: ['Workforce Rules', 'Leave & Absence Policies', 'Leave Policy Assignments', 'Holiday Calendars', 'Leave Block List'] },
  { label: 'Payroll & expenses', itemLabels: ['Payroll & Expense Policies', 'Compensation Approval Routes', 'Payroll Approval Routes'] },
  { label: 'Performance & learning', itemLabels: ['Performance & Learning Policies', 'Learning Taxonomy'] },
] as const;

export function getUniqueHrSetupItems(items: SettingsPageItem[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.label}:${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getHrSetupReadiness(
  item: SettingsPageItem,
  statuses: PlatformSetupFeatureStatus[],
): HrSetupReadiness {
  const featureId = hrSetupFeatureByLabel[item.label];
  if (!featureId) return 'available';
  const status = statuses.find(candidate => candidate.id === featureId);
  return status?.ready ? 'ready' : 'attention';
}

export function getHrSetupItemsByLabels(items: SettingsPageItem[], labels: readonly string[]) {
  return labels
    .map(label => items.find(item => item.label === label))
    .filter((item): item is SettingsPageItem => Boolean(item));
}

export function getDefaultHrSetupItem(items: SettingsPageItem[]) {
  return items.find(item => item.label === 'Designation') ?? items[0] ?? null;
}
