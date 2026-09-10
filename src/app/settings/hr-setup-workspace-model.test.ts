import { describe, expect, it } from 'vitest';

import {
  getDefaultHrSetupItem,
  getHrSetupItemsByLabels,
  getHrSetupReadiness,
  getUniqueHrSetupItems,
  hrSetupMapColumns,
  hrSetupMilestones,
} from './hr-setup-workspace-model';
import type { SettingsPageItem } from './settings-page-model';

const designation: SettingsPageItem = {
  href: '/positions',
  label: 'Designation',
  description: 'Configure job titles.',
  tab: 'HR Setup',
  section: 'Organization',
};

const grades: SettingsPageItem = {
  href: '/settings/grades',
  label: 'Grades',
  description: 'Configure grades.',
  tab: 'HR Setup',
  section: 'Position Configuration',
};

describe('HR Setup workspace model', () => {
  it('deduplicates repeated destinations without removing distinct configurations', () => {
    expect(getUniqueHrSetupItems([designation, grades, grades])).toEqual([designation, grades]);
  });

  it('selects Designation as the initial guided configuration', () => {
    expect(getDefaultHrSetupItem([grades, designation])).toBe(designation);
  });

  it('orders map items according to the requested architecture labels', () => {
    expect(getHrSetupItemsByLabels([grades, designation], ['Designation', 'Grades'])).toEqual([designation, grades]);
  });

  it('uses real setup feature status where a configuration has a readiness signal', () => {
    expect(getHrSetupReadiness(grades, [{ id: 'grades', count: 2, ready: true }])).toBe('ready');
    expect(getHrSetupReadiness(grades, [{ id: 'grades', count: 0, ready: false }])).toBe('attention');
    expect(getHrSetupReadiness(designation, [])).toBe('available');
  });

  it('places employee documents in the policies setup flow', () => {
    expect(hrSetupMilestones.find(item => item.label === 'Policies & time')?.itemLabels)
      .toContain('Employee Documents');
    expect(hrSetupMapColumns.find(item => item.label === 'Policies & operations')?.itemLabels)
      .toContain('Employee Documents');
  });

  it('includes all merged HR domains in the shared HR Setup sidebar', () => {
    expect(hrSetupMilestones.find(item => item.label === 'People lifecycle')?.itemLabels)
      .toContain('Employee Lifecycle Policies');
    expect(hrSetupMilestones.find(item => item.label === 'Workforce')?.itemLabels)
      .toContain('Workforce Rules');
    expect(hrSetupMilestones.find(item => item.label === 'Workforce')?.itemLabels)
      .toContain('Leave Policy Assignments');
    expect(hrSetupMilestones.find(item => item.label === 'Payroll & expenses')?.itemLabels)
      .toContain('Payroll & Expense Policies');
    expect(hrSetupMilestones.find(item => item.label === 'Performance & learning')?.itemLabels)
      .toContain('Performance & Learning Policies');
  });
});
