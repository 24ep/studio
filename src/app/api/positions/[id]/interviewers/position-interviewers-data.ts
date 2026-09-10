import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

type DbClient = {
  query: <T extends QueryResultRow = QueryResultRow>(
    query: string,
    values?: unknown[]
  ) => Promise<{ rows: T[]; rowCount?: number | null }>;
  release: () => void;
};

type PositionInterviewerPositionRow = QueryResultRow & {
  id: string;
  title: string;
};

type PositionInterviewerUserRow = QueryResultRow & {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  avatarUrl?: string | null;
};

type PositionInterviewerRow = QueryResultRow & {
  id: string;
  userId: string;
  createdAt: Date | string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  avatarUrl: string | null;
  positionTitle: string | null;
};

type InsertedPositionInterviewerRow = QueryResultRow & {
  id: string;
  createdAt: Date | string;
};

export type AddPositionInterviewerInput = {
  positionId: string;
  userId: string;
  actingUserId: string;
};

export async function fetchPositionInterviewers(positionId: string) {
  const client = await getPool().connect() as DbClient;

  try {
    const positionResult = await client.query<PositionInterviewerPositionRow>('SELECT id, title FROM "Position" WHERE id = $1', [positionId]);
    if (positionResult.rows.length === 0) {
      return { status: 'position-not-found' as const };
    }

    const result = await client.query<PositionInterviewerRow>(`
      SELECT 
        pi.id,
        pi."userId",
        pi."createdAt",
        u.name as "userName",
        u.email as "userEmail",
        u.role as "userRole",
        u."avatarUrl" as "avatarUrl",
        u."position_title" as "positionTitle"
      FROM "PositionInterviewer" pi
      JOIN "User" u ON pi."userId" = u.id
      WHERE pi."positionId" = $1
      ORDER BY pi."createdAt" DESC
    `, [positionId]);

    return { status: 'ok' as const, interviewers: result.rows };
  } finally {
    client.release();
  }
}

export async function addPositionInterviewer(input: AddPositionInterviewerInput) {
  const client = await getPool().connect() as DbClient;
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const actingUserResult = await client.query<QueryResultRow>('SELECT id FROM "User" WHERE id = $1', [input.actingUserId]);
    if (actingUserResult.rows.length === 0) {
      await client.query('ROLLBACK').catch(() => {});
      transactionStarted = false;
      return { status: 'invalid-acting-user' as const };
    }

    const positionResult = await client.query<PositionInterviewerPositionRow>('SELECT id, title FROM "Position" WHERE id = $1', [input.positionId]);
    if (positionResult.rows.length === 0) {
      await client.query('ROLLBACK').catch(() => {});
      transactionStarted = false;
      return { status: 'position-not-found' as const };
    }

    const userResult = await client.query<PositionInterviewerUserRow>('SELECT id, name, email, role, "avatarUrl" FROM "User" WHERE id = $1', [input.userId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK').catch(() => {});
      transactionStarted = false;
      return { status: 'user-not-found' as const };
    }

    const existingResult = await client.query<QueryResultRow>(
      'SELECT id FROM "PositionInterviewer" WHERE "positionId" = $1 AND "userId" = $2',
      [input.positionId, input.userId]
    );
    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK').catch(() => {});
      transactionStarted = false;
      return { status: 'duplicate' as const };
    }

    const insertResult = await client.query<InsertedPositionInterviewerRow>(`
      INSERT INTO "PositionInterviewer" (id, "positionId", "userId", "createdBy")
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id, "createdAt"
    `, [input.positionId, input.userId, input.actingUserId]);

    await client.query('COMMIT');
    transactionStarted = false;

    return {
      status: 'added' as const,
      position: positionResult.rows[0],
      user: userResult.rows[0],
      interviewer: {
        id: insertResult.rows[0].id,
        userId: input.userId,
        userName: userResult.rows[0].name,
        userEmail: userResult.rows[0].email,
        userRole: userResult.rows[0].role,
        avatarUrl: userResult.rows[0].avatarUrl,
        createdAt: insertResult.rows[0].createdAt,
      },
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Position Interviewers API] Error during rollback:', rollbackError);
      }
    }
    throw error;
  } finally {
    try {
      client.release();
    } catch (releaseError) {
      console.error('[Position Interviewers API] Error releasing client:', releaseError);
    }
  }
}
