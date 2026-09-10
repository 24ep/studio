import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APPLICANTS_PAGE_SIZE,
  MAX_APPLICANTS_PAGE_SIZE,
  buildApplicantCreateInput,
  buildApplicantRouteCustomFieldConditions,
  buildApplicantRouteAppliedFitScoreConditions,
  buildApplicantRouteListHeaders,
  buildApplicantRouteMatchingFitScoreConditions,
  buildApplicantRouteNullableMultiIdCondition,
  buildApplicantRoutePagination,
  buildApplicantRouteTextCondition,
  buildApplicantRouteSortClause,
  getApplicantRouteCustomFieldFilters,
  normalizeApplicantRouteRows,
  parseApplicantRouteAdvancedFilters,
  parseApplicantRouteQueryOptions,
} from './applicants-route-utils';

describe('applicants-route-utils', () => {
  it('builds applicant create input from validated request data', () => {
    const applicantInfo = {
      personal_info: {
        firstname: 'Ada',
        lastname: 'Lovelace',
        avatar_url: 'https://example.com/ada.jpg',
      },
      contact_info: {
        email: 'ada@example.com',
        phone: '123',
      },
      status: 'screening',
    };
    const jobApplied = { jobId: 'position-applied', fitScore: 88 };
    const validJobMatch = { jobId: 'position-match', fitScore: 70 };
    const invalidJobMatch = { fitScore: 50 };

    expect(buildApplicantCreateInput({
      applicant_info: applicantInfo,
      job_applied: jobApplied,
      job_matches: [invalidJobMatch, validJobMatch],
      applicationDate: '2026-01-01T00:00:00.000Z',
    }, {
      sourceId: 'source-1',
      subSource: 'campaign',
      customAttributes: { portfolioUrl: 'https://example.com' },
      assignmentJustification: 'Strong match',
    })).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '123',
      positionId: 'position-applied',
      fitScore: 88,
      status: 'screening',
      parsedData: {
        applicant_info: applicantInfo,
        job_matches: [validJobMatch],
        job_applied: jobApplied,
      },
      applicationDate: '2026-01-01T00:00:00.000Z',
      sourceId: 'source-1',
      subSource: 'campaign',
      customAttributes: { portfolioUrl: 'https://example.com' },
      assignmentJustification: 'Strong match',
      avatarUrl: 'https://example.com/ada.jpg',
    });
  });

  it('falls back to the first valid job match and default create values', () => {
    const input = buildApplicantCreateInput({
      applicant_info: {
        personal_info: {
          firstname: 'Grace',
          lastname: 'Hopper',
        },
        contact_info: {
          email: 'grace@example.com',
        },
      },
      job_matches: [{ jobId: 'position-match', fitScore: 64 }],
    });

    expect(input).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      phone: undefined,
      positionId: 'position-match',
      fitScore: 0,
      status: 'new',
      sourceId: null,
      subSource: null,
    });
    expect(input?.parsedData).toEqual({
      applicant_info: {
        personal_info: {
          firstname: 'Grace',
          lastname: 'Hopper',
        },
        contact_info: {
          email: 'grace@example.com',
        },
      },
      job_matches: [{ jobId: 'position-match', fitScore: 64 }],
    });
  });

  it('returns null when required applicant identity fields are missing', () => {
    expect(buildApplicantCreateInput({
      applicant_info: {
        personal_info: { firstname: 'Ada' },
        contact_info: { email: 'ada@example.com' },
      },
    })).toBeNull();

    expect(buildApplicantCreateInput({
      applicant_info: {
        personal_info: { firstname: 'Ada', lastname: 'Lovelace' },
        contact_info: {},
      },
    })).toBeNull();
  });

  it('normalizes applicant route SQL rows for API responses', () => {
    expect(normalizeApplicantRouteRows([
      {
        id: 'applicant-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '123',
        fitScore: 85,
        status: 'Applied',
        statusId: 'stage-1',
        positionTitle: 'Engineer',
        recruiterName: 'Grace',
        sourceName: 'LinkedIn',
        isRead: undefined,
      },
      {
        id: 'applicant-2',
        name: 'No Relations',
        fitScore: null,
        positionTitle: null,
        recruiterName: null,
        sourceName: null,
        isRead: true,
      },
    ])).toMatchObject([
      {
        id: 'applicant-1',
        name: 'Ada Lovelace',
        fitScore: 85,
        position: { title: 'Engineer' },
        recruiter: { name: 'Grace' },
        source: { name: 'LinkedIn' },
        isRead: null,
      },
      {
        id: 'applicant-2',
        name: 'No Relations',
        fitScore: 0,
        position: null,
        recruiter: null,
        source: null,
        isRead: true,
      },
    ]);
  });

  it('builds parameterized text filter conditions from filter operators', () => {
    expect(buildApplicantRouteTextCondition('c.name', 'Ada', 'contains', 3)).toEqual({
      clause: 'c.name ILIKE $3',
      value: '%Ada%',
      nextParamIndex: 4,
    });

    expect(buildApplicantRouteTextCondition('c.email', 'ada@example.com', 'startsWith', 1)).toEqual({
      clause: 'c.email ILIKE $1',
      value: 'ada@example.com%',
      nextParamIndex: 2,
    });

    expect(buildApplicantRouteTextCondition('c.phone', '123', 'endsWith', 2)).toEqual({
      clause: 'c.phone ILIKE $2',
      value: '%123',
      nextParamIndex: 3,
    });

    expect(buildApplicantRouteTextCondition('c.location', 'Bangkok', 'is', 5)).toEqual({
      clause: 'c.location = $5',
      value: 'Bangkok',
      nextParamIndex: 6,
    });

    expect(buildApplicantRouteTextCondition('c.name', '', 'contains', 1)).toBeNull();
  });

  it('builds nullable multi-id filter conditions for regular and null-token selections', () => {
    expect(buildApplicantRouteNullableMultiIdCondition({
      column: 'c."positionId"',
      rawValue: 'not-applied',
      nullToken: 'not-applied',
      paramIndex: 1,
    })).toEqual({
      clause: 'c."positionId" IS NULL',
      params: [],
      nextParamIndex: 1,
    });

    expect(buildApplicantRouteNullableMultiIdCondition({
      column: 'c."positionId"',
      rawValue: 'position-1',
      nullToken: 'not-applied',
      paramIndex: 2,
    })).toEqual({
      clause: 'c."positionId" = $2',
      params: ['position-1'],
      nextParamIndex: 3,
    });

    expect(buildApplicantRouteNullableMultiIdCondition({
      column: 'c."sourceId"',
      rawValue: 'unassigned,source-1,source-2',
      nullToken: 'unassigned',
      paramIndex: 4,
    })).toEqual({
      clause: '(c."sourceId" = ANY($4::uuid[]) OR c."sourceId" IS NULL)',
      params: [['source-1', 'source-2']],
      nextParamIndex: 5,
    });

    expect(buildApplicantRouteNullableMultiIdCondition({
      column: 'c."sourceId"',
      rawValue: 'select-all,source-1',
      nullToken: 'unassigned',
      selectAllToken: 'select-all',
      paramIndex: 7,
    })).toBeNull();
  });

  it('builds applied fit score SQL conditions with normalized percentage values and no-score support', () => {
    expect(buildApplicantRouteAppliedFitScoreConditions({
      minAppliedJobFitScore: 80,
      maxAppliedJobFitScore: 95,
      includeNoScoreInApplied: false,
    }, 2)).toEqual({
      clauses: [
        'c."fitScore" >= $2',
        'c."fitScore" <= $3',
      ],
      params: [0.8, 0.95],
      nextParamIndex: 4,
    });

    expect(buildApplicantRouteAppliedFitScoreConditions({
      minAppliedJobFitScore: 70,
      maxAppliedJobFitScore: undefined,
      includeNoScoreInApplied: true,
    }, 5)).toEqual({
      clauses: ['((c."fitScore" >= $5) OR (c."fitScore" IS NULL OR c."fitScore" = 0))'],
      params: [0.7],
      nextParamIndex: 6,
    });

    expect(buildApplicantRouteAppliedFitScoreConditions({
      minAppliedJobFitScore: -1,
      maxAppliedJobFitScore: -1,
      includeNoScoreInApplied: false,
    }, 1)).toEqual({
      clauses: ['(c."fitScore" IS NULL OR c."fitScore" = 0)'],
      params: [],
      nextParamIndex: 1,
    });
  });

  it('builds matching fit score SQL conditions with paired params for parsed data and job matches', () => {
    const result = buildApplicantRouteMatchingFitScoreConditions({
      minMatchingJobFitScore: 75,
      maxMatchingJobFitScore: 0.9,
      includeNoScoreInMatching: true,
    }, 4);

    expect(result.nextParamIndex).toBe(8);
    expect(result.params).toEqual([0.75, 0.75, 0.9, 0.9]);
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0]).toContain('CAST(job_match->>\'fitScore\' AS DECIMAL) >= $4');
    expect(result.clauses[0]).toContain('jm."fitScore" >= $5');
    expect(result.clauses[0]).toContain('CAST(job_match->>\'fitScore\' AS DECIMAL) <= $6');
    expect(result.clauses[0]).toContain('jm."fitScore" <= $7');
    expect(result.clauses[0]).toContain('NOT EXISTS (SELECT 1 FROM "JobMatch" jm WHERE jm."applicant_id" = c.id)');

    const noScoreOnly = buildApplicantRouteMatchingFitScoreConditions({
      minMatchingJobFitScore: -1,
      maxMatchingJobFitScore: -1,
      includeNoScoreInMatching: false,
    }, 1);

    expect(noScoreOnly.params).toEqual([]);
    expect(noScoreOnly.nextParamIndex).toBe(1);
    expect(noScoreOnly.clauses[0]).toContain('c."parsedData"->>\'job_matches\' IS NULL');
  });

  it('builds custom field SQL conditions from whitelisted field definitions', () => {
    const result = buildApplicantRouteCustomFieldConditions({
      customFieldDefinitions: {
        noticePeriod: { field_code: 'noticePeriod', field_type: 'number' },
        willingToRelocate: { field_code: 'willingToRelocate', field_type: 'boolean' },
        skills: { field_code: 'skills', field_type: 'select_multiple' },
        ignoredUnknown: { field_code: 'ignoredUnknown', field_type: 'unsupported' },
      },
      customFieldFilters: {
        noticePeriod: '30',
        willingToRelocate: 'true',
        skills: ['React', 'Node'],
        ignoredUnknown: 'value',
        missingDefinition: 'value',
        'unsafe;field': 'value',
      },
      paramIndex: 2,
    });

    expect(result).toEqual({
      clauses: [
        'CAST(c."customAttributes"->>$2 AS DECIMAL) = $3',
        'CAST(c."customAttributes"->>$4 AS BOOLEAN) = $5',
        '(c."customAttributes"->$6 ? $7 OR c."customAttributes"->$6 ? $8)',
      ],
      params: ['noticePeriod', 30, 'willingToRelocate', true, 'skills', 'React', 'Node'],
      nextParamIndex: 9,
    });
  });

  it('builds applicant list headers and pagination metadata', () => {
    const headers = buildApplicantRouteListHeaders({
      filters: parseApplicantRouteQueryOptions(new URLSearchParams()).filters,
      page: 2,
      limit: 25,
      total: 51,
      responseTime: 123,
    });

    expect(headers).toMatchObject({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': '123ms',
      'X-Total-Count': '51',
      'X-Page-Size': '25',
    });
    expect(headers.ETag).toMatch(/^"[A-Za-z0-9+/=]{1,8}"$/);

    expect(buildApplicantRoutePagination({ page: 2, limit: 25, total: 51 })).toEqual({
      page: 2,
      limit: 25,
      total: 51,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('clamps pagination and calculates offset', () => {
    const options = parseApplicantRouteQueryOptions(new URLSearchParams({
      page: '3',
      limit: '9999',
    }));

    expect(options.page).toBe(3);
    expect(options.limit).toBe(MAX_APPLICANTS_PAGE_SIZE);
    expect(options.offset).toBe(MAX_APPLICANTS_PAGE_SIZE * 2);
  });

  it('falls back to defaults for invalid pagination', () => {
    const options = parseApplicantRouteQueryOptions(new URLSearchParams({
      page: '-10',
      limit: 'not-a-number',
    }));

    expect(options.page).toBe(1);
    expect(options.limit).toBe(DEFAULT_APPLICANTS_PAGE_SIZE);
    expect(options.offset).toBe(0);
  });

  it('uses only allowlisted sort clauses', () => {
    expect(buildApplicantRouteSortClause(new URLSearchParams({
      sortColumn: 'name',
      sortDirection: 'ASC',
    }))).toBe('c.name ASC');

    expect(buildApplicantRouteSortClause(new URLSearchParams({
      sortColumn: 'name; DROP TABLE "Applicant"',
      sortDirection: 'ASC',
    }))).toBe('c."applicationDate" DESC');
  });

  it('adds pinned priority only for the pin section', () => {
    expect(buildApplicantRouteSortClause(new URLSearchParams({
      showPinSection: 'true',
      sortColumn: 'email',
      sortDirection: 'DESC',
    }))).toBe('c."isPinned" DESC, c."pinnedAt" DESC NULLS LAST, c.email DESC');
  });

  it('maps advanced query aliases into route filters', () => {
    const filters = parseApplicantRouteAdvancedFilters('name:"Ada Lovelace" minFitScore:80 selectedSourceIds:linkedin');

    expect(filters.searchTerm).toBe('Ada Lovelace');
    expect(filters.minAppliedJobFitScore).toBe('80');
    expect(filters.selectedSourceIds).toBe('linkedin');
  });

  it('lets explicit query params override advanced query values', () => {
    const options = parseApplicantRouteQueryOptions(new URLSearchParams({
      query: 'email:from-query@example.com minExperienceYears:4',
      email: 'explicit@example.com',
    }));

    expect(options.filters.email).toBe('explicit@example.com');
    expect(options.filters.minExperienceYears).toBe(4);
    expect(options.filters.includeNoScoreInApplied).toBe(false);
    expect(options.filters.includeNoScoreInMatching).toBe(false);
  });

  it('collects custom field filters', () => {
    expect(getApplicantRouteCustomFieldFilters(new URLSearchParams({
      customField_noticePeriod: '30',
      customField_salary: '100000',
      name: 'ignored',
    }))).toEqual({
      noticePeriod: '30',
      salary: '100000',
    });
  });
});
