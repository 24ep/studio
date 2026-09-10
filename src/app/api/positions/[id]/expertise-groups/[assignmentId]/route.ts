import { createPositionEvaluationAssignmentDeleteHandler } from '../../position-evaluation-items-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const DELETE = createPositionEvaluationAssignmentDeleteHandler({
  apiLabel: 'Position Expertise Groups API',
  auditRemoveAction: 'API:PositionExpertiseGroups:Remove',
  itemLabel: 'expertise group',
  assignmentNotFoundMessage: 'Expertise group assignment not found',
  deleteFailedMessage: 'Failed to remove expertise group',
  successMessage: 'Expertise group removed successfully',
  errorMessage: 'Error removing expertise group',
  readAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query<{ id: string; itemName: string }>(
      `
        SELECT peg.id, g.name as "itemName"
        FROM "PositionExpertiseGroup" peg
        JOIN "ExpertiseGroup" g ON peg."groupId" = g.id
        WHERE peg.id = $1 AND peg."positionId" = $2
      `,
      [assignmentId, positionId]
    );
    return result.rows[0] ?? null;
  },
  deleteAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query(
      'DELETE FROM "PositionExpertiseGroup" WHERE id = $1 AND "positionId" = $2',
      [assignmentId, positionId]
    );
    return result.rowCount;
  },
  buildAuditMessage: (groupName, positionTitle, actingUserName) =>
    `Expertise group '${groupName}' removed from position '${positionTitle}' by ${actingUserName}.`,
});
