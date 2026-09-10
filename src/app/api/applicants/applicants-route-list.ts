import { type NextRequest, NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool, restoreDefaultStatementTimeout, type DbClient } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import {
  type ApplicantRouteRow,
  APPLICANTS_QUERY_TIMEOUT,
  buildApplicantRouteListHeaders,
  buildApplicantRoutePagination,
  normalizeApplicantRouteRows,
  parseApplicantRouteQueryOptions,
} from './applicants-route-utils';
import { buildApplicantRouteListQuery } from './applicants-route-list-query';
import { requireApplicantsRoutePermission } from './applicants-route-auth';

type CountRow = QueryResultRow & {
  total: string;
};

async function getClient() {
  return await getPool().connect();
}

async function applyApplicantListStatementTimeout(client: DbClient, isForCounts: boolean) {
  const timeout = isForCounts ? APPLICANTS_QUERY_TIMEOUT * 2 : APPLICANTS_QUERY_TIMEOUT;
  await client.query(`SET statement_timeout = ${timeout}`);
}

export async function handleListApplicants(request: NextRequest) {
  const startTime = Date.now();
  let client: DbClient | undefined;

  try {
    const access = await requireApplicantsRoutePermission('applicantS_VIEW', request);
    if (!access.ok) {
      return access.response;
    }

    const { searchParams } = new URL(request.url);
    const queryOptions = parseApplicantRouteQueryOptions(searchParams);

    client = await getClient();
    await applyApplicantListStatementTimeout(client, queryOptions.isForCounts);

    const listQuery = await buildApplicantRouteListQuery({
      client,
      filters: queryOptions.filters,
      pinnedOnly: queryOptions.pinnedOnly,
      user: {
        id: access.session.user.id,
        role: access.session.user.role ?? undefined,
      },
      sortClause: queryOptions.sortClause,
      limit: queryOptions.limit,
      offset: queryOptions.offset,
      hasPermission,
      readSystemSetting: getSystemSetting,
    });

    if (queryOptions.isForCounts) {
      const countResult = await client.query<CountRow>(listQuery.countQuery, listQuery.countParams);
      const total = parseInt(countResult.rows[0].total);
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        total,
        data: [],
      }, {
        headers: buildApplicantRouteListHeaders({
          filters: queryOptions.filters,
          page: queryOptions.page,
          limit: 'count-only',
          total,
          responseTime,
        }),
      });
    }

    const [countResult, dataResult] = await Promise.all([
      client.query<CountRow>(listQuery.countQuery, listQuery.countParams),
      client.query<ApplicantRouteRow>(listQuery.dataQuery, listQuery.dataParams),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const applicants = normalizeApplicantRouteRows(dataResult.rows);
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      data: applicants,
      pagination: buildApplicantRoutePagination({
        page: queryOptions.page,
        limit: queryOptions.limit,
        total,
      }),
    }, {
      headers: buildApplicantRouteListHeaders({
        filters: queryOptions.filters,
        page: queryOptions.page,
        limit: queryOptions.limit,
        total,
        responseTime,
      }),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Error fetching Applicants:', error);

    return NextResponse.json({
      message: 'Internal Server Error',
      error: 'An unexpected error occurred while fetching Applicants',
      responseTime: `${responseTime}ms`,
    }, { status: 500 });
  } finally {
    if (client) {
      try {
        await restoreDefaultStatementTimeout(client);
      } catch (releaseError) {
        console.error('Error restoring database statement timeout:', releaseError);
      } finally {
        client.release();
      }
    }
  }
}
