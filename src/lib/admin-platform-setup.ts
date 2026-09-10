export const platformSetupFeatureIds = [
  'company-reference',
  'company-email-domain',
  'email-service',
  'platform-defaults',
  'recruitment-stages',
  'applicant-sources',
  'position-levels',
  'grades',
  'headcount-types',
  'evaluation-configuration',
  'dropdown-options',
  'leave-policies',
  'holiday-calendar',
  'document-templates',
  'policy-documents',
  'email-operations',
  'onboarding-templates',
  'ai-prompts',
] as const;

export type PlatformSetupFeatureId = (typeof platformSetupFeatureIds)[number];

export interface PlatformSetupFeatureDefinition {
  id: PlatformSetupFeatureId;
  title: string;
  description: string;
  endpoint?: string;
  href?: string;
  requiredCount: number;
  optional?: boolean;
}

export interface PlatformSetupFeatureStatus {
  id: PlatformSetupFeatureId;
  count: number;
  ready: boolean;
}

export const platformSetupFeatures: PlatformSetupFeatureDefinition[] = [
  {
    id: 'company-reference',
    title: 'Company reference',
    description: 'Shared company identity and organization details.',
    endpoint: '/api/settings/company-references/import-appkit',
    href: '/settings/company-references',
    requiredCount: 1,
  },
  {
    id: 'company-email-domain',
    title: 'Company Email Domain',
    description: 'Domain used to create employee identities and sign-in email addresses.',
    href: '/settings/system-settings?tab=organize',
    requiredCount: 1,
  },
  {
    id: 'email-service',
    title: 'Email service',
    description: 'Provider credentials and sender identity for notifications and invitations.',
    href: '/settings/system-settings?tab=email-server',
    requiredCount: 1,
  },
  {
    id: 'platform-defaults',
    title: 'Branding and matching defaults',
    description: 'App logo, match criteria, and applicant evaluation prompt.',
    endpoint: '/api/settings/platform-default-settings/import-appkit',
    href: '/settings/platform-defaults',
    requiredCount: 3,
  },
  {
    id: 'recruitment-stages',
    title: 'Recruitment stages',
    description: 'A practical hiring pipeline for new applicants.',
    endpoint: '/api/settings/recruitment-stages/import-appkit',
    href: '/settings/stages',
    requiredCount: 1,
  },
  {
    id: 'applicant-sources',
    title: 'Applicant sources',
    description: 'Standard sourcing channels for reporting and intake.',
    endpoint: '/api/settings/applicant-sources/import-appkit',
    href: '/settings/applicant-sources',
    requiredCount: 1,
  },
  {
    id: 'position-levels',
    title: 'Position levels',
    description: 'Reusable seniority levels for positions and progression.',
    endpoint: '/api/settings/position-levels/import-appkit',
    href: '/settings/position-levels',
    requiredCount: 1,
  },
  {
    id: 'grades',
    title: 'Grades',
    description: 'Default job grades, level ranges, and hiring SLAs.',
    endpoint: '/api/settings/grades/import-appkit',
    href: '/settings/grades',
    requiredCount: 1,
  },
  {
    id: 'headcount-types',
    title: 'Headcount types',
    description: 'Admin-managed options used by position headcount dropdowns.',
    endpoint: '/api/settings/headcount-types',
    href: '/settings/headcount-types',
    requiredCount: 1,
  },
  {
    id: 'evaluation-configuration',
    title: 'Evaluation dropdowns',
    description: 'Expertise groups, skills, personality traits, and reusable evaluation templates.',
    endpoint: '/api/settings/evaluation-configuration/import-appkit',
    href: '/settings/evaluation-configuration',
    requiredCount: 1,
  },
  {
    id: 'dropdown-options',
    title: 'Shared dropdown options',
    description: 'Business vocabulary used across employee, performance, payroll, expense, and organization forms.',
    endpoint: '/api/settings/dropdown-options',
    href: '/settings/dropdown-options',
    requiredCount: 1,
  },
  {
    id: 'leave-policies',
    title: 'Leave policies',
    description: 'Default allowances and approval rules for employee leave requests.',
    endpoint: '/api/hr/leave/import-appkit-policies',
    href: '/settings/leave-policies',
    requiredCount: 1,
  },
  {
    id: 'holiday-calendar',
    title: 'Holiday calendar',
    description: 'Paid holidays used by leave and attendance calculations.',
    endpoint: '/api/hr/attendance/import-appkit-holidays',
    href: '/workforce/holidays',
    requiredCount: 1,
    optional: true,
  },
  {
    id: 'document-templates',
    title: 'Document templates',
    description: 'Reusable letters and employee-facing HR documents.',
    endpoint: '/api/settings/document-templates',
    href: '/settings/document-templates',
    requiredCount: 1,
    optional: true,
  },
  {
    id: 'policy-documents',
    title: 'Policy documents',
    description: 'Shared policies published in the employee policy workspace.',
    endpoint: '/api/policy-documents',
    href: '/settings',
    requiredCount: 1,
    optional: true,
  },
  {
    id: 'email-operations',
    title: 'Email operations',
    description: 'Fail-closed configuration for invitations and HR notifications.',
    endpoint: '/api/settings/email-operation-configs/import-appkit',
    href: '/settings/system-settings?tab=email-server',
    requiredCount: 1,
    optional: true,
  },
  {
    id: 'onboarding-templates',
    title: 'Onboarding templates',
    description: 'A reusable baseline workflow for newly hired employees.',
    endpoint: '/api/hr/onboarding/import-appkit-templates',
    href: '/settings',
    requiredCount: 1,
    optional: true,
  },
  {
    id: 'ai-prompts',
    title: 'AI prompt library',
    description: 'Ready-to-use recruiting and communication prompts.',
    endpoint: '/api/settings/system-prompts/import-appkit',
    href: '/settings/system-prompts',
    requiredCount: 1,
  },
];

export type PlatformSetupCounts = Record<PlatformSetupFeatureId, number>;

export function buildPlatformSetupStatuses(
  counts: Partial<PlatformSetupCounts>,
): PlatformSetupFeatureStatus[] {
  return platformSetupFeatures.map((feature) => {
    const count = Math.max(0, Number(counts[feature.id]) || 0);
    return {
      id: feature.id,
      count,
      ready: count >= feature.requiredCount,
    };
  });
}

export function getPlatformSetupProgress(statuses: PlatformSetupFeatureStatus[]) {
  const requiredIds = new Set(platformSetupFeatures.filter(feature => !feature.optional).map(feature => feature.id));
  const completed = statuses.filter((status) => requiredIds.has(status.id) && status.ready).length;
  const total = requiredIds.size;
  return {
    completed,
    total,
    percentage: total === 0 ? 100 : Math.round((completed / total) * 100),
  };
}

export function areRequiredPlatformFeaturesReady(statuses: PlatformSetupFeatureStatus[]) {
  return platformSetupFeatures
    .filter(feature => !feature.optional)
    .every(feature => statuses.some(status => status.id === feature.id && status.ready));
}

export function getRecommendedPlatformInitializationIds(statuses: PlatformSetupFeatureStatus[]) {
  const pendingIds = new Set(
    statuses.filter((status) => !status.ready).map((status) => status.id),
  );

  return platformSetupFeatures
    .filter((feature) => Boolean(feature.endpoint) && pendingIds.has(feature.id))
    .map((feature) => feature.id);
}
