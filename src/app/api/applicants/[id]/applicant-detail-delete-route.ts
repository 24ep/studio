import { auth } from '@/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { broadcastApplicantDeleted } from '@/lib/simple-broadcaster';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const result = await client.query('DELETE FROM "Applicant" WHERE id = $1::uuid RETURNING name', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    const applicantName = result.rows[0].name;
    await client.query('COMMIT');
    await logAudit(
      'AUDIT',
      `Applicant '${applicantName}' deleted by ${actingUserName}.`,
      'API:Applicants:Delete',
      actingUserId,
      { applicantId: id }
    );
    broadcastApplicantDeleted(id, actingUserId);

    return NextResponse.json({ message: 'Applicant deleted successfully' });
  } catch (error) {
    const caughtError = error as Error;
    await client.query('ROLLBACK');
    await logAudit(
      'ERROR',
      `Failed to delete Applicant. Error: ${caughtError.message}`,
      'API:Applicants:Delete',
      actingUserId,
      { applicantId: id }
    );
    return NextResponse.json(
      { message: 'Error deleting Applicant', error: caughtError.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
