import type { ComponentType } from 'react';
import {
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleDot,
  ClipboardCheck,
  FileOutput,
  Layers3,
  Mail,
  MailCheck,
  Palette,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

import {
  platformSetupFeatures,
  type PlatformSetupFeatureId,
  type PlatformSetupFeatureStatus,
} from '@/lib/admin-platform-setup';

export const featureIcons: Record<
  PlatformSetupFeatureId,
  ComponentType<{ className?: string }>
> = {
  'company-reference': Building2,
  'company-email-domain': AtSign,
  'email-service': Mail,
  'platform-defaults': Palette,
  'recruitment-stages': Workflow,
  'applicant-sources': CircleDot,
  'position-levels': Layers3,
  grades: BadgeCheck,
  'headcount-types': Layers3,
  'evaluation-configuration': ClipboardCheck,
  'dropdown-options': Layers3,
  'leave-policies': CalendarDays,
  'holiday-calendar': CalendarDays,
  'document-templates': FileOutput,
  'policy-documents': ShieldCheck,
  'email-operations': MailCheck,
  'onboarding-templates': ClipboardCheck,
  'ai-prompts': Sparkles,
};

export const featureGroups: Array<{
  label: string;
  description: string;
  featureIds: PlatformSetupFeatureId[];
}> = [
  {
    label: 'Foundation',
    description: 'Identity and communication',
    featureIds: [
      'company-reference',
      'company-email-domain',
      'email-service',
      'platform-defaults',
    ],
  },
  {
    label: 'Hiring',
    description: 'Recruiting workflow defaults',
    featureIds: [
      'recruitment-stages',
      'applicant-sources',
      'position-levels',
      'grades',
      'headcount-types',
      'evaluation-configuration',
      'dropdown-options',
      'ai-prompts',
    ],
  },
  {
    label: 'People & operations',
    description: 'Employee-facing essentials',
    featureIds: [
      'leave-policies',
      'holiday-calendar',
      'document-templates',
      'policy-documents',
      'email-operations',
      'onboarding-templates',
    ],
  },
];

export function isFeatureStatus(
  value: unknown,
): value is PlatformSetupFeatureStatus {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PlatformSetupFeatureStatus>;
  return (
    platformSetupFeatures.some((feature) => feature.id === candidate.id)
    && typeof candidate.count === 'number'
    && typeof candidate.ready === 'boolean'
  );
}
