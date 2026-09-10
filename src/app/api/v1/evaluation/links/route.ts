export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { canViewEvaluationLinks } from '@/lib/permissions';
import { NextRequest, NextResponse } from 'next/server';

import {
  buildEvaluationLinksWhereInput,
  getEvaluationLinksErrorPayload,
  getEvaluationLinksInclude,
  parseEvaluationLinksQueryParams,
  serializeEvaluationLinkItem,
} from './evaluation-links-route-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { canView, reason } = canViewEvaluationLinks(session.user);
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden', message: reason || 'Insufficient permissions' }, { status: 403 });
    }

    const query = parseEvaluationLinksQueryParams(new URL(request.url).searchParams);
    const where = buildEvaluationLinksWhereInput(query);

    const [total, items] = await Promise.all([
      prisma.applicantEvaluationLink.count({ where }),
      prisma.applicantEvaluationLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        include: getEvaluationLinksInclude(),
      }),
    ]);

    return NextResponse.json({
      total,
      limit: query.limit,
      offset: query.offset,
      data: items.map(serializeEvaluationLinkItem),
    });
  } catch (error) {
    return NextResponse.json(getEvaluationLinksErrorPayload(error), { status: 500 });
  }
}
