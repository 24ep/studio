import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { WebhookService } from '@/lib/webhookService';
import type { ProcessedWebhookPayload } from '@/lib/webhook/webhook-body-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getReplayablePayload(payload: Prisma.JsonValue): ProcessedWebhookPayload | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record.event !== 'string'
    || typeof record.timestamp !== 'string'
    || !Object.prototype.hasOwnProperty.call(record, 'data')
  ) {
    return null;
  }

  return record as unknown as ProcessedWebhookPayload;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'WEBHOOKS_EDIT')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to replay webhook deliveries' },
        { status: 403 }
      );
    }

    const { id, logId } = await params;
    const log = await prisma.webhookLog.findFirst({
      where: {
        id: logId,
        webhook_id: id,
      },
      include: {
        webhook: true,
      },
    });

    if (!log || !log.webhook) {
      return NextResponse.json({ error: 'Webhook delivery log not found' }, { status: 404 });
    }

    if (log.success) {
      return NextResponse.json(
        { error: 'Only failed webhook deliveries can be replayed' },
        { status: 409 }
      );
    }

    if (!log.webhook.is_active) {
      return NextResponse.json(
        { error: 'Webhook is inactive. Enable it before replaying this delivery.' },
        { status: 409 }
      );
    }

    const replayPayload = getReplayablePayload(log.payload);
    if (!replayPayload) {
      return NextResponse.json(
        { error: 'The original webhook payload cannot be replayed safely' },
        { status: 422 }
      );
    }

    const result = await WebhookService.replayWebhook(log.webhook, replayPayload);

    return NextResponse.json(
      {
        replayed: true,
        success: result.success,
        status: result.status ?? null,
        error: result.error ?? null,
        duration_ms: result.duration_ms,
      },
      { status: result.success ? 200 : 502 }
    );
  } catch (error) {
    console.error('Error replaying webhook delivery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
