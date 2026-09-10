import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_EXTERNAL_ACTION_ERROR, isDemoInstallation } from '@/lib/installation-environment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (await isDemoInstallation()) return NextResponse.json({ error: DEMO_EXTERNAL_ACTION_ERROR }, { status: 403 });

    const resolvedParams = await params;
    const webhookId = resolvedParams.id;
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    if (!webhook.is_active) {
      return NextResponse.json({ error: 'Webhook is not active' }, { status: 400 });
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from your recruitment system',
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        test_data: {
          applicant: {
            id: 'test-Applicant-id',
            name: 'Test Applicant',
            email: 'test@example.com'
          },
          position: {
            id: 'test-position-id',
            title: 'Test Position',
            department: 'Engineering'
          }
        }
      }
    };

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Recruitment-System-Webhook/1.0',
      'X-Webhook-ID': webhook.id,
      'X-Event-Type': 'webhook.test',
      'X-Timestamp': new Date().toISOString()
    };

    // Add custom headers
    if (webhook.headers) {
      Object.entries(webhook.headers).forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }

    // Add authentication headers
    if (webhook.auth_type === 'basic' && webhook.auth_username && webhook.auth_password) {
      const credentials = Buffer.from(`${webhook.auth_username}:${webhook.auth_password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (webhook.auth_type === 'bearer' && webhook.auth_token) {
      headers['Authorization'] = `Bearer ${webhook.auth_token}`;
    } else if (webhook.auth_type === 'header' && webhook.auth_header_name && webhook.auth_header_value) {
      headers[webhook.auth_header_name] = webhook.auth_header_value;
    }

    // Send webhook
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000);

      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: webhook.method !== 'GET' ? JSON.stringify(testPayload) : undefined,
        signal: controller.signal
      });

      // Clear timeout on successful response
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Log webhook attempt
      await prisma.webhookLog.create({
        data: {
          webhook_id: webhook.id,
          event_type: 'webhook.test',
          payload: testPayload,
          response_status: response.status,
          response_body: await response.text().catch(() => 'Unable to read response body'),
          success: response.ok,
          error_message: response.ok ? null : `HTTP ${response.status}`,
          duration_ms: 0 // Could be calculated if needed
        }
      });

      if (response.ok) {
        return NextResponse.json({ 
          message: 'Test webhook sent successfully',
          status: response.status,
          webhook_id: webhook.id
        });
      } else {
        return NextResponse.json({ 
          error: `Webhook failed with status ${response.status}`,
          status: response.status,
          webhook_id: webhook.id
        }, { status: 400 });
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed webhook attempt
      await prisma.webhookLog.create({
        data: {
          webhook_id: webhook.id,
          event_type: 'webhook.test',
          payload: testPayload,
          response_status: null,
          response_body: null,
          success: false,
          error_message: errorMessage,
          duration_ms: 0
        }
      });

      return NextResponse.json({ 
        error: `Failed to send webhook: ${errorMessage}`,
        webhook_id: webhook.id
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
