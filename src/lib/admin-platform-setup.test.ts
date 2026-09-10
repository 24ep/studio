import { describe, expect, it } from 'vitest';

import {
  buildPlatformSetupStatuses,
  getPlatformSetupProgress,
  getRecommendedPlatformInitializationIds,
  platformSetupFeatures,
  areRequiredPlatformFeaturesReady,
} from './admin-platform-setup';

describe('admin platform setup', () => {
  it('provides a settings destination for every onboarding item', () => {
    expect(platformSetupFeatures.every(feature => (
      feature.href?.startsWith('/settings') || feature.href === '/workforce/holidays'
    ))).toBe(true);
  });

  it('marks only features with their required defaults as ready', () => {
    const statuses = buildPlatformSetupStatuses({
      'company-reference': 1,
      'company-email-domain': 1,
      'email-service': 1,
      'platform-defaults': 2,
      grades: 3,
      'leave-policies': 3,
    });

    expect(statuses.find((status) => status.id === 'company-reference')?.ready).toBe(true);
    expect(statuses.find((status) => status.id === 'company-email-domain')?.ready).toBe(true);
    expect(statuses.find((status) => status.id === 'email-service')?.ready).toBe(true);
    expect(statuses.find((status) => status.id === 'platform-defaults')?.ready).toBe(false);
    expect(statuses.find((status) => status.id === 'grades')?.ready).toBe(true);
    expect(statuses.find((status) => status.id === 'leave-policies')?.ready).toBe(true);
    expect(statuses.find((status) => status.id === 'headcount-types')?.ready).toBe(false);
    expect(statuses.find((status) => status.id === 'ai-prompts')?.count).toBe(0);
  });

  it('initializes admin-managed dropdown catalogs from AppKit', () => {
    expect(platformSetupFeatures.find(feature => feature.id === 'headcount-types')?.endpoint)
      .toBe('/api/settings/headcount-types');
    expect(platformSetupFeatures.find(feature => feature.id === 'evaluation-configuration')?.endpoint)
      .toBe('/api/settings/evaluation-configuration/import-appkit');
    expect(platformSetupFeatures.find(feature => feature.id === 'dropdown-options')?.endpoint)
      .toBe('/api/settings/dropdown-options');
  });

  it('calculates checklist progress from ready features', () => {
    const statuses = buildPlatformSetupStatuses({
      'company-reference': 1,
      'platform-defaults': 3,
    });

    const requiredFeatureCount = platformSetupFeatures.filter(feature => !feature.optional).length;
    expect(getPlatformSetupProgress(statuses)).toEqual({
      completed: 2,
      total: requiredFeatureCount,
      percentage: Math.round((2 / requiredFeatureCount) * 100),
    });
  });

  it('initializes leave policies from the AppKit production catalog', () => {
    expect(platformSetupFeatures.find((feature) => feature.id === 'leave-policies')).toMatchObject({
      endpoint: '/api/hr/leave/import-appkit-policies',
      requiredCount: 1,
    });
  });

  it('does not block completion on optional catalogs', () => {
    const counts = Object.fromEntries(
      platformSetupFeatures.filter(feature => !feature.optional).map(feature => [feature.id, feature.requiredCount]),
    );
    expect(areRequiredPlatformFeaturesReady(buildPlatformSetupStatuses(counts))).toBe(true);
    expect(platformSetupFeatures.find(feature => feature.id === 'holiday-calendar')?.optional).toBe(true);
    expect(platformSetupFeatures.find(feature => feature.id === 'email-operations')?.optional).toBe(true);
  });

  it('bulk initializes every pending default with an automatic endpoint', () => {
    const statuses = buildPlatformSetupStatuses({
      'platform-defaults': 3,
      'holiday-calendar': 0,
    });
    const recommendedIds = getRecommendedPlatformInitializationIds(statuses);

    expect(recommendedIds).not.toContain('platform-defaults');
    expect(recommendedIds).not.toContain('company-email-domain');
    expect(recommendedIds).not.toContain('email-service');
    expect(recommendedIds).toContain('company-reference');
    expect(recommendedIds).toContain('leave-policies');
    expect(recommendedIds).toContain('holiday-calendar');
    expect(recommendedIds).toContain('document-templates');
    expect(recommendedIds).toContain('policy-documents');
    expect(recommendedIds).toContain('email-operations');
    expect(recommendedIds).toContain('onboarding-templates');
    expect(recommendedIds).toEqual(
      platformSetupFeatures
        .filter(feature => Boolean(feature.endpoint) && feature.id !== 'platform-defaults')
        .map(feature => feature.id),
    );
  });
});
