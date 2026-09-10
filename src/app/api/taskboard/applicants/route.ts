// Optimized API endpoint specifically for taskboard performance
import { type NextRequest } from 'next/server';
import { requireTaskboardApplicantSession } from './taskboard-applicants-auth';
import {
  connectTaskboardApplicantClient,
  fetchTaskboardApplicants,
} from './taskboard-applicants-data';
import { buildTaskboardApplicantWhereClause } from './taskboard-applicants-filters';
import { parseTaskboardApplicantRequest } from './taskboard-applicants-request';
import {
  serializeTaskboardApplicants,
  taskboardApplicantsErrorResponse,
  taskboardApplicantsSuccessResponse,
} from './taskboard-applicants-response';
import type { DbClient } from './taskboard-applicants-types';
import { restoreDefaultStatementTimeout } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let client: DbClient | null = null;

  try {
    const sessionResult = await requireTaskboardApplicantSession();
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const { filters, pagination } = parseTaskboardApplicantRequest(request.url);

    client = await connectTaskboardApplicantClient();
    const where = await buildTaskboardApplicantWhereClause(client, filters, sessionResult.session);
    const result = await fetchTaskboardApplicants(client, {
      ...where,
      pagination,
    });

    return taskboardApplicantsSuccessResponse({
      applicants: serializeTaskboardApplicants(result.rows),
      pagination,
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    return taskboardApplicantsErrorResponse(error, Date.now() - startTime);
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
