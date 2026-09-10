import type { CustomFieldDefinition } from './types';

export type CustomFieldModelName = 'Applicant' | 'Position' | 'User' | 'Headcount';

const APPLICANT_DETAIL_SECTIONS = new Set([
  'jobs',
  'applicant-info',
  'education',
  'experience',
  'job-suitability',
]);

const POSITION_DETAIL_SECTIONS = new Set([
  'details',
  'criteria',
  'applicants',
  'headcount',
]);

function normalizeCustomFieldSection(section: string) {
  return section.toLowerCase();
}

function matchesCustomFieldSection(
  configuredSection: string | null | undefined,
  requestedSection: string,
) {
  return (
    Boolean(configuredSection) &&
    normalizeCustomFieldSection(configuredSection || '') ===
      normalizeCustomFieldSection(requestedSection)
  );
}

function shouldShowApplicantCustomField(
  field: CustomFieldDefinition,
  section: string,
) {
  const normalizedSection = normalizeCustomFieldSection(section);

  if (APPLICANT_DETAIL_SECTIONS.has(normalizedSection)) {
    return matchesCustomFieldSection(field.applicantDetailSection, section);
  }

  return Boolean(field.showInApplicantDetail && !field.showInFullApplicantDetail);
}

function shouldShowPositionCustomField(
  field: CustomFieldDefinition,
  section: string,
) {
  const normalizedSection = normalizeCustomFieldSection(section);

  if (!POSITION_DETAIL_SECTIONS.has(normalizedSection)) {
    return false;
  }

  return (
    !field.positionDetailSection ||
    matchesCustomFieldSection(field.positionDetailSection, section)
  );
}

export function shouldShowCustomFieldInSection({
  field,
  modelName,
  section,
}: {
  field: CustomFieldDefinition;
  modelName: CustomFieldModelName;
  section: string;
}) {
  if (field.model_name !== modelName) {
    return false;
  }

  switch (modelName) {
    case 'Applicant':
      return shouldShowApplicantCustomField(field, section);
    case 'Position':
      return shouldShowPositionCustomField(field, section);
    case 'Headcount':
      return Boolean(field.showInHeadcountDetail);
    case 'User':
      return true;
    default:
      return false;
  }
}

export function filterCustomFieldsBySection(
  customFields: CustomFieldDefinition[],
  section: string,
  modelName: CustomFieldModelName,
): CustomFieldDefinition[] {
  return customFields.filter((field) =>
    shouldShowCustomFieldInSection({ field, modelName, section }),
  );
}
