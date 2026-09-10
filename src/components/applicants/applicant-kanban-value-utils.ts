import type { Applicant } from '../../lib/types';
import {
  getApplicantDirectFieldValue,
  getApplicantFitScoreLabel,
  getApplicantPositionLabel,
  getApplicantRecruiterLabel,
  getKanbanValueLabel,
  getParsedDataProperty,
} from './applicant-kanban-label-utils';
export {
  buildApplicantKanbanSummary,
  normalizeApplicantParsedDataForSummary,
} from './applicant-kanban-summary-utils';

type ApplicantValueResolver = (applicant: Applicant) => string;

const KANBAN_FIELD_VALUE_RESOLVERS: Record<string, ApplicantValueResolver> = {
  recruiterId: getApplicantRecruiterLabel,
  positionId: getApplicantPositionLabel,
};

const HORIZONTAL_COLUMN_VALUE_RESOLVERS: Record<string, ApplicantValueResolver> = {
  none: () => 'All applicants',
  status: (applicant) => applicant.statusId || applicant.status || 'Unknown',
  recruiterId: getApplicantRecruiterLabel,
  positionId: getApplicantPositionLabel,
  fitScore: getApplicantFitScoreLabel,
};

export function getApplicantKanbanFieldValue(applicant: Applicant, field: string) {
  const resolver = KANBAN_FIELD_VALUE_RESOLVERS[field];
  if (resolver) return resolver(applicant);

  return getKanbanValueLabel(getApplicantDirectFieldValue(applicant, field) ?? applicant.customAttributes?.[field]) ?? 'Unknown';
}

export function getApplicantHorizontalColumnValue(applicant: Applicant, columnField: string) {
  const resolver = HORIZONTAL_COLUMN_VALUE_RESOLVERS[columnField];
  if (resolver) return resolver(applicant);

  const customAttributeValue = getKanbanValueLabel(applicant.customAttributes?.[columnField]);
  if (customAttributeValue) {
    return customAttributeValue;
  }

  return getKanbanValueLabel(getParsedDataProperty(applicant, columnField)) || 'Unknown';
}

export function getUniqueKanbanValues<T>(
  items: T[],
  getValue: (item: T) => unknown,
  fallbackValues: string[] = []
) {
  if (fallbackValues.length > 0) return fallbackValues;

  return Array.from(new Set(items.map(getValue)))
    .filter(Boolean) as string[];
}
