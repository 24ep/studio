import type { QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { getPool, type DbClient } from '../../../../lib/db';
import type { RecruitmentStageInput } from './recruitment-stages-route-schema';
import { ensureRequiredRecruitmentStages } from '@/lib/recruitment-stage-system';

export type RecruitmentStageLookupRow = QueryResultRow & {
  id: string;
  name: string;
};

export type RecruitmentStageRow = RecruitmentStageLookupRow & {
  description: string | null;
  sort_order: number;
  color_complete: string | null;
  color_badge: string | null;
  is_system: boolean;
};

export function parseStageIdentifiers(stageIds: string) {
  return stageIds.split(',').map(id => id.trim()).filter(Boolean);
}

export async function fetchRecruitmentStagesByIdsOrNames(ids: string[]) {
  const client = await getPool().connect();
  try {
    const { params, query } = buildRecruitmentStageLookupQuery(ids);
    const result = await client.query<RecruitmentStageLookupRow>(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function fetchRecruitmentStagesForSettings() {
  const client = await getPool().connect();
  try {
    await ensureRequiredRecruitmentStages(client);
    const result = await client.query<RecruitmentStageRow>(
      'SELECT id, name, description, sort_order, color_complete, color_badge, is_system FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function createRecruitmentStage(client: DbClient, input: RecruitmentStageInput) {
  const newId = uuidv4();
  const result = await client.query<RecruitmentStageRow>(
    'INSERT INTO "RecruitmentStage" (id, name, description, sort_order, color_complete, color_badge, is_system) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, description, sort_order, color_complete, color_badge, is_system',
    [
      newId,
      input.name,
      input.description,
      input.sort_order ?? 0,
      input.color_complete || null,
      input.color_badge || null,
      false,
    ]
  );

  return { newId, stage: result.rows[0] };
}

function buildRecruitmentStageLookupQuery(ids: string[]) {
  const uuidIds = ids.filter(isUuid);
  const nameIds = ids.filter(id => !isUuid(id));

  if (uuidIds.length > 0 && nameIds.length > 0) {
    return {
      query: `
        SELECT id, name
        FROM "RecruitmentStage"
        WHERE id = ANY($1::uuid[]) OR name = ANY($2::text[])
        ORDER BY "sort_order", name
      `,
      params: [uuidIds, nameIds],
    };
  }

  if (uuidIds.length > 0) {
    return {
      query: `
        SELECT id, name
        FROM "RecruitmentStage"
        WHERE id = ANY($1::uuid[])
        ORDER BY "sort_order", name
      `,
      params: [uuidIds],
    };
  }

  return {
    query: `
      SELECT id, name
      FROM "RecruitmentStage"
      WHERE name = ANY($1::text[])
      ORDER BY "sort_order", name
    `,
    params: [nameIds],
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
