import type { PlatformSetupFeatureId } from '@/lib/admin-platform-setup';

export interface AppKitSetupPreviewItem {
  label: string;
  detail?: string;
}

export interface AppKitSetupPreviewGroup {
  featureId: PlatformSetupFeatureId;
  count: number;
  items: AppKitSetupPreviewItem[];
}

export const appKitCollectionByFeature: Partial<Record<PlatformSetupFeatureId, string>> = {
  'company-reference': 'company_reference',
  'platform-defaults': 'platform_default_settings',
  'recruitment-stages': 'recruitment_stages',
  'applicant-sources': 'applicant_sources',
  'position-levels': 'position_levels',
  grades: 'position_grades',
  'headcount-types': 'headcount_types',
  'evaluation-configuration': 'evaluation_configuration',
  'dropdown-options': 'dropdown_option_catalog',
  'leave-policies': 'leave_policies',
  'holiday-calendar': 'holiday_list',
  'document-templates': 'document_templates',
  'policy-documents': 'policy_documents',
  'email-operations': 'email_operation_configs',
  'onboarding-templates': 'onboarding_templates',
  'ai-prompts': 'ai_prompt_settings',
};

const labelKeys = ['name', 'title', 'label', 'key', 'operationKey', 'code', 'type'] as const;
const detailKeys = ['description', 'category', 'country', 'channel', 'status'] as const;

function firstDisplayValue(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function getImportableAppKitFeatureIds(groups: AppKitSetupPreviewGroup[]) {
  return groups
    .filter(group => group.count > 0)
    .map(group => group.featureId);
}

export function summarizeAppKitRecords(
  featureId: PlatformSetupFeatureId,
  records: Array<Record<string, unknown>>,
): AppKitSetupPreviewGroup {
  return {
    featureId,
    count: records.length,
    items: records.slice(0, 5).map((record, index) => ({
      label: firstDisplayValue(record, labelKeys) || `Record ${index + 1}`,
      detail: firstDisplayValue(record, detailKeys) || undefined,
    })),
  };
}
