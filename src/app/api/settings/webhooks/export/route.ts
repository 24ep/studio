export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';

type ExportWebhookRow = Prisma.WebhookGetPayload<{
  select: {
    id: true;
    name: true;
    url: true;
    method: true;
    events: true;
    headers: true;
    auth_type: true;
    auth_username: true;
    auth_password: true;
    auth_token: true;
    auth_header_name: true;
    auth_header_value: true;
    timeout: true;
    retry_count: true;
    is_active: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all webhooks with their configurations
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        method: true,
        events: true,
        headers: true,
        auth_type: true,
        auth_username: true,
        auth_password: true,
        auth_token: true,
        auth_header_name: true,
        auth_header_value: true,
        timeout: true,
        retry_count: true,
        is_active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Create export data
    const exportData = {
      export_date: new Date().toISOString(),
      version: '1.0',
      webhooks: webhooks.map((webhook: ExportWebhookRow) => ({
        ...webhook,
        // Remove sensitive data for export
        auth_password: undefined,
        auth_token: undefined,
        auth_header_value: undefined
      }))
    };

    // Create response with JSON headers
    const response = new NextResponse(JSON.stringify(exportData, null, 2));
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Content-Disposition', `attachment; filename="webhooks-export-${new Date().toISOString().split('T')[0]}.json"`);

    return response;
  } catch (error) {
    console.error('Error exporting webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
