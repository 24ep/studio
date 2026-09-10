import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { QueryResultRow } from 'pg';
import { auth } from '@/auth';
import { getPool, type DbClient } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import { validateUuid } from '@/lib/security';

type PositionIdentityRow = QueryResultRow & {
  id: string;
  title?: string;
};

type PositionApplicantsSession = Session & {
  user: Session['user'] & {
    id: string;
    role?: string | null;
  };
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function authorizePositionApplicantsRequest(positionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!positionId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Position ID is required' }, { status: 400 }),
    };
  }

  if (!validateUuid(positionId)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, session };
}

export async function connectPositionApplicantsDb() {
  try {
    return await getPool().connect();
  } catch (connectionError: unknown) {
    console.error('[Position Applicants API] Failed to connect to database:', connectionError);
    return NextResponse.json({
      message: 'Database connection error',
      error: getErrorMessage(connectionError),
    }, { status: 500 });
  }
}

export async function verifyPositionApplicantsAccess(client: DbClient, positionId: string, session: PositionApplicantsSession) {
  const positionCheck = await client.query<PositionIdentityRow>('SELECT id, title FROM "Position" WHERE id = $1', [positionId]);
  if (positionCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  if (session.user.role !== 'Hiring Manager') {
    return null;
  }

  if (hasPermission(session.user, 'APPLICANTS_VIEW_ALL')) {
    return null;
  }

  const restrictSetting = await getSystemSetting('hiringManagerRestrictToAssignedPositions');
  if (restrictSetting === 'false') {
    return null;
  }

  const interviewerCheck = await client.query<PositionIdentityRow>(
    'SELECT id FROM "PositionInterviewer" WHERE "positionId" = $1 AND "userId" = $2',
    [positionId, session.user.id]
  );

  if (interviewerCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Forbidden: You are not assigned as an interviewer for this position' }, { status: 403 });
  }

  return null;
}
