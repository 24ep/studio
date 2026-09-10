import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import type { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'WEBHOOKS_VIEW') && !hasPermission(session.user, 'LOGS_VIEW')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view webhook logs' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: Prisma.WebhookLogWhereInput = {
      webhook_id: id,
    };

    if (filter === 'success') {
      where.success = true;
    } else if (filter === 'failed') {
      where.success = false;
    }

    if (search) {
      where.OR = [
        { event_type: { contains: search, mode: 'insensitive' } },
        { error_message: { contains: search, mode: 'insensitive' } },
        { response_body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.webhookLog.count({ where });

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        event_type: true,
        payload: true,
        response_status: true,
        response_body: true,
        success: true,
        error_message: true,
        duration_ms: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
