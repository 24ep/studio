import { createPositionEvaluationAssignmentDeleteHandler } from '../../position-evaluation-items-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const DELETE = createPositionEvaluationAssignmentDeleteHandler({
  apiLabel: 'Position Expertise Skills API',
  auditRemoveAction: 'API:PositionExpertiseSkills:Remove',
  itemLabel: 'expertise skill',
  assignmentNotFoundMessage: 'Expertise skill assignment not found',
  deleteFailedMessage: 'Failed to remove expertise skill',
  successMessage: 'Expertise skill removed successfully',
  errorMessage: 'Error removing expertise skill',
  readAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query<{ id: string; itemName: string }>(
      `
        SELECT pes.id, s.name as "itemName"
        FROM "PositionExpertiseSkill" pes
        JOIN "ExpertiseSkill" s ON pes."skillId" = s.id
        WHERE pes.id = $1 AND pes."positionId" = $2
      `,
      [assignmentId, positionId]
    );
    return result.rows[0] ?? null;
  },
  deleteAssignment: async (client, assignmentId, positionId) => {
    const result = await client.query(
      'DELETE FROM "PositionExpertiseSkill" WHERE id = $1 AND "positionId" = $2',
      [assignmentId, positionId]
    );
    return result.rowCount;
  },
  buildAuditMessage: (skillName, positionTitle, actingUserName) =>
    `Expertise skill '${skillName}' removed from position '${positionTitle}' by ${actingUserName}.`,
});
