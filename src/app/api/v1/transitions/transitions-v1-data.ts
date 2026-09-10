import { getPool } from '@/lib/db';
import type { CreateTransitionInput, TransitionListOptions } from './transitions-v1-schema';

interface TransitionRow {
  id: string;
  applicantId: string;
  fromStageId: string | null;
  toStageId: string;
  fromStageName: string | null;
  toStageName: string | null;
  notes: string | null;
  transitionDate: Date | string;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date | string;
}

interface NewTransitionRow {
  id: string;
  Applicant_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  notes: string | null;
  transition_date: Date | string;
  created_at: Date | string;
}

function buildTransitionsWhereClause(applicantId: string | null) {
  if (!applicantId) {
    return {
      whereClause: '',
      queryParams: [] as unknown[],
      nextParamIndex: 1,
    };
  }

  return {
    whereClause: 'WHERE t.Applicant_id = $1',
    queryParams: [applicantId] as unknown[],
    nextParamIndex: 2,
  };
}

function mapTransitionRow(row: TransitionRow) {
  return {
    id: row.id,
    applicantId: row.applicantId,
    fromStageId: row.fromStageId,
    toStageId: row.toStageId,
    fromStageName: row.fromStageName,
    toStageName: row.toStageName,
    notes: row.notes,
    transitionDate: row.transitionDate,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
  };
}

function mapNewTransitionRow(row: NewTransitionRow) {
  return {
    id: row.id,
    applicantId: row.Applicant_id,
    fromStageId: row.from_stage_id,
    toStageId: row.to_stage_id,
    notes: row.notes,
    transitionDate: row.transition_date,
    createdAt: row.created_at,
  };
}

export async function fetchV1Transitions({ applicantId, limit, offset }: TransitionListOptions) {
  const client = await getPool().connect();

  try {
    const { whereClause, queryParams, nextParamIndex } = buildTransitionsWhereClause(applicantId);

    const countResult = await client.query(
      `
        SELECT COUNT(*) as total
        FROM "ApplicantTransition" t
        ${whereClause}
      `,
      queryParams
    );

    const transitionsResult = await client.query(
      `
        SELECT
          t.id,
          t.Applicant_id as "applicantId",
          t.from_stage_id as "fromStageId",
          t.to_stage_id as "toStageId",
          fs.name as "fromStageName",
          ts.name as "toStageName",
          t.notes,
          t.transition_date as "transitionDate",
          t.created_by as "createdBy",
          u.name as "createdByName",
          t.created_at as "createdAt"
        FROM "ApplicantTransition" t
        LEFT JOIN "RecruitmentStage" fs ON t.from_stage_id = fs.id
        LEFT JOIN "RecruitmentStage" ts ON t.to_stage_id = ts.id
        LEFT JOIN "User" u ON t.created_by = u.id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}
      `,
      [...queryParams, limit, offset]
    );

    return {
      data: transitionsResult.rows.map(mapTransitionRow),
      total: parseInt(countResult.rows[0]?.total || '0', 10),
    };
  } finally {
    client.release();
  }
}

export async function createV1Transition(input: CreateTransitionInput, createdByUserId: string) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const transitionDateValue = input.transitionDate || new Date().toISOString();
    const result = await client.query(
      `
        INSERT INTO "ApplicantTransition" (
          id, Applicant_id, from_stage_id, to_stage_id, notes, transition_date, created_by, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        ) RETURNING *
      `,
      [input.applicantId, input.fromStageId, input.toStageId, input.notes, transitionDateValue, createdByUserId]
    );

    await client.query(
      'UPDATE "Applicant" SET "statusId" = $1 WHERE id = $2',
      [input.toStageId, input.applicantId]
    );

    await client.query('COMMIT');

    return mapNewTransitionRow(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
