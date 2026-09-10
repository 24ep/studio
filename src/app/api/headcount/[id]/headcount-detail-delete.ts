import { NextResponse, type NextRequest } from 'next/server';
import { requireHeadcountDetailSession } from './headcount-detail-auth';
import { deleteHeadcount, fetchExistingHeadcount } from './headcount-detail-data';
import {
  broadcastHeadcountDetailChanges,
  runHeadcountPositionAutomation,
} from './headcount-detail-effects';
import { resolveHeadcountId } from './headcount-detail-request';
import type { HeadcountDetailRouteContext } from './headcount-detail-types';

export async function handleDeleteHeadcount(_request: NextRequest, context: HeadcountDetailRouteContext) {
  try {
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const id = await resolveHeadcountId(context);
    const existingHeadcount = await fetchExistingHeadcount(id);
    if (!existingHeadcount) {
      return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
    }

    await deleteHeadcount(id);
    const { autoCloseResult } = await runHeadcountPositionAutomation(
      existingHeadcount.positionId,
      session.session.user
    );
    await broadcastHeadcountDetailChanges();

    return NextResponse.json({
      message: 'Headcount deleted successfully',
      autoCloseResult,
    });
  } catch (error) {
    console.error('Error deleting headcount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
