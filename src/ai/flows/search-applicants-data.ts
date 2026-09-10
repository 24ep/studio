import { getPool } from '@/lib/db';
import type { Applicant, TransitionRecord } from '@/lib/types';

type SearchApplicantRow = Partial<Applicant> & {
  id: string;
  parsedData?: Applicant['parsedData'] | null;
  positionId?: string | null;
  positionTitle?: string | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
  transitionHistory?: TransitionRecord[] | null;
  customAttributes?: Applicant['customAttributes'] | null;
  fitScore?: number | null;
};

export async function getSearchSystemSetting(key: string): Promise<string | null> {
  const client = await getPool().connect();
  try {
    const res = await client.query('SELECT value FROM "SystemSetting" WHERE key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].value : null;
  } finally {
    client.release();
  }
}

export async function fetchSearchApplicants(): Promise<Applicant[]> {
  const applicantsResult = await getPool().query(`
      SELECT
          c.*,
          p.title as "positionTitle",
          rec.name as "recruiterName", rec."avatarUrl" as "recruiterAvatarUrl",
          COALESCE(th_data.history, '[]'::json) as "transitionHistory"
      FROM "Applicant" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', th.id, 'date', th.date, 'stage', th.stage, 'notes', th.notes
          ) ORDER BY th.date DESC
        ) AS history
        FROM "TransitionRecord" th
        WHERE th."applicant_id" = c.id
      ) AS th_data ON true
  `);

  const rows = applicantsResult.rows as SearchApplicantRow[];

  return rows.map(row => ({
    ...row,
    parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
    position: row.positionId ? { id: row.positionId, title: row.positionTitle } : null,
    recruiter: row.recruiterId ? {
      id: row.recruiterId,
      name: row.recruiterName,
      avatarUrl: row.recruiterAvatarUrl || null,
      email: null,
    } : null,
    transitionHistory: (row.transitionHistory || []) as TransitionRecord[],
    customAttributes: row.customAttributes || {},
    fitScore: row.fitScore || 0,
  })) as Applicant[];
}
