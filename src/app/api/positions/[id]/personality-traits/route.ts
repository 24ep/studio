import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createPositionEvaluationItemHandlers } from '../position-evaluation-items-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PersonalityTraitListRow = {
  id: string;
  positionId: string;
  traitId: string;
  isRequired: boolean;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
  traitName: string;
  traitDescription: string | null;
  traitGroupId: string | null;
  traitSortOrder: number | null;
  groupName: string | null;
  groupColor: string | null;
};

type PersonalityItemRow = {
  id: string;
  name: string;
};

type AssignmentRow = {
  id: string;
  createdAt: Date;
};

const handlers = createPositionEvaluationItemHandlers<PersonalityTraitListRow>({
  apiLabel: 'Position Personality Traits API',
  auditAddAction: 'API:PositionPersonalityTraits:Add',
  duplicateMessage: 'Personality trait is already assigned to this position',
  fetchErrorMessage: 'Error fetching position personality traits',
  itemIdField: 'traitId',
  itemLabel: 'personality trait',
  itemNotFoundMessage: 'Personality trait not found',
  addSuccessMessage: 'Personality trait added successfully',
  addErrorMessage: 'Error adding personality trait',
  listQuery: `
    SELECT
      ppt.id,
      ppt."positionId",
      ppt."traitId",
      ppt.is_required as "isRequired",
      ppt.weight,
      ppt."createdAt",
      ppt."updatedAt",
      t.name as "traitName",
      t.description as "traitDescription",
      t."groupId" as "traitGroupId",
      t.sort_order as "traitSortOrder",
      g.name as "groupName",
      g.color as "groupColor"
    FROM "PositionPersonalityTrait" ppt
    INNER JOIN "PersonalityTrait" t ON ppt."traitId" = t.id
    LEFT JOIN "PersonalityGroup" g ON t."groupId" = g.id
    WHERE ppt."positionId" = $1
    ORDER BY t.sort_order ASC NULLS LAST, t.name ASC
  `,
  mapListRow: (row) => ({
    id: row.id,
    positionId: row.positionId,
    traitId: row.traitId,
    isRequired: row.isRequired,
    weight: row.weight,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    trait: {
      id: row.traitId,
      name: row.traitName,
      description: row.traitDescription,
      groupId: row.traitGroupId,
      group: row.traitGroupId
        ? {
            id: row.traitGroupId,
            name: row.groupName,
            color: row.groupColor,
          }
        : null,
    },
  }),
  readItem: async (client, traitId) => {
    const result = await client.query<PersonalityItemRow>('SELECT id, name FROM "PersonalityTrait" WHERE id = $1', [traitId]);
    return result.rows[0] ?? null;
  },
  readExistingAssignment: async (client, positionId, traitId) => {
    const result = await client.query<{ id: string }>(
      'SELECT id FROM "PositionPersonalityTrait" WHERE "positionId" = $1 AND "traitId" = $2',
      [positionId, traitId]
    );
    return result.rows.length > 0;
  },
  insertAssignment: async (client, positionId, traitId) => {
    const result = await client.query<AssignmentRow>(
      `
        INSERT INTO "PositionPersonalityTrait" (id, "positionId", "traitId", is_required, weight, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, "createdAt"
      `,
      [randomUUID(), positionId, traitId, false, 1.0]
    );
    return result.rows[0];
  },
  buildSuccessAssignment: ({ assignment, positionId, itemId, item }) => ({
    id: assignment.id,
    positionId,
    traitId: itemId,
    traitName: item.name,
    createdAt: assignment.createdAt,
  }),
  buildAuditMessage: (traitName, positionTitle, actingUserName) =>
    `Personality trait '${traitName}' added to position '${positionTitle}' by ${actingUserName}.`,
  mapPostError: (error) => {
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Personality trait is already assigned to this position' }, { status: 409 });
    }
    return null;
  },
  logPostError: (error, { positionId, itemId, body }) => {
    console.error(`[Position Personality Traits API] Error adding personality trait to position ${positionId}:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
      positionId,
      traitId: itemId || (body as { traitId?: string })?.traitId || 'unknown',
      body,
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
