import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';
import { getPool, type DbClient } from '../../../../lib/db';
import { hasPermission } from '@/lib/permissions';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  createRecruitmentStage,
  fetchRecruitmentStagesByIdsOrNames,
  fetchRecruitmentStagesForSettings,
  parseStageIdentifiers,
} from './recruitment-stages-route-data';
import {
  getRecruitmentStageRouteErrorMessage,
  recruitmentStageSchema,
} from './recruitment-stages-route-schema';

export async function handleGetRecruitmentStages(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stageIds = searchParams.get('ids');

  try {
    if (stageIds) {
      const ids = parseStageIdentifiers(stageIds);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No valid stage IDs or names provided' }, { status: 400 });
      }

      return NextResponse.json(await fetchRecruitmentStagesByIdsOrNames(ids));
    }

    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json(await fetchRecruitmentStagesForSettings());
  } catch (error: unknown) {
    console.error('Error fetching recruitment stages:', error);
    return NextResponse.json({ error: 'Failed to fetch recruitment stages' }, { status: 500 });
  }
}

export async function handleCreateRecruitmentStage(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

  if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to create recruitment stage by ${session.user.name || session.user.email}.`,
      'API:RecruitmentStages:Create',
      actingUserId
    );
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validation = recruitmentStageSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const client: DbClient = await getPool().connect();
  try {
    const { newId, stage } = await createRecruitmentStage(client, validation.data);
    await logAudit('AUDIT', `Recruitment stage '${validation.data.name}' created.`, 'API:RecruitmentStages:Create', actingUserId, { stageId: newId });

    const updatedStages = await fetchAllRecruitmentStagesDb();
    broadcastApplicantUpdate({ action: 'recruitment_stages_updated', stages: updatedStages }, session.user.id);

    return NextResponse.json(stage, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = getRecruitmentStageRouteErrorMessage(error);
    console.error('Failed to create recruitment stage:', error);
    await logAudit(
      'ERROR',
      `Failed to create stage '${validation.data.name}'. Error: ${errorMessage}`,
      'API:RecruitmentStages:Create',
      actingUserId,
      { input: body }
    );
    return NextResponse.json({ message: 'Error creating recruitment stage', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
