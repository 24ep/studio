import type { OrganizationUnitType } from './organization-hierarchy';

const UNIT_CODE_SEGMENTS: Record<OrganizationUnitType, string> = {
  division: 'DIV',
  department: 'DEP',
  section: 'SEC',
  unit: 'UNT',
};

export function getOrganizationCodePrefix(
  unitType: OrganizationUnitType,
  parentCode?: string | null,
) {
  if (unitType === 'division') return UNIT_CODE_SEGMENTS.division;

  const normalizedParentCode = normalizeCodePart(parentCode);
  if (!normalizedParentCode) {
    throw new Error(`Select a parent before generating the ${unitType} code.`);
  }
  return `${normalizedParentCode}-${UNIT_CODE_SEGMENTS[unitType]}`;
}

export function formatOrganizationRunningCode(prefix: string, sequence: number) {
  const safeSequence = Number.isFinite(sequence) && sequence > 0 ? Math.floor(sequence) : 1;
  return `${prefix}-${String(safeSequence).padStart(3, '0')}`;
}

function normalizeCodePart(value?: string | null) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
