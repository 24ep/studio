import { NextResponse, type NextRequest } from 'next/server';
import { requireHeadcountDetailSession } from './headcount-detail-auth';
import { handleHeadcountAction } from './headcount-detail-actions';
import { resolveHeadcountId } from './headcount-detail-request';
import { readRequestJsonResult } from '@/lib/request-json';
import type { HeadcountActionBody, HeadcountDetailRouteContext } from './headcount-detail-types';

export async function handlePatchHeadcount(request: NextRequest, context: HeadcountDetailRouteContext) {
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

    const body = bodyResult.value as HeadcountActionBody;
    return handleHeadcountAction(id, body, session.session.user);
  } catch (error) {
    console.error('Error in headcount action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
