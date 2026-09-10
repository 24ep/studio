import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { SimpleErrorHandler, createInternalServerError, createNotFoundError } from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import { requireApplicantSourceUpdate, requireApplicantSourceView } from './applicant-source-v1-auth';
import {
  beginApplicantSourceTransaction,
  commitApplicantSourceTransaction,
  connectApplicantSourceClient,
  fetchApplicantSource,
  fetchExistingApplicantSource,
  fetchUpdatedApplicantSource,
  releaseApplicantSourceClient,
  rollbackApplicantSourceTransaction,
  updateApplicantSourceFields,
  type DbClient,
} from './applicant-source-v1-data';
import { parseUpdateApplicantSourceBody } from './applicant-source-v1-request';
import {
  buildApplicantSourceChangeDescription,
  serializeApplicantSource,
  serializeUpdatedApplicantSource,
} from './applicant-source-v1-response';
import { resolveApplicantSourceParams, type ApplicantSourceRouteContext } from './applicant-source-v1-schema';

export async function handleGetApplicantSource(request: NextRequest, context: ApplicantSourceRouteContext) {
  const authResult = await requireApplicantSourceView(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { applicantId } = await resolveApplicantSourceParams(context);
  const client = await connectApplicantSourceClient();

  try {
    const applicant = await fetchApplicantSource(client, applicantId);
    if (!applicant) {
      return SimpleErrorHandler.handleApiError(request, createNotFoundError('Applicant not found'));
    }

    return SimpleErrorHandler.createSuccessResponse(request, serializeApplicantSource(applicant), 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Error fetching Applicant source: ${errorMessage}`),
    );
  } finally {
    releaseApplicantSourceClient(client);
  }
}

export async function handleUpdateApplicantSource(request: NextRequest, context: ApplicantSourceRouteContext) {
  const authResult = await requireApplicantSourceUpdate(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { applicantId } = await resolveApplicantSourceParams(context);
  const parsedBody = await parseUpdateApplicantSourceBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { input } = parsedBody;
  let client: DbClient | null = null;

  try {
    client = await connectApplicantSourceClient();
    await beginApplicantSourceTransaction(client);

    const existingApplicant = await fetchExistingApplicantSource(client, applicantId);
    if (!existingApplicant) {
      await rollbackApplicantSourceTransaction(client);
      return SimpleErrorHandler.handleApiError(request, createNotFoundError('Applicant not found'));
    }

    const oldSourceId = existingApplicant.sourceId;
    const oldSubSource = existingApplicant.subSource;
    const updatedApplicant = await updateApplicantSourceFields(client, applicantId, input);
    const applicantWithSource = await fetchUpdatedApplicantSource(client, applicantId);

    await commitApplicantSourceTransaction(client);

    const actingUserName = (authResult.user.name || authResult.user.email || authResult.user.id || 'System') as string;
    await logAudit(
      'AUDIT',
      `Applicant '${updatedApplicant.name}' source updated by ${actingUserName}. Changes: ${buildApplicantSourceChangeDescription(input, oldSourceId, oldSubSource)}`,
      'API:V1:Applicants:UpdateSource',
      authResult.user.id,
      {
        applicantId,
        oldSourceId,
        newSourceId: input.sourceId,
        oldSubSource,
        newSubSource: input.subSource,
      },
    );

    return SimpleErrorHandler.createSuccessResponse(
      request,
      serializeUpdatedApplicantSource(applicantWithSource, input, oldSourceId, oldSubSource),
      200,
    );
  } catch (error) {
    await rollbackApplicantSourceTransaction(client);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit(
      'ERROR',
      `Failed to update Applicant source (ID: ${applicantId}) by ${authResult.user?.name || 'Unknown'}. Error: ${errorMessage}`,
      'API:V1:Applicants:UpdateSource',
      authResult.user?.id,
      {
        applicantId,
        error: errorMessage,
        requestBody: parsedBody.body,
      },
    );
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Error updating Applicant source: ${errorMessage}`),
    );
  } finally {
    releaseApplicantSourceClient(client);
  }
}

export function handleApplicantSourceOptions(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
