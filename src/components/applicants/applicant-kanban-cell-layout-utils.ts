import type { Applicant } from '../../lib/types';
import { getApplicantKanbanFieldValue } from './applicant-kanban-value-utils';

export function buildApplicantKanbanCellLayout({
  applicants,
  rowValues,
  columnValues,
  rowField,
  columnField,
}: {
  applicants: Applicant[];
  rowValues: string[];
  columnValues: string[];
  rowField: string;
  columnField: string;
}) {
  const layout = createEmptyApplicantKanbanCellLayout(rowValues, columnValues);

  for (const applicant of applicants) {
    const rowKey = getApplicantKanbanCellKey(getApplicantKanbanFieldValue(applicant, rowField));
    const columnKey = getApplicantKanbanCellKey(getApplicantKanbanFieldValue(applicant, columnField));
    const matchesVisibleRow = rowValues.includes(rowKey);
    const matchesVisibleColumn = columnValues.includes(columnKey);

    if (matchesVisibleColumn && matchesVisibleRow) {
      layout.cells[columnKey][rowKey].push(applicant);
    } else if (matchesVisibleColumn) {
      layout.uncategorizedByColumn[columnKey].push(applicant);
    } else {
      layout.unmatchedColumnApplicants.push(applicant);
      if (matchesVisibleRow) {
        layout.unmatchedColumnCells[rowKey].push(applicant);
      }
    }
  }

  return layout;
}

function createEmptyApplicantKanbanCellLayout(rowValues: string[], columnValues: string[]) {
  const cells: Record<string, Record<string, Applicant[]>> = {};
  const uncategorizedByColumn: Record<string, Applicant[]> = {};
  const unmatchedColumnCells: Record<string, Applicant[]> = {};

  for (const column of columnValues) {
    cells[column] = {};
    uncategorizedByColumn[column] = [];
    for (const row of rowValues) {
      cells[column][row] = [];
    }
  }

  for (const row of rowValues) {
    unmatchedColumnCells[row] = [];
  }

  return {
    cells,
    uncategorizedByColumn,
    unmatchedColumnApplicants: [] as Applicant[],
    unmatchedColumnCells,
  };
}

function getApplicantKanbanCellKey(value: unknown) {
  return typeof value === 'string' ? value : String(value ?? '');
}
