import { NextResponse, type NextRequest } from 'next/server';
import { requireHeadcountDetailSession } from './headcount-detail-auth';
import { fetchHeadcountById } from './headcount-detail-data';
import { resolveHeadcountId } from './headcount-detail-request';
import type { HeadcountDetailRouteContext } from './headcount-detail-types';

export async function handleGetHeadcount(_request: NextRequest, context: HeadcountDetailRouteContext) {
  try {
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const id = await resolveHeadcountId(context);
    const headcount = await fetchHeadcountById(id);
    if (!headcount) {
      return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
    }

    return NextResponse.json(headcount);
  } catch (error) {
    console.error('Error fetching headcount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
