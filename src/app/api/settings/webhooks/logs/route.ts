export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import { auth } from '@/auth';

type WebhookLogsFilter = 'all' | 'success' | 'failed';

type WebhookLogWithWebhook = Prisma.WebhookLogGetPayload<{
  include: {
    webhook: {
      select: {
        id: true;
        name: true;
        url: true;
      };
    };
  };
}>;

function getPositiveIntegerParam(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getWebhookLogsFilter(value: string | null): WebhookLogsFilter {
  return value === 'success' || value === 'failed' ? value : 'all';
}

function buildWebhookLogsWhere(input: {
  filter: WebhookLogsFilter;
  search: string;
  webhookId: string;
}): Prisma.WebhookLogWhereInput {
  const where: Prisma.WebhookLogWhereInput = {};

  if (input.filter === 'success') {
    where.success = true;
  } else if (input.filter === 'failed') {
    where.success = false;
  }

  if (input.search) {
    where.OR = [
      { event_type: { contains: input.search, mode: 'insensitive' } },
      { response_body: { contains: input.search, mode: 'insensitive' } },
      { error_message: { contains: input.search, mode: 'insensitive' } },
      { webhook: { name: { contains: input.search, mode: 'insensitive' } } },
    ];
  }

  if (input.webhookId) {
    where.webhook_id = input.webhookId;
  }

  return where;
}

function formatWebhookLog(log: WebhookLogWithWebhook) {
  return {
    id: log.id,
    webhook_id: log.webhook_id,
    webhook_name: log.webhook?.name || 'Unknown',
    webhook_url: log.webhook?.url || '',
    event_type: log.event_type,
    success: log.success,
    response_status: log.response_status,
    response_message: log.response_body || log.error_message || null,
    duration_ms: log.duration_ms,
    created_at: log.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user, 'WEBHOOKS_VIEW') && !hasPermission(session.user, 'LOGS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view webhook logs' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = getPositiveIntegerParam(searchParams.get('page'), 1);
    const limit = getPositiveIntegerParam(searchParams.get('limit'), 50);
    const filter = getWebhookLogsFilter(searchParams.get('filter'));
    const search = searchParams.get('search') || '';
    const webhookId = searchParams.get('webhook_id') || '';

    const offset = (page - 1) * limit;
    const where = buildWebhookLogsWhere({ filter, search, webhookId });

    // Get total count
    const total = await prisma.webhookLog.count({ where });

    // Get logs with pagination
    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        webhook: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    });

    // Format logs for response
    const formattedLogs = logs.map(formatWebhookLog);

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
