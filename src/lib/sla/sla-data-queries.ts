import { getPool } from '@/lib/db';
import type { Headcount } from '@/lib/types';

interface PositionHeadcountRow {
  status: string | null;
  applicantId: string | null;
}

export async function getLatestHiredDateForPosition(positionId: string): Promise<Date | null> {
  const client = await getPool().connect();

  try {
    const headcountsResult = await client.query<PositionHeadcountRow>(
      `
        SELECT status, "applicantId"
        FROM "Headcount"
        WHERE "positionId" = $1
      `,
      [positionId]
    );

    if (headcountsResult.rows.length === 0) {
      return null;
    }

    const hasVacantHeadcount = headcountsResult.rows.some(
      (headcount) => headcount.status === 'vacant' || headcount.applicantId === null
    );

    if (hasVacantHeadcount) {
      return null;
    }

    const latestHiredResult = await client.query<{ date: Date | string }>(
      `
        SELECT tr.date
        FROM "TransitionRecord" tr
        JOIN "Applicant" c ON tr."applicant_id" = c.id
        WHERE tr."positionId" = $1
          AND tr.stage = 'Hired'
          AND c."positionId" = $1
        ORDER BY tr.date DESC
        LIMIT 1
      `,
      [positionId]
    );

    const latestHiredDate = latestHiredResult.rows[0]?.date;
    return latestHiredDate ? new Date(latestHiredDate) : null;
  } catch (error) {
    console.error('Error getting latest hired date for position:', error);
    return null;
  } finally {
    client.release();
  }
}

export async function getEarliestRequestDateForPosition(positionId: string): Promise<Date | null> {
  const client = await getPool().connect();

  try {
    const result = await client.query<{ earliest_request_date: Date | string | null }>(
      `
        SELECT MIN(h."requestDate") as earliest_request_date
        FROM "Headcount" h
        WHERE h."positionId" = $1
          AND h."requestDate" IS NOT NULL
      `,
      [positionId]
    );

    const earliestRequestDate = result.rows[0]?.earliest_request_date;
    return earliestRequestDate ? new Date(earliestRequestDate) : null;
  } catch (error) {
    console.error('Error getting earliest request date for position:', error);
    return null;
  } finally {
    client.release();
  }
}

export async function getHiredDateForHeadcount(headcount: Pick<Headcount, 'applicantId'>): Promise<Date | null> {
  if (!headcount.applicantId) {
    return null;
  }

  const client = await getPool().connect();

  try {
    const result = await client.query<{ date: Date | string }>(
      `
        SELECT tr.date
        FROM "TransitionRecord" tr
        WHERE tr."applicant_id" = $1
          AND tr.stage = 'Hired'
        ORDER BY tr.date DESC
        LIMIT 1
      `,
      [headcount.applicantId]
    );

    const hiredDate = result.rows[0]?.date;
    return hiredDate ? new Date(hiredDate) : null;
  } catch (error) {
    console.error('Error getting hired date for headcount:', error);
    return null;
  } finally {
    client.release();
  }
}
