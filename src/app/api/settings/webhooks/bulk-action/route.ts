export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';
import { getJsonArray, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

function getWebhookIds(body: Awaited<ReturnType<typeof readRequestJsonObject>>) {
  const webhookIds = getJsonArray(body, 'webhook_ids');
  return webhookIds?.filter((id): id is string => typeof id === 'string');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const webhook_ids = getWebhookIds(body);
    const action = getJsonString(body, 'action');

    if (!webhook_ids || !Array.isArray(webhook_ids) || webhook_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid webhook IDs' }, { status: 400 });
    }

    if (!action || !['enable', 'disable', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let result;
    let message = '';

    switch (action) {
      case 'enable':
        result = await prisma.webhook.updateMany({
          where: { id: { in: webhook_ids } },
          data: { is_active: true }
        });
        message = `Enabled ${result.count} webhook${result.count !== 1 ? 's' : ''}`;
        break;

      case 'disable':
        result = await prisma.webhook.updateMany({
          where: { id: { in: webhook_ids } },
          data: { is_active: false }
        });
        message = `Disabled ${result.count} webhook${result.count !== 1 ? 's' : ''}`;
        break;

      case 'delete':
        // First delete associated logs
        await prisma.webhookLog.deleteMany({
          where: { webhook_id: { in: webhook_ids } }
        });
        
        // Then delete webhooks
        result = await prisma.webhook.deleteMany({
          where: { id: { in: webhook_ids } }
        });
        message = `Deleted ${result.count} webhook${result.count !== 1 ? 's' : ''}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message,
      count: result.count
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const webhook_ids = getWebhookIds(body);

    if (!webhook_ids || !Array.isArray(webhook_ids) || webhook_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid webhook IDs' }, { status: 400 });
    }

    // First delete associated logs
    await prisma.webhookLog.deleteMany({
      where: { webhook_id: { in: webhook_ids } }
    });
    
    // Then delete webhooks
    const result = await prisma.webhook.deleteMany({
      where: { id: { in: webhook_ids } }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} webhook${result.count !== 1 ? 's' : ''}`,
      count: result.count
    });
  } catch (error) {
    console.error('Error deleting webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
