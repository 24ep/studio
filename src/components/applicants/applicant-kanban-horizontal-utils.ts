import type { Applicant } from '../../lib/types';
import { getApplicantHorizontalColumnValue, getUniqueKanbanValues } from './applicant-kanban-value-utils';

export function groupApplicantsByKanbanColumn(
  applicants: Applicant[],
  columnsToShow: string[],
  columnField: string
) {
  const grouped: Record<string, Applicant[]> = {};

  for (const column of columnsToShow) {
    grouped[column] = [];
  }

  for (const applicant of applicants) {
    const columnValue = getApplicantHorizontalColumnValue(applicant, columnField);
    if (columnValue && columnsToShow.includes(columnValue)) {
      grouped[columnValue] = grouped[columnValue] || [];
      grouped[columnValue].push(applicant);
    }
  }

  return grouped;
}

export function getHorizontalKanbanColumnSubtitle(columnField: string) {
  if (columnField === 'status') return 'Recruitment Stage';
  if (columnField === 'recruiterId') return 'Recruiter';
  if (columnField === 'positionId') return 'Position';
  if (columnField === 'fitScore') return 'Fit Score Range';

  return 'Custom Field';
}

export function getHorizontalKanbanColumnsToShow({
  applicants,
  columnField,
  visibleColumnValues,
}: {
  applicants: Applicant[];
  columnField: string;
  visibleColumnValues: string[];
}) {
  return visibleColumnValues.length > 0
    ? visibleColumnValues
    : getUniqueKanbanValues(applicants, applicant => getApplicantHorizontalColumnValue(applicant, columnField));
}

export function canMoveApplicantBetweenHorizontalColumns({
  draggedColumnValue,
  targetColumn,
  columnField,
}: {
  draggedColumnValue: string | undefined;
  targetColumn: string;
  columnField: string;
}) {
  return columnField === 'status' && Boolean(draggedColumnValue) && draggedColumnValue !== targetColumn;
}

export function getHorizontalKanbanScrollAmount({
  direction,
  scrollLeft,
  scrollWidth,
  clientWidth,
  maxStep = 400,
}: {
  direction: 'left' | 'right';
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  maxStep?: number;
}) {
  if (direction === 'left') {
    return Math.min(maxStep, Math.max(0, scrollLeft));
  }

  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  return Math.min(maxStep, Math.max(0, maxScroll - scrollLeft));
}

export function getHorizontalKanbanActiveIndicatorIndex(scrollPosition: number, columnWidth = 336) {
  if (columnWidth <= 0) return 0;

  return Math.max(0, Math.floor(scrollPosition / columnWidth));
}
