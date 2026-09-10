import { describe, expect, it } from 'vitest';
import type { Applicant, Position } from '../../lib/types';

import {
  buildApplicantKanbanCellLayout,
  buildApplicantKanbanLayoutConfig,
  buildApplicantKanbanSummary,
  canMoveApplicantBetweenHorizontalColumns,
  filterApplicantsForSingleRowKanban,
  filterApplicantsByKanbanFieldValue,
  filterUncategorizedKanbanApplicants,
  getApplicantFlexibleKanbanRenderMode,
  getApplicantHorizontalColumnValue,
  getApplicantKanbanFieldValue,
  getClassicKanbanColumnsToShow,
  getGroupedRowApplicants,
  getHorizontalKanbanActiveIndicatorIndex,
  getHorizontalKanbanColumnSubtitle,
  getHorizontalKanbanColumnsToShow,
  getHorizontalKanbanScrollAmount,
  getNextCarouselIndex,
  getPreviousCarouselIndex,
  getUniqueKanbanValues,
  groupApplicantsByKanbanColumn,
  normalizeApplicantParsedDataForSummary,
} from './applicant-kanban-layout-utils';

function makeRecruiter(overrides: Partial<NonNullable<Applicant['recruiter']>> = {}): NonNullable<Applicant['recruiter']> {
  return {
    id: overrides.id ?? 'recruiter-1',
    name: overrides.name ?? 'Jane Recruiter',
    email: overrides.email ?? 'recruiter@example.com',
  };
}

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: overrides.id ?? 'position-1',
    title: overrides.title ?? 'Designer',
    department: overrides.department ?? 'Product',
    isOpen: overrides.isOpen ?? true,
  };
}

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-id',
    name: overrides.name ?? 'Applicant',
    email: overrides.email ?? 'applicant@example.com',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? 'applied',
    status: overrides.status ?? 'Applied',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

describe('applicant kanban layout utilities', () => {
  it('resolves recruiter and position display values', () => {
    const applicant = makeApplicant({
      recruiter: makeRecruiter({ id: 'recruiter-1', name: 'Jane Recruiter' }),
      positionId: 'position-1',
      position: makePosition({ id: 'position-1', title: 'Designer' }),
    });

    expect(getApplicantKanbanFieldValue(applicant, 'recruiterId')).toBe('Jane Recruiter');
    expect(getApplicantKanbanFieldValue(applicant, 'positionId')).toBe('Designer');
    expect(getApplicantKanbanFieldValue(makeApplicant({}), 'recruiterId')).toBe('Unassigned');
  });

  it('resolves horizontal fit score columns', () => {
    expect(getApplicantHorizontalColumnValue(makeApplicant({ fitScore: 0.82 }), 'fitScore')).toBe('A (81-100)');
    expect(getApplicantHorizontalColumnValue(makeApplicant({ fitScore: undefined }), 'fitScore')).toBe('No Score');
  });

  it('resolves kanban values from custom attributes and parsed data', () => {
    const applicant = makeApplicant({
      customAttributes: {
        workMode: 'Hybrid',
      },
      parsedData: {
        applicant_info: {
          city: 'Bangkok',
        },
        city: 'Root city',
      } as unknown as Applicant['parsedData'],
    });

    expect(getApplicantKanbanFieldValue(applicant, 'workMode')).toBe('Hybrid');
    expect(getApplicantHorizontalColumnValue(applicant, 'city')).toBe('Bangkok');
    expect(getApplicantHorizontalColumnValue(applicant, 'unknownField')).toBe('Unknown');
  });

  it('normalizes parsed applicant data for summary modals', () => {
    expect(normalizeApplicantParsedDataForSummary(null)).toEqual({});

    expect(normalizeApplicantParsedDataForSummary({
      job_matches: [{ title: 'Engineer' }],
      education: 'not-array',
      experience: [{ company: 'Acme' }],
      skills: undefined,
      job_suitable: [{ role: 'Frontend' }],
      applicant_info: { name: 'Jane' },
    } as unknown as Applicant['parsedData'])).toEqual({
      job_matches: [{ title: 'Engineer' }],
      education: [],
      experience: [{ company: 'Acme' }],
      skills: [],
      job_suitable: [{ role: 'Frontend' }],
      applicant_info: { name: 'Jane' },
    });
  });

  it('builds applicant summary data for kanban detail modals', () => {
    const applicant = makeApplicant({
      id: 'applicant-1',
      email: 'jane@example.com',
      phone: '123',
      statusId: 'screening',
      position: makePosition({ id: 'position-1', title: 'Designer' }),
      fitScore: 0.75,
      parsedData: {
        education: 'invalid',
        experience: [{ company: 'Acme' }],
      } as unknown as Applicant['parsedData'],
    });

    expect(buildApplicantKanbanSummary(applicant, () => 'Jane Doe')).toEqual({
      id: 'applicant-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '123',
      status: 'screening',
      position: makePosition({ id: 'position-1', title: 'Designer' }),
      fitScore: 0.75,
      parsedData: {
        education: [],
        experience: [{ company: 'Acme' }],
        job_matches: [],
        skills: [],
        job_suitable: [],
      },
    });
  });

  it('wraps carousel navigation indexes', () => {
    expect(getPreviousCarouselIndex(0, 3)).toBe(2);
    expect(getPreviousCarouselIndex(2, 3)).toBe(1);
    expect(getPreviousCarouselIndex(0, 0)).toBe(0);
    expect(getNextCarouselIndex(2, 3)).toBe(0);
    expect(getNextCarouselIndex(0, 3)).toBe(1);
    expect(getNextCarouselIndex(0, 0)).toBe(0);
  });

  it('returns fallback values or unique field values', () => {
    const applicants = [
      makeApplicant({ id: 'a', status: 'Applied' }),
      makeApplicant({ id: 'b', status: 'Applied' }),
      makeApplicant({ id: 'c', status: 'Interview' }),
    ];

    expect(getUniqueKanbanValues(applicants, applicant => applicant.status)).toEqual(['Applied', 'Interview']);
    expect(getUniqueKanbanValues(applicants, applicant => applicant.status, ['Visible'])).toEqual(['Visible']);
  });

  it('builds layout config from row and column fields', () => {
    const applicants = [
      makeApplicant({ id: 'a', status: 'Applied', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'b', status: 'Interview', recruiter: makeRecruiter({ name: 'Sam' }) }),
    ];

    expect(buildApplicantKanbanLayoutConfig({
      applicants,
      rowField: 'status',
      columnField: 'recruiterId',
      visibleRowValues: [],
      visibleColumnValues: [],
    })).toEqual({
      rowValuesToShow: ['Applied', 'Interview'],
      isColumnBased: true,
      isRowBased: true,
      showSingleRow: false,
      effectiveColumnValues: ['Jane', 'Sam'],
      effectiveColumnField: 'recruiterId',
    });

    expect(buildApplicantKanbanLayoutConfig({
      applicants: [],
      rowField: 'none',
      columnField: 'none',
      visibleRowValues: [],
      visibleColumnValues: [],
    }).rowValuesToShow).toEqual(['All applicants']);
  });

  it('selects the flexible kanban render mode in priority order', () => {
    expect(getApplicantFlexibleKanbanRenderMode({
      rowField: 'none',
      columnField: 'recruiterId',
      isColumnBased: true,
      showSingleRow: true,
      effectiveColumnValues: ['Jane'],
    })).toBe('classic-columns');

    expect(getApplicantFlexibleKanbanRenderMode({
      rowField: 'none',
      columnField: 'none',
      isColumnBased: false,
      showSingleRow: true,
      effectiveColumnValues: [],
    })).toBe('card-stack');

    expect(getApplicantFlexibleKanbanRenderMode({
      rowField: 'status',
      columnField: 'recruiterId',
      isColumnBased: true,
      showSingleRow: false,
      effectiveColumnValues: ['Jane'],
    })).toBe('single-column-row');

    expect(getApplicantFlexibleKanbanRenderMode({
      rowField: 'status',
      columnField: 'recruiterId',
      isColumnBased: true,
      showSingleRow: false,
      effectiveColumnValues: ['Jane', 'Sam'],
    })).toBe('matrix');

    expect(getApplicantFlexibleKanbanRenderMode({
      rowField: 'status',
      columnField: 'none',
      isColumnBased: false,
      showSingleRow: false,
      effectiveColumnValues: [],
    })).toBe('grouped-rows');
  });

  it('derives classic column and grouped row applicants consistently', () => {
    const applicants = [
      makeApplicant({ id: 'a', status: 'Applied', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'b', status: 'Interview', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'c', status: 'Applied', recruiter: makeRecruiter({ name: 'Sam' }) }),
      makeApplicant({ id: 'd', status: 'Applied' }),
    ];

    expect(getClassicKanbanColumnsToShow([], ['Jane'])).toEqual(['Jane']);
    expect(getClassicKanbanColumnsToShow([], [])).toEqual(['All']);
    expect(filterApplicantsByKanbanFieldValue(applicants, 'recruiterId', 'Jane').map(applicant => applicant.id)).toEqual(['a', 'b']);
    expect(filterUncategorizedKanbanApplicants(applicants, 'recruiterId', ['Jane']).map(applicant => applicant.id)).toEqual(['c', 'd']);
    expect(getGroupedRowApplicants(applicants, 'status', 'Applied').map(applicant => applicant.id)).toEqual(['a', 'c', 'd']);
    expect(getGroupedRowApplicants(applicants, 'status', 'All applicants').map(applicant => applicant.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('filters applicants for single row board visibility', () => {
    const applicants = [
      makeApplicant({ id: 'a', status: 'Applied', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'b', status: 'Rejected', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'c', status: 'Applied', recruiter: makeRecruiter({ name: 'Sam' }) }),
    ];

    expect(filterApplicantsForSingleRowKanban({
      applicants,
      rowField: 'status',
      columnField: 'recruiterId',
      visibleRowValues: ['Applied'],
      visibleColumnValues: ['Jane'],
    }).map(applicant => applicant.id)).toEqual(['a']);
  });

  it('groups applicants by visible kanban columns', () => {
    const applicants = [
      makeApplicant({ id: 'a', statusId: 'applied' }),
      makeApplicant({ id: 'b', statusId: 'interview' }),
      makeApplicant({ id: 'c', statusId: 'hidden' }),
    ];

    const grouped = groupApplicantsByKanbanColumn(applicants, ['applied', 'interview'], 'status');

    expect(grouped.applied.map(applicant => applicant.id)).toEqual(['a']);
    expect(grouped.interview.map(applicant => applicant.id)).toEqual(['b']);
  });

  it('derives horizontal kanban display metadata and columns', () => {
    const applicants = [
      makeApplicant({ id: 'a', statusId: 'applied' }),
      makeApplicant({ id: 'b', statusId: 'interview' }),
      makeApplicant({ id: 'c', statusId: 'applied' }),
    ];

    expect(getHorizontalKanbanColumnSubtitle('status')).toBe('Recruitment Stage');
    expect(getHorizontalKanbanColumnSubtitle('recruiterId')).toBe('Recruiter');
    expect(getHorizontalKanbanColumnSubtitle('positionId')).toBe('Position');
    expect(getHorizontalKanbanColumnSubtitle('fitScore')).toBe('Fit Score Range');
    expect(getHorizontalKanbanColumnSubtitle('customField')).toBe('Custom Field');
    expect(getHorizontalKanbanColumnsToShow({
      applicants,
      columnField: 'status',
      visibleColumnValues: [],
    })).toEqual(['applied', 'interview']);
    expect(getHorizontalKanbanColumnsToShow({
      applicants,
      columnField: 'status',
      visibleColumnValues: ['visible'],
    })).toEqual(['visible']);
  });

  it('computes horizontal kanban drag and scroll behavior', () => {
    expect(canMoveApplicantBetweenHorizontalColumns({
      draggedColumnValue: 'applied',
      targetColumn: 'interview',
      columnField: 'status',
    })).toBe(true);
    expect(canMoveApplicantBetweenHorizontalColumns({
      draggedColumnValue: 'applied',
      targetColumn: 'applied',
      columnField: 'status',
    })).toBe(false);
    expect(canMoveApplicantBetweenHorizontalColumns({
      draggedColumnValue: 'Jane',
      targetColumn: 'Sam',
      columnField: 'recruiterId',
    })).toBe(false);

    expect(getHorizontalKanbanScrollAmount({
      direction: 'left',
      scrollLeft: 250,
      scrollWidth: 1200,
      clientWidth: 600,
    })).toBe(250);
    expect(getHorizontalKanbanScrollAmount({
      direction: 'right',
      scrollLeft: 250,
      scrollWidth: 1200,
      clientWidth: 600,
    })).toBe(350);
    expect(getHorizontalKanbanScrollAmount({
      direction: 'right',
      scrollLeft: 0,
      scrollWidth: 2000,
      clientWidth: 600,
    })).toBe(400);
    expect(getHorizontalKanbanActiveIndicatorIndex(0)).toBe(0);
    expect(getHorizontalKanbanActiveIndicatorIndex(335)).toBe(0);
    expect(getHorizontalKanbanActiveIndicatorIndex(336)).toBe(1);
  });

  it('builds row and column kanban cell layout in one pass', () => {
    const applicants = [
      makeApplicant({ id: 'a', status: 'Applied', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'b', status: 'Screening', recruiter: makeRecruiter({ name: 'Jane' }) }),
      makeApplicant({ id: 'c', status: 'Applied', recruiter: makeRecruiter({ name: 'Sam' }) }),
      makeApplicant({ id: 'd', status: 'Applied' }),
    ];

    const layout = buildApplicantKanbanCellLayout({
      applicants,
      rowValues: ['Applied'],
      columnValues: ['Jane'],
      rowField: 'status',
      columnField: 'recruiterId',
    });

    expect(layout.cells.Jane.Applied.map(applicant => applicant.id)).toEqual(['a']);
    expect(layout.uncategorizedByColumn.Jane.map(applicant => applicant.id)).toEqual(['b']);
    expect(layout.unmatchedColumnApplicants.map(applicant => applicant.id)).toEqual(['c', 'd']);
    expect(layout.unmatchedColumnCells.Applied.map(applicant => applicant.id)).toEqual(['c', 'd']);
  });
});
