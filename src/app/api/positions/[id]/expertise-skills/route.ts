import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import {
  createPositionEvaluationItemHandlers,
  type PositionEvaluationItemDatabaseError,
} from '../position-evaluation-items-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ExpertiseSkillListRow = {
  id: string;
  positionId: string;
  skillId: string;
  isRequired: boolean;
  weight: number;
  minScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  skillName: string;
  skillDescription: string | null;
  skillMaxScore: number | null;
  skillType: string | null;
  skillGroupId: string | null;
  groupName: string | null;
  groupColor: string | null;
};

type ExpertiseItemRow = {
  id: string;
  name: string;
};

type AssignmentRow = {
  id: string;
  createdAt: Date;
};

function getDatabaseErrorCode(error: unknown): string | undefined {
  return error instanceof Error ? (error as PositionEvaluationItemDatabaseError).code : undefined;
}

const handlers = createPositionEvaluationItemHandlers<ExpertiseSkillListRow>({
  apiLabel: 'Position Expertise Skills API',
  auditAddAction: 'API:PositionExpertiseSkills:Add',
  duplicateMessage: 'Expertise skill is already assigned to this position',
  fetchErrorMessage: 'Error fetching position expertise skills',
  itemIdField: 'skillId',
  itemLabel: 'expertise skill',
  itemNotFoundMessage: 'Expertise skill not found',
  addSuccessMessage: 'Expertise skill added successfully',
  addErrorMessage: 'Error adding expertise skill',
  listQuery: `
    SELECT
      pes.id,
      pes."positionId",
      pes."skillId",
      pes.is_required as "isRequired",
      pes.weight,
      pes.min_score as "minScore",
      pes."createdAt",
      pes."updatedAt",
      s.name as "skillName",
      s.description as "skillDescription",
      s.max_score as "skillMaxScore",
      s.skill_type as "skillType",
      s."groupId" as "skillGroupId",
      g.name as "groupName",
      g.color as "groupColor"
    FROM "PositionExpertiseSkill" pes
    INNER JOIN "ExpertiseSkill" s ON pes."skillId" = s.id
    LEFT JOIN "ExpertiseGroup" g ON s."groupId" = g.id
    WHERE pes."positionId" = $1
    ORDER BY s.sort_order ASC NULLS LAST, s.name ASC
  `,
  mapListRow: (row) => ({
    id: row.id,
    positionId: row.positionId,
    skillId: row.skillId,
    isRequired: row.isRequired,
    weight: row.weight,
    minScore: row.minScore,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    skill: {
      id: row.skillId,
      name: row.skillName,
      description: row.skillDescription,
      maxScore: row.skillMaxScore,
      skillType: row.skillType,
      groupId: row.skillGroupId,
      group: row.skillGroupId
        ? {
            id: row.skillGroupId,
            name: row.groupName,
            color: row.groupColor,
          }
        : null,
    },
  }),
  readItem: async (client, skillId) => {
    const result = await client.query<ExpertiseItemRow>('SELECT id, name FROM "ExpertiseSkill" WHERE id = $1', [skillId]);
    return result.rows[0] ?? null;
  },
  readExistingAssignment: async (client, positionId, skillId) => {
    const result = await client.query<{ id: string }>(
      'SELECT id FROM "PositionExpertiseSkill" WHERE "positionId" = $1 AND "skillId" = $2',
      [positionId, skillId]
    );
    return result.rows.length > 0;
  },
  insertAssignment: async (client, positionId, skillId) => {
    const assignmentId = randomUUID();

    await client.query('SAVEPOINT insert_position_expertise_skill');
    try {
      const result = await client.query<AssignmentRow>(
        `
          INSERT INTO "PositionExpertiseSkill" (id, "positionId", "skillId", is_required, weight, min_score, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id, "createdAt"
        `,
        [assignmentId, positionId, skillId, false, 1.0, null]
      );
      await client.query('RELEASE SAVEPOINT insert_position_expertise_skill');
      return result.rows[0];
    } catch (error: unknown) {
      await client.query('ROLLBACK TO SAVEPOINT insert_position_expertise_skill');
      await client.query('RELEASE SAVEPOINT insert_position_expertise_skill');

      if (getDatabaseErrorCode(error) !== '42703') {
        throw error;
      }

      const result = await client.query<AssignmentRow>(
        `
          INSERT INTO "PositionExpertiseSkill" (id, "positionId", "skillId", is_required, weight, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id, "createdAt"
        `,
        [assignmentId, positionId, skillId, false, 1.0]
      );
      return result.rows[0];
    }
  },
  buildSuccessAssignment: ({ assignment, positionId, itemId, item }) => ({
    id: assignment.id,
    positionId,
    skillId: itemId,
    skillName: item.name,
    createdAt: assignment.createdAt,
  }),
  buildAuditMessage: (skillName, positionTitle, actingUserName) =>
    `Expertise skill '${skillName}' added to position '${positionTitle}' by ${actingUserName}.`,
  mapPostError: (error) => {
    if (error?.code === '23505') {
      return NextResponse.json({ message: 'Expertise skill is already assigned to this position' }, { status: 409 });
    }
    if (error?.code === '22P02') {
      return NextResponse.json({ message: 'Invalid input format', code: error.code }, { status: 400 });
    }
    if (error?.code === '23503') {
      return NextResponse.json({ message: 'Position or skill not found', code: error.code }, { status: 404 });
    }
    return null;
  },
  logPostError: (error) => {
    console.error('[Position Expertise Skills API] Insert error', {
      code: error?.code,
      detail: error?.detail,
      message: error?.message,
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
