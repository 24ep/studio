import type { Applicant } from '../../lib/types';
import { getApplicantKanbanFieldValue } from './applicant-kanban-value-utils';

export function filterApplicantsByKanbanFieldValue(applicants: Applicant[], field: string, value: string) {
  return applicants.filter(applicant => getApplicantKanbanFieldValue(applicant, field) === value);
}

export function filterUncategorizedKanbanApplicants(
  applicants: Applicant[],
  columnField: string,
  columnsToShow: string[],
) {
  return applicants.filter(applicant => !columnsToShow.includes(getApplicantKanbanFieldValue(applicant, columnField)));
}

export function getGroupedRowApplicants(applicants: Applicant[], rowField: string, rowValue: string) {
  if (rowValue === 'All applicants') {
    return applicants;
  }

  return applicants.filter(applicant => getApplicantKanbanFieldValue(applicant, rowField) === rowValue);
}

export function filterApplicantsForSingleRowKanban({
  applicants,
  rowField,
  columnField,
  visibleRowValues,
  visibleColumnValues,
}: {
  applicants?: Applicant[] | null;
  rowField: string;
  columnField: string;
  visibleRowValues: string[];
  visibleColumnValues: string[];
}) {
  if (!Array.isArray(applicants)) return [];

  return applicants.filter(applicant => {
    const rowValue = getApplicantKanbanFieldValue(applicant, rowField);
    const colValue = columnField && columnField !== 'none'
      ? getApplicantKanbanFieldValue(applicant, columnField)
      : null;

    const rowMatch = !rowField || rowField === 'none' || visibleRowValues.length === 0
      ? true
      : typeof rowValue === 'string' && rowValue !== '' && visibleRowValues.includes(rowValue);

    const colMatch = !columnField || columnField === 'none' || visibleColumnValues.length === 0
      ? true
      : !colValue || (typeof colValue === 'string' && colValue !== '' && visibleColumnValues.includes(colValue));

    return rowMatch && colMatch;
  });
}
