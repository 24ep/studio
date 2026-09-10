import { getPool } from '@/lib/db';
import type { UpdateRecruitmentStageInput } from './recruitment-stage-detail-schema';

export async function fetchRecruitmentStage(id: string) {
  const client = await getPool().connect();

  try {
    const result = await client.query(
      'SELECT id, name, description, sort_order, color_complete, color_badge, is_system FROM "RecruitmentStage" WHERE id = $1',
      [id]
    );

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function updateRecruitmentStage(id: string, data: UpdateRecruitmentStageInput) {
  const client = await getPool().connect();

  try {
    const setClauses = Object.entries(data).map(([key], index) => {
      const dbKey = key === 'sort_order' ? '"sort_order"' : key;
      return `${dbKey} = $${index + 1}`;
    });
    const queryParams = Object.values(data);
    const result = await client.query(`
      UPDATE "RecruitmentStage"
      SET ${setClauses.join(', ')}
      WHERE id = $${queryParams.length + 1}
      RETURNING *;
    `, [...queryParams, id]);

    return result.rowCount === 0 ? null : result.rows[0];
  } finally {
    client.release();
  }
}

export async function deleteRecruitmentStage(id: string) {
  const client = await getPool().connect();

  try {
    const stageResult = await client.query('SELECT name, is_system FROM "RecruitmentStage" WHERE id = $1', [id]);
    if (stageResult.rowCount === 0) {
      return { status: 'not-found' as const };
    }

    const stageName = stageResult.rows[0].name;
    if (stageResult.rows[0].is_system === true) {
      return { status: 'protected' as const, stageName };
    }

    const applicantCount = await client.query('SELECT COUNT(*) as count FROM "Applicant" WHERE "statusId" = $1', [id]);
    const transitionCount = await client.query('SELECT COUNT(*) as count FROM "TransitionRecord" WHERE stage = $1', [stageName]);
    const totalUsage = parseInt(applicantCount.rows[0].count) + parseInt(transitionCount.rows[0].count);

    if (totalUsage > 0) {
      return { status: 'in-use' as const, stageName, usageCount: totalUsage };
    }

    const result = await client.query('DELETE FROM "RecruitmentStage" WHERE id = $1 RETURNING name', [id]);
    return { status: 'deleted' as const, stageName: result.rows[0].name };
  } finally {
    client.release();
  }
}
