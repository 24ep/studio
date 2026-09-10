import { type NextRequest } from 'next/server';
import { requireJobMatchPermission } from '../job-matches-auth';
import { getErrorMessage, jsonCors, noContentCors } from '../job-matches-response';
import {
  applicantExists,
  beginJobMatchDetailTransaction,
  commitJobMatchDetailTransaction,
  connectJobMatchDetailClient,
  deleteJobMatchDetail,
  fetchJobMatchDetail,
  jobMatchExists,
  releaseJobMatchDetailClient,
  rollbackJobMatchDetailTransaction,
  updateJobMatchDetail,
  type DbClient,
} from './job-match-detail-data';
import {
  parseJobMatchDetailBody,
  serializeDeletedJobMatch,
  serializeFetchedJobMatch,
  serializeUpdatedJobMatch,
} from './job-match-detail-response';
import { resolveJobMatchDetailParams, type JobMatchDetailRouteContext } from './job-match-detail-schema';

async function getAuthorizedJobMatchDetailParams(
  request: NextRequest,
  context: JobMatchDetailRouteContext,
  permission: 'JOB_MATCH_VIEW' | 'JOB_MATCH_MANAGE',
) {
  const authResponse = await requireJobMatchPermission(request, permission);
  if (authResponse) {
    return { ok: false as const, response: authResponse };
  }

  return {
    ok: true as const,
    params: await resolveJobMatchDetailParams(context),
  };
}

async function verifyApplicantAndMatch(
  request: NextRequest,
  client: DbClient,
  applicantId: string,
  matchId: string,
  rollback = false,
) {
  if (!(await applicantExists(client, applicantId))) {
    if (rollback) {
      await rollbackJobMatchDetailTransaction(client);
    }
    return jsonCors(request, { error: 'Applicant not found' }, 404);
  }

  if (!(await jobMatchExists(client, applicantId, matchId))) {
    if (rollback) {
      await rollbackJobMatchDetailTransaction(client);
    }
    return jsonCors(request, { error: 'Job match not found' }, 404);
  }

  return null;
}

export async function handleGetJobMatchDetail(request: NextRequest, context: JobMatchDetailRouteContext) {
  const authorized = await getAuthorizedJobMatchDetailParams(request, context, 'JOB_MATCH_VIEW');
  if (!authorized.ok) {
    return authorized.response;
  }

  const { applicantId, matchId } = authorized.params;
  let client: DbClient | null = null;

  try {
    client = await connectJobMatchDetailClient();

    if (!(await applicantExists(client, applicantId))) {
      return jsonCors(request, { error: 'Applicant not found' }, 404);
    }

    const match = await fetchJobMatchDetail(client, applicantId, matchId);
    if (!match) {
      return jsonCors(request, { error: 'Job match not found' }, 404);
    }

    return jsonCors(request, { job_match: serializeFetchedJobMatch(match) });
  } catch (error) {
    return jsonCors(request, { error: 'Error fetching job match', details: getErrorMessage(error) }, 500);
  } finally {
    releaseJobMatchDetailClient(client);
  }
}

export async function handleUpdateJobMatchDetail(request: NextRequest, context: JobMatchDetailRouteContext) {
  const authorized = await getAuthorizedJobMatchDetailParams(request, context, 'JOB_MATCH_MANAGE');
  if (!authorized.ok) {
    return authorized.response;
  }

  const parsedBody = await parseJobMatchDetailBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { applicantId, matchId } = authorized.params;
  let client: DbClient | null = null;

  try {
    client = await connectJobMatchDetailClient();
    await beginJobMatchDetailTransaction(client);

    const verificationResponse = await verifyApplicantAndMatch(request, client, applicantId, matchId, true);
    if (verificationResponse) {
      return verificationResponse;
    }

    const updatedMatch = await updateJobMatchDetail(client, applicantId, matchId, parsedBody.input);
    if (!updatedMatch) {
      await rollbackJobMatchDetailTransaction(client);
      return jsonCors(request, { error: 'Failed to update job match' }, 500);
    }

    await commitJobMatchDetailTransaction(client);

    return jsonCors(request, {
      message: 'Job match updated successfully',
      job_match: serializeUpdatedJobMatch(updatedMatch),
    });
  } catch (error) {
    await rollbackJobMatchDetailTransaction(client);
    return jsonCors(request, { error: 'Error updating job match', details: getErrorMessage(error) }, 500);
  } finally {
    releaseJobMatchDetailClient(client);
  }
}

export async function handleDeleteJobMatchDetail(request: NextRequest, context: JobMatchDetailRouteContext) {
  const authorized = await getAuthorizedJobMatchDetailParams(request, context, 'JOB_MATCH_MANAGE');
  if (!authorized.ok) {
    return authorized.response;
  }

  const { applicantId, matchId } = authorized.params;
  let client: DbClient | null = null;

  try {
    client = await connectJobMatchDetailClient();
    await beginJobMatchDetailTransaction(client);

    const verificationResponse = await verifyApplicantAndMatch(request, client, applicantId, matchId, true);
    if (verificationResponse) {
      return verificationResponse;
    }

    const deletedMatch = await deleteJobMatchDetail(client, applicantId, matchId);
    if (!deletedMatch) {
      await rollbackJobMatchDetailTransaction(client);
      return jsonCors(request, { error: 'Failed to delete job match' }, 500);
    }

    await commitJobMatchDetailTransaction(client);

    return jsonCors(request, {
      message: 'Job match deleted successfully',
      deleted_match: serializeDeletedJobMatch(deletedMatch, applicantId),
    });
  } catch (error) {
    await rollbackJobMatchDetailTransaction(client);
    return jsonCors(request, { error: 'Error deleting job match', details: getErrorMessage(error) }, 500);
  } finally {
    releaseJobMatchDetailClient(client);
  }
}

export function handleJobMatchDetailOptions(request: NextRequest) {
  return noContentCors(request);
}
