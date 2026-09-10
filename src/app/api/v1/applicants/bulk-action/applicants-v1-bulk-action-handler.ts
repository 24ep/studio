import { type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { isJsonObject } from '@/lib/json-types';
import {
  requireV1BulkActionPermission,
  requireV1BulkActionUser,
} from './applicants-v1-bulk-action-auth';
import {
  logV1BulkActionDenied,
  logV1BulkActionFailure,
  logV1BulkActionMissingData,
  logV1BulkActionSuccess,
} from './applicants-v1-bulk-action-audit';
import {
  fetchV1BulkActionApplicants,
  splitApplicantsByActionPermission,
} from './applicants-v1-bulk-action-permissions';
import { buildV1BulkActionQuery } from './applicants-v1-bulk-action-query';
import {
  getMissingActionDataMessage,
  readV1BulkActionBody,
  validateV1BulkActionBody,
} from './applicants-v1-bulk-action-request';
import { v1BulkActionErrorResponse, v1BulkActionJsonResponse } from './applicants-v1-bulk-action-response';
import { syncPositionRecruiterForV1BulkAction } from './applicants-v1-bulk-action-recruiter-sync';

export async function handleV1ApplicantsBulkAction(request: NextRequest) {
  const authorization = await requireV1BulkActionUser(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const rawBody = await readV1BulkActionBody(request);
  if (!rawBody.ok) {
    return rawBody.response;
  }

  const actionPermission = requireV1BulkActionPermission(
    request,
    authorization.user,
    isJsonObject(rawBody.body) ? rawBody.body.action : undefined,
  );
  if (!actionPermission.ok) {
    return actionPermission.response;
  }

  const validation = validateV1BulkActionBody(request, rawBody.body);
  if (!validation.ok) {
    return validation.response;
  }

  const input = validation.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const applicants = await fetchV1BulkActionApplicants(client, input.applicantIds);
    const permissionSplit = splitApplicantsByActionPermission(authorization.user, input.action, applicants);

    if (permissionSplit.denied.length > 0) {
      await client.query('ROLLBACK');
      const deniedApplicantIds = permissionSplit.denied.map(applicant => applicant.applicantId);
      await logV1BulkActionDenied(authorization.user, input.action, deniedApplicantIds);
      return v1BulkActionJsonResponse(request, {
        error: `Forbidden: You don't have permission to perform ${input.action} on some Applicants. Denied Applicants: ${deniedApplicantIds.join(', ')}`,
        deniedApplicants: permissionSplit.denied,
      }, 403);
    }

    const missingDataMessage = getMissingActionDataMessage(input);
    if (missingDataMessage) {
      await client.query('ROLLBACK');
      await logV1BulkActionMissingData(authorization.user, input);
      return v1BulkActionErrorResponse(request, missingDataMessage, 400);
    }

    const permittedApplicantIds = permissionSplit.allowed.map(applicant => applicant.id);
    const updateQuery = buildV1BulkActionQuery(input, permittedApplicantIds);
    const result = await client.query(updateQuery.sql, updateQuery.params);

    await syncPositionRecruiterForV1BulkAction(input, permittedApplicantIds, authorization.user);
    await client.query('COMMIT');
    await logV1BulkActionSuccess(authorization.user, input, result.rowCount);

    return v1BulkActionJsonResponse(request, {
      message: `Bulk action '${input.action}' completed successfully`,
      affectedCount: result.rowCount,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    await logV1BulkActionFailure(authorization.user, input, error as Error);
    return v1BulkActionErrorResponse(request, 'Error performing bulk action', 500, (error as Error).message);
  } finally {
    client.release();
  }
}
