import { NextResponse, type NextRequest } from 'next/server';
import { requireHeadcountDetailSession } from './headcount-detail-auth';
import { fetchExistingHeadcount, updateHeadcount } from './headcount-detail-data';
import {
  broadcastHeadcountDetailChanges,
  runHeadcountPositionAutomation,
} from './headcount-detail-effects';
import { resolveHeadcountId } from './headcount-detail-request';
import { readRequestJsonResult } from '@/lib/request-json';
import type { HeadcountDetailRouteContext, HeadcountUpdateBody } from './headcount-detail-types';
import { validateHeadcountUpdateBody } from './headcount-detail-validation';

export async function handleUpdateHeadcount(request: NextRequest, context: HeadcountDetailRouteContext) {
  try {
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const id = await resolveHeadcountId(context);
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value as HeadcountUpdateBody;
    const existingHeadcount = await fetchExistingHeadcount(id);
    if (!existingHeadcount) {
      return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
    }

    const validationError = await validateHeadcountUpdateBody(body);
    if (validationError) {
      return validationError;
    }

    const headcount = await updateHeadcount(id, body);
    const { autoCloseResult } = await runHeadcountPositionAutomation(
      headcount.positionId,
      session.session.user
    );
    await broadcastHeadcountDetailChanges();

    return NextResponse.json({ headcount, autoCloseResult });
  } catch (error) {
    console.error('Error updating headcount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
