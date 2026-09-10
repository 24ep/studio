import { type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { canEditApplicant, canUpdateApplicantPipelineStage } from '@/lib/permissions';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createInternalServerError,
  createNotFoundError,
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import { isJsonObject } from '@/lib/json-types';
import { requireV1ApplicantUpdateUser } from './applicant-v1-detail-auth';
import { type V1ApplicantDetailContext } from './applicant-v1-detail-schema';
import { buildApplicantUpdateQuery } from './applicant-v1-detail-update-query';
import { parseUpdateBody } from './applicant-v1-detail-update-request';
import {
  getUpdatedApplicantFieldNames,
  shapeUnchangedApplicant,
  shapeUpdatedApplicant,
} from './applicant-v1-detail-update-response';
import {
  autoAssignRecruiterAfterPositionChange,
  recordApplicantStatusTransition,
  replaceApplicantJobMatches,
} from './applicant-v1-detail-update-side-effects';

export async function handleUpdateV1Applicant(req: NextRequest, { params }: V1ApplicantDetailContext) {
  const authorization = await requireV1ApplicantUpdateUser(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  const parsedBody = await parseUpdateBody(req);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const user = authorization.user;
  const updateData = parsedBody.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const existingResult = await client.query('SELECT * FROM "Applicant" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
    }

    const existingApplicant = existingResult.rows[0];
    const oldStatus = existingApplicant.statusId;
    const editPermission = canEditApplicant(user, existingApplicant.recruiterId, user.id);
    if (!editPermission.canEdit) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createForbiddenError(editPermission.reason || 'Insufficient permissions to edit this Applicant'));
    }

    if (updateData.status !== undefined && updateData.status !== oldStatus) {
      const pipelinePermission = canUpdateApplicantPipelineStage(user, existingApplicant.recruiterId, user.id);
      if (!pipelinePermission.canUpdate) {
        await client.query('ROLLBACK');
        return SimpleErrorHandler.handleApiError(req, createForbiddenError(pipelinePermission.reason || 'Insufficient permissions to update pipeline stage for this Applicant'));
      }
    }

    const updateQuery = buildApplicantUpdateQuery(updateData, existingApplicant.parsedData || {}, id);
    if (!updateQuery) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.createSuccessResponse(req, {
        message: 'No fields to update',
        applicant: shapeUnchangedApplicant(existingApplicant),
      }, 200);
    }

    const updateResult = await client.query(updateQuery.query, updateQuery.values);

    if (updateData.job_matches) {
      await replaceApplicantJobMatches(client, id, updateData.job_matches);
    }

    if (updateData.status !== undefined && oldStatus !== updateData.status) {
      await recordApplicantStatusTransition(
        client,
        id,
        updateData.positionId || existingApplicant.positionId,
        updateData.status,
        user.id
      );
    }

    await client.query('COMMIT');
    const updatedApplicant = updateResult.rows[0];

    const oldPositionId = existingApplicant.positionId;
    const newPositionId = updateData.positionId !== undefined ? updateData.positionId : oldPositionId;
    if (updateData.positionId !== undefined && updateData.positionId !== oldPositionId) {
      await autoAssignRecruiterAfterPositionChange(id, newPositionId, user.id);
    }

    const actingUserName = (user.name || user.email || user.id || 'System') as string;
    await logAudit('AUDIT', `Applicant '${updatedApplicant.name}' updated by ${actingUserName}.`, 'API:V1:Applicants:Update', user.id, { applicantId: id, updatedFields: updateData });

    const updatedApplicantWithSource = await client.query(
      `
        SELECT c.*, cs.name as "sourceName", cs.description as "sourceDescription", cs.email as "sourceEmail", cs.logo as "sourceLogo"
        FROM "Applicant" c
        LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
        WHERE c.id = $1
      `,
      [id]
    );

    return SimpleErrorHandler.createSuccessResponse(req, {
      message: 'Applicant updated successfully',
      applicant: shapeUpdatedApplicant(updatedApplicantWithSource.rows[0]),
      updated_fields: getUpdatedApplicantFieldNames(updateData),
    }, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logAudit('ERROR', `Failed to update Applicant (ID: ${id}) by ${user?.name || 'Unknown'}. Error: ${errorMessage}`, 'API:V1:Applicants:Update', user?.id, {
      applicantId: id,
      error: errorMessage,
      ...(isJsonObject(parsedBody.body) ? parsedBody.body : { requestBody: parsedBody.body }),
    });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error updating Applicant: ${errorMessage}`));
  } finally {
    client.release();
  }
}
