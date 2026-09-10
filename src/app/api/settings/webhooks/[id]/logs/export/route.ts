import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type WebhookLogExportRow = {
  event_type: string;
  success: boolean;
  response_status: number | null;
  error_message: string | null;
  duration_ms: number | null;
  createdAt: Date;
  payload: Prisma.JsonValue | null;
  response_body: string | null;
};

function formatCsvCell(cell: unknown): string {
  const value = typeof cell === 'object' && cell !== null ? JSON.stringify(cell) : String(cell ?? '');
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
      select: { name: true }
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get all logs for this webhook
    const logs = await prisma.webhookLog.findMany({
      where: { webhook_id: id },
      orderBy: { createdAt: 'desc' },
      select: {
        event_type: true,
        success: true,
        response_status: true,
        error_message: true,
        duration_ms: true,
        createdAt: true,
        payload: true,
        response_body: true
      }
    });

    // Generate CSV content
    const csvHeaders = [
      'Date',
      'Event Type',
      'Status',
      'Response Status',
      'Duration (ms)',
      'Error Message',
      'Payload',
      'Response Body'
    ];

    const csvRows = logs.map((log: WebhookLogExportRow) => [
      log.createdAt.toISOString(),
      log.event_type,
      log.success ? 'Success' : 'Failed',
      log.response_status,
      log.duration_ms,
      log.error_message || '',
      log.payload || '',
      log.response_body || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map(formatCsvCell).join(','))
    ].join('\n');

    // Create response with CSV headers
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="webhook-logs-${webhook.name}-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    console.error('Error exporting webhook logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
