import { NextResponse, type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { validateUuid } from '@/lib/security';
import { logAudit } from '@/lib/auditLog';
import { dispatchWebhooks } from '@/lib/webhookDispatcher';
import { broadcastPositionDeleted, broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } from '@/lib/simple-broadcaster';
import { getPositionActor } from './position-detail-auth';
import { connectPositionDb, getPositionStatistics, type PositionDetailRow } from './position-detail-data';
import { type PositionRouteContext } from './position-detail-schema';

type PositionApplicantCountRow = QueryResultRow & {
  applicantCount: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function publishPositionDeleted(id: string, position: PositionDetailRow, actingUserId: string): Promise<void> {
  try {
    await dispatchWebhooks.positionDeleted({
      ...position,
      custom_attributes: position.customAttributes || {},
    });
  } catch (webhookError) {
    console.error('Failed to dispatch position deletion webhook:', webhookError);
  }

  broadcastPositionDeleted(id, actingUserId);
  broadcastPositionListUpdated();
  broadcastPositionStatisticsUpdated(await getPositionStatistics());
}

export async function handleDeletePosition(_request: NextRequest, { params }: PositionRouteContext) {
  const actor = await getPositionActor();
  if (!actor.actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in positions DELETE request:', id);
    return NextResponse.json({ message: 'Invalid position ID format' }, { status: 400 });
  }

  const client = await connectPositionDb();
  if (client instanceof NextResponse) {
    return client;
  }

  try {
    await client.query('BEGIN');

    const currentPosition = await client.query<PositionDetailRow>('SELECT * FROM "Position" WHERE id = $1', [id]);
    if (currentPosition.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    const applicantCountResult = await client.query<PositionApplicantCountRow>(
      'SELECT p.id, p.title, COUNT(c.id) as "applicantCount" FROM "Position" p LEFT JOIN "Applicant" c ON p.id = c."positionId" WHERE p.id = $1 GROUP BY p.id, p.title;',
      [id]
    );
    const applicantCount = parseInt(applicantCountResult.rows[0]?.applicantCount || '0', 10);

    if (applicantCount > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({
        message: `Cannot delete position. It has ${applicantCount} associated Applicant(s).`,
      }, { status: 409 });
    }

    const deleteResult = await client.query('DELETE FROM "Position" WHERE id = $1', [id]);
    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `Position '${currentPosition.rows[0].title}' deleted by ${actor.actingUserName}.`, 'API:Positions:Delete', actor.actingUserId, { positionId: id });
    await publishPositionDeleted(id, currentPosition.rows[0], actor.actingUserId);

    return NextResponse.json({ message: 'Position deleted successfully' });
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Positions API] Error during rollback:', rollbackError);
    }

    const errorMessage = getErrorMessage(error);
    await logAudit('ERROR', `Failed to delete position. Error: ${errorMessage}`, 'API:Positions:Delete', actor.actingUserId, { positionId: id });
    return NextResponse.json({ message: 'Error deleting position', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
