import { type NextRequest } from 'next/server';
import { requireJobMatchPermission } from './job-matches-auth';
import {
  deleteApplicantJobMatches,
  fetchApplicantJobMatches,
  replaceApplicantJobMatches,
  upsertApplicantJobMatches,
} from './job-matches-db';
import { parseJobMatchesPayload } from './job-matches-schema';
import { getDatabaseErrorDetails, getErrorMessage, jsonCors, noContentCors } from './job-matches-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function getApplicantId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

async function handleJobMatchesUpsert(request: NextRequest, context: RouteContext, successMessage: string) {
  const authError = await requireJobMatchPermission(request, 'JOB_MATCH_MANAGE');
  if (authError) return authError;

  const parsed = await parseJobMatchesPayload(request);
  if (!parsed.ok) {
    return jsonCors(request, parsed.body, 400);
  }

  try {
    const jobMatches = await upsertApplicantJobMatches(await getApplicantId(context), parsed.payload.job_matches);
    return jsonCors(request, { message: successMessage, job_matches: jobMatches });
  } catch (error) {
    console.error('[JOB-MATCHES] Upsert error:', error);
    if (getErrorMessage(error) === 'Applicant not found') {
      return jsonCors(request, { error: 'Applicant not found' }, 404);
    }

    return jsonCors(request, {
      error: 'Error adding/updating job matches',
      ...getDatabaseErrorDetails(error),
    }, 500);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = await requireJobMatchPermission(request, 'JOB_MATCH_VIEW');
  if (authError) return authError;

  try {
    const jobMatches = await fetchApplicantJobMatches(await getApplicantId(context));
    return jsonCors(request, { job_matches: jobMatches });
  } catch (error) {
    console.error('[JOB-MATCHES] GET Error:', error);
    if (getErrorMessage(error) === 'Applicant not found') {
      return jsonCors(request, { error: 'Applicant not found' }, 404);
    }

    return jsonCors(request, { error: 'Error fetching job matches', details: getErrorMessage(error) }, 500);
  }
}

export function POST(request: NextRequest, context: RouteContext) {
  return handleJobMatchesUpsert(request, context, 'Job matches added/updated successfully');
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return handleJobMatchesUpsert(request, context, 'Job matches updated successfully');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await requireJobMatchPermission(request, 'JOB_MATCH_MANAGE');
  if (authError) return authError;

  const parsed = await parseJobMatchesPayload(request, false);
  if (!parsed.ok) {
    return jsonCors(request, parsed.body, 400);
  }

  try {
    const jobMatches = await replaceApplicantJobMatches(await getApplicantId(context), parsed.payload.job_matches);
    return jsonCors(request, { message: 'Job matches updated successfully', job_matches: jobMatches });
  } catch (error) {
    if (getErrorMessage(error) === 'Applicant not found') {
      return jsonCors(request, { error: 'Applicant not found' }, 404);
    }

    return jsonCors(request, { error: 'Error updating job matches', details: getErrorMessage(error) }, 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await requireJobMatchPermission(request, 'JOB_MATCH_MANAGE');
  if (authError) return authError;

  try {
    const deletedCount = await deleteApplicantJobMatches(await getApplicantId(context));
    return jsonCors(request, {
      message: 'All job matches deleted successfully',
      deleted_count: deletedCount,
    });
  } catch (error) {
    if (getErrorMessage(error) === 'Applicant not found') {
      return jsonCors(request, { error: 'Applicant not found' }, 404);
    }

    return jsonCors(request, { error: 'Error deleting job matches', details: getErrorMessage(error) }, 500);
  }
}

export function OPTIONS(request: NextRequest) {
  return noContentCors(request);
}
