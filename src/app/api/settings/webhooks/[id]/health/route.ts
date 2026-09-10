import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { readRequestJsonObject } from '@/lib/request-json';
import { DEMO_EXTERNAL_ACTION_ERROR, isDemoInstallation } from '@/lib/installation-environment';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

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

    const { id } = await params;
    const body = await readRequestJsonObject(request);
    const testPayload = 'testPayload' in body
      ? body.testPayload
      : { test: true, timestamp: new Date().toISOString() };

    // Get webhook details
    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const startTime = Date.now();
    let success = false;
    let status: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let responseHeaders: Record<string, string> = {};

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Recruitment-System-Webhook-Health-Check/1.0',
        'X-Webhook-ID': webhook.id,
        'X-Event-Type': 'health_check',
        'X-Timestamp': new Date().toISOString()
      };

      // Add custom headers
      if (isRecord(webhook.headers)) {
        Object.entries(webhook.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          }
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

      // Send test request
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        timeoutId = setTimeout(() => controller.abort(), (webhook.timeout || 30) * 1000);

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
        
        status = response.status;
        success = response.ok;
        responseBody = await response.text().catch(() => 'Unable to read response body');

        // Capture response headers
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    const duration = Date.now() - startTime;

    // Log the health check
    await prisma.webhookLog.create({
      data: {
        webhook_id: webhook.id,
        event_type: 'health_check',
        payload: toJsonInput(testPayload),
        response_status: status,
        response_body: responseBody,
        success,
        error_message: errorMessage,
        duration_ms: duration
      }
    });

    // Get recent health statistics
    const recentLogs = await prisma.webhookLog.findMany({
      where: {
        webhook_id: webhook.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const totalAttempts = recentLogs.length;
    const successfulAttempts = recentLogs.filter((log) => log.success).length;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    const avgResponseTime = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.duration_ms ?? 0), 0) / recentLogs.length
      : 0;

    return NextResponse.json({
      webhook_id: webhook.id,
      webhook_name: webhook.name,
      url: webhook.url,
      health_check: {
        success,
        status,
        duration_ms: duration,
        error_message: errorMessage,
        response_headers: responseHeaders,
        response_body: responseBody?.substring(0, 1000) // Limit response body size
      },
      statistics: {
        total_attempts_24h: totalAttempts,
        successful_attempts_24h: successfulAttempts,
        success_rate_24h: successRate,
        avg_response_time_24h: avgResponseTime
      },
      configuration: {
        method: webhook.method,
        timeout: webhook.timeout,
        retry_count: webhook.retry_count,
        auth_type: webhook.auth_type,
        is_active: webhook.is_active,
        events: webhook.events
      }
    });
  } catch (error) {
    console.error('Error performing webhook health check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
