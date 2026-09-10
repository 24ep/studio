import type { Applicant } from '../../lib/types';
import { getApplicantKanbanFieldValue, getUniqueKanbanValues } from './applicant-kanban-value-utils';

export type ApplicantFlexibleKanbanRenderMode =
  | 'classic-columns'
  | 'card-stack'
  | 'single-column-row'
  | 'matrix'
  | 'grouped-rows';

export function buildApplicantKanbanLayoutConfig({
  applicants,
  rowField,
  columnField,
  visibleRowValues,
  visibleColumnValues,
}: {
  applicants: Applicant[];
  rowField: string;
  columnField: string;
  visibleRowValues: string[];
  visibleColumnValues: string[];
}) {
  let rowValuesToShow = visibleRowValues.length > 0
    ? visibleRowValues
    : getUniqueKanbanValues(applicants, applicant => getApplicantKanbanFieldValue(applicant, rowField));

  if (rowValuesToShow.length === 0) {
    rowValuesToShow = ['All applicants'];
  }

  const isColumnBased = Boolean(columnField && columnField !== 'none');
  const isRowBased = Boolean(rowField && rowField !== 'none');
  const showSingleRow = !isRowBased || rowField === 'none';
  const effectiveColumnValues = isColumnBased && visibleColumnValues.length > 0
    ? visibleColumnValues
    : getUniqueKanbanValues(applicants, applicant => getApplicantKanbanFieldValue(applicant, columnField));

  return {
    rowValuesToShow,
    isColumnBased,
    isRowBased,
    showSingleRow,
    effectiveColumnValues,
    effectiveColumnField: isColumnBased ? columnField : null,
  };
}

export function getApplicantFlexibleKanbanRenderMode({
  rowField,
  columnField,
  isColumnBased,
  showSingleRow,
  effectiveColumnValues,
}: {
  rowField?: string;
  columnField?: string;
  isColumnBased: boolean;
  showSingleRow: boolean;
  effectiveColumnValues: string[];
}): ApplicantFlexibleKanbanRenderMode {
  if ((rowField === 'none' || !rowField) && columnField && columnField !== 'none') {
    return 'classic-columns';
  }

  if (showSingleRow) {
    return 'card-stack';
  }

  if (isColumnBased && effectiveColumnValues.length === 1) {
    return 'single-column-row';
  }

  if (isColumnBased) {
    return 'matrix';
  }

  return 'grouped-rows';
}

export function getClassicKanbanColumnsToShow(visibleColumnValues: string[], effectiveColumnValues: string[]) {
  return visibleColumnValues.length > 0
    ? visibleColumnValues
    : effectiveColumnValues.length > 0
      ? effectiveColumnValues
      : ['All'];
}

export function getPreviousCarouselIndex(currentIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
}

export function getNextCarouselIndex(currentIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
}
