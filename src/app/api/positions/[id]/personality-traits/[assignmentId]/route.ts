import { createPositionEvaluationAssignmentDeleteHandler } from '../../position-evaluation-items-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const DELETE = createPositionEvaluationAssignmentDeleteHandler({
  apiLabel: 'Position Personality Traits API',
  auditRemoveAction: 'API:PositionPersonalityTraits:Remove',
  itemLabel: 'personality trait',
  assignmentNotFoundMessage: 'Personality trait assignment not found',
  deleteFailedMessage: 'Failed to remove personality trait',
  successMessage: 'Personality trait removed successfully',
  errorMessage: 'Error removing personality trait',
  readAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query<{ id: string; itemName: string }>(
      `
        SELECT ppt.id, t.name as "itemName"
        FROM "PositionPersonalityTrait" ppt
        JOIN "PersonalityTrait" t ON ppt."traitId" = t.id
        WHERE ppt.id = $1 AND ppt."positionId" = $2
      `,
      [assignmentId, positionId]
    );
    return result.rows[0] ?? null;
  },
  deleteAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query(
      'DELETE FROM "PositionPersonalityTrait" WHERE id = $1 AND "positionId" = $2',
      [assignmentId, positionId]
    );
    return result.rowCount;
  },
  buildAuditMessage: (traitName, positionTitle, actingUserName) =>
    `Personality trait '${traitName}' removed from position '${positionTitle}' by ${actingUserName}.`,
});
