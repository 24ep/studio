import { describe, expect, it } from 'vitest';

import { buildApplicantRouteListQuery } from './applicants-route-list-query';
import { parseApplicantRouteQueryOptions } from './applicants-route-query-options';

describe('applicants-route-list-query', () => {
  it('builds count and data queries with parameterized filters', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('"RecruitmentStage"')) {
          return { rows: [{ id: '11111111-1111-1111-1111-111111111111' }] };
        }
        return { rows: [] };
      },
    };
    const options = parseApplicantRouteQueryOptions(new URLSearchParams({
      name: 'Ada',
      status: 'Hired,null',
      sourceId: 'unassigned,22222222-2222-2222-2222-222222222222',
      skills: 'React, SQL',
      pinnedOnly: 'true',
    }));

    const queryParts = await buildApplicantRouteListQuery({
      client,
      filters: options.filters,
      pinnedOnly: options.pinnedOnly,
      user: { id: 'user-1', role: 'Admin' },
      sortClause: options.sortClause,
      limit: 25,
      offset: 50,
      hasPermission: () => true,
      readSystemSetting: async () => 'true',
    });

    expect(queries).toEqual([{
      query: 'SELECT id FROM "RecruitmentStage" WHERE name = ANY($1::text[])',
      values: [['Hired']],
    }]);
    expect(queryParts.whereClause).toContain('c.name ILIKE $1');
    expect(queryParts.whereClause).toContain('(c."statusId" = $2 OR c."statusId" IS NULL)');
    expect(queryParts.whereClause).toContain('(c."sourceId" = $3 OR c."sourceId" IS NULL)');
    expect(queryParts.whereClause).toContain(`LOWER(c."parsedData"->>'skills') LIKE $4`);
    expect(queryParts.whereClause).toContain('c."isPinned" = true');
    expect(queryParts.countParams).toEqual([
      '%Ada%',
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '%react%',
      '%sql%',
    ]);
    expect(queryParts.dataParams).toEqual([
      ...queryParts.countParams,
      'user-1',
      25,
      50,
    ]);
    expect(queryParts.dataQuery).toContain('ars.user_id = $6');
    expect(queryParts.dataQuery).toContain('LIMIT $7 OFFSET $8');
  });

  it('adds hiring manager and custom field filters when applicable', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('"CustomFieldDefinition"')) {
          return {
            rows: [{
              field_code: 'seniority',
              field_type: 'text',
            }],
          };
        }
        return { rows: [] };
      },
    };
    const options = parseApplicantRouteQueryOptions(new URLSearchParams({
      customField_seniority: 'lead',
    }));

    const queryParts = await buildApplicantRouteListQuery({
      client,
      filters: options.filters,
      pinnedOnly: false,
      user: { id: 'hm-1', role: 'Hiring Manager' },
      sortClause: options.sortClause,
      limit: 10,
      offset: 0,
      hasPermission: (_user, permission) => permission === 'applicantS_VIEW',
      readSystemSetting: async () => 'true',
    });

    expect(queries.some(entry => entry.query.includes('"CustomFieldDefinition"'))).toBe(true);
    expect(queryParts.whereClause).toContain('EXISTS (');
    expect(queryParts.whereClause).toContain('"PositionInterviewer"');
    expect(queryParts.whereClause).toContain(`c."customAttributes"->>$2 ILIKE $3`);
    expect(queryParts.countParams).toEqual(['hm-1', 'seniority', '%lead%']);
  });
});
