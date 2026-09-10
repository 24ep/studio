import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  requireRecruitmentStageEditPermission,
  requireRecruitmentStageSession,
} from './recruitment-stage-detail-auth';
import {
  deleteRecruitmentStage,
  fetchRecruitmentStage,
  updateRecruitmentStage,
} from './recruitment-stage-detail-data';
import { broadcastRecruitmentStagesUpdated } from './recruitment-stage-detail-events';
import {
  parseRecruitmentStageUpdateBody,
  resolveRecruitmentStageId,
} from './recruitment-stage-detail-request';
import type { RecruitmentStageDetailRouteContext } from './recruitment-stage-detail-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function internalErrorResponse(message: string, error: unknown) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return NextResponse.json({
    message,
    error: isDevelopment ? getErrorMessage(error) : 'Internal server error',
  }, { status: 500 });
}

export async function handleGetRecruitmentStage(request: NextRequest, context?: RecruitmentStageDetailRouteContext) {
  const idResolution = await resolveRecruitmentStageId(request, context, 'GET');
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireRecruitmentStageSession();
  if (!session.ok) {
    return session.response;
  }

  try {
    const stage = await fetchRecruitmentStage(idResolution.id);
    if (!stage) {
      return NextResponse.json({ message: 'Recruitment stage not found' }, { status: 404 });
    }

    return NextResponse.json(stage);
  } catch (error: unknown) {
    console.error(`Failed to fetch recruitment stage ${idResolution.id}:`, error);
    return internalErrorResponse('Error fetching recruitment stage', error);
  }
}

export async function handleUpdateRecruitmentStage(request: NextRequest, context?: RecruitmentStageDetailRouteContext) {
  const idResolution = await resolveRecruitmentStageId(request, context, 'PUT');
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireRecruitmentStageSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireRecruitmentStageEditPermission(
    session.session,
    session.actingUserId,
    'API:RecruitmentStages:Edit'
  );
  if (permissionError) {
    return permissionError;
  }

  const parsedBody = await parseRecruitmentStageUpdateBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const existingStage = await fetchRecruitmentStage(idResolution.id);
    if (!existingStage) {
      return NextResponse.json({ message: 'Recruitment stage not found' }, { status: 404 });
    }
    if (
      existingStage.is_system === true &&
      parsedBody.data.name &&
      parsedBody.data.name !== existingStage.name
    ) {
      return NextResponse.json({
        message: `Cannot rename required system stage "${existingStage.name}".`,
      }, { status: 400 });
    }

    const updatedStage = await updateRecruitmentStage(idResolution.id, parsedBody.data);
    if (!updatedStage) {
      return NextResponse.json({ message: 'Recruitment stage not found' }, { status: 404 });
    }

    await logAudit(
      'AUDIT',
      `Recruitment stage '${updatedStage.name}' (ID: ${idResolution.id}) updated.`,
      'API:RecruitmentStages:Update',
      session.actingUserId,
      { stageId: idResolution.id, changes: parsedBody.data }
    );
    await broadcastRecruitmentStagesUpdated(session.session.user.id);

    return NextResponse.json(updatedStage);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to update recruitment stage ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to update stage (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:RecruitmentStages:Update',
      session.actingUserId,
      { input: parsedBody.body }
    );
    return internalErrorResponse('Error updating recruitment stage', error);
  }
}

export async function handleDeleteRecruitmentStage(request: NextRequest, context?: RecruitmentStageDetailRouteContext) {
  const idResolution = await resolveRecruitmentStageId(request, context, 'DELETE');
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireRecruitmentStageSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireRecruitmentStageEditPermission(
    session.session,
    session.actingUserId,
    'API:RecruitmentStages:Delete'
  );
  if (permissionError) {
    return permissionError;
  }

  try {
    const deleteResult = await deleteRecruitmentStage(idResolution.id);

    if (deleteResult.status === 'not-found') {
      return NextResponse.json({ message: 'Recruitment stage not found' }, { status: 404 });
    }

    if (deleteResult.status === 'protected') {
      return NextResponse.json({
        message: `Cannot delete stage "${deleteResult.stageName}" as it has business logic dependencies. This stage is used in core system functionality.`,
      }, { status: 400 });
    }

    if (deleteResult.status === 'in-use') {
      return NextResponse.json({
        message: `Stage "${deleteResult.stageName}" is currently in use by ${deleteResult.usageCount} record(s). Please migrate these records to another stage before deletion.`,
        usageCount: deleteResult.usageCount,
        stageName: deleteResult.stageName,
      }, { status: 409 });
    }

    await logAudit(
      'AUDIT',
      `Recruitment stage '${deleteResult.stageName}' (ID: ${idResolution.id}) deleted.`,
      'API:RecruitmentStages:Delete',
      session.actingUserId,
      { stageId: idResolution.id }
    );
    await broadcastRecruitmentStagesUpdated(session.session.user.id);

    return NextResponse.json({ message: 'Recruitment stage deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to delete recruitment stage ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to delete stage (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:RecruitmentStages:Delete',
      session.actingUserId
    );
    return internalErrorResponse('Error deleting recruitment stage', error);
  }
}
