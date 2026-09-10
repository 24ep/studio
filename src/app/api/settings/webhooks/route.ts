export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { validateWebhookUrl } from '@/lib/webhookSecurity';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { serializeWebhookWithBodyConfigs } from './webhooks-route-serialization';
import { webhookSchema } from './webhooks-route-schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        body_configs: {
          where: { is_active: true },
          orderBy: { event_type: 'asc' }
        }
      }
    });

    return NextResponse.json(webhooks.map(serializeWebhookWithBodyConfigs));
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Check request body size to prevent DoS attacks
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const { securityConfig } = await import('@/lib/securityConfig');
      const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024; // 10MB
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return NextResponse.json({ 
          error: `Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
        }, { status: 413 });
      }
    }

    const bodyResult = await readRequestJsonResult(req);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = webhookSchema.safeParse(bodyResult.value);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = validation.data;
    
    // SECURITY: Validate webhook URL to prevent SSRF attacks
    const urlValidation = validateWebhookUrl(data.url);
    if (!urlValidation.valid) {
      return NextResponse.json({ 
        error: 'Invalid webhook URL', 
        details: urlValidation.error 
      }, { status: 400 });
    }
    const webhook = await prisma.webhook.create({
      data: {
        id: uuidv4(),
        name: data.name,
        url: data.url,
        events: data.events,
        method: data.method,
        is_active: data.is_active ?? true,
        auth_type: data.auth_type ?? 'none',
        auth_username: data.auth_username,
        auth_password: data.auth_password,
        auth_token: data.auth_token,
        auth_header_name: data.auth_header_name,
        auth_header_value: data.auth_header_value,
        headers: data.headers || {},
        retry_count: data.retry_count ?? 3,
        timeout: data.timeout ?? 30,
        // New body customization fields
        body_template: data.body_template,
        field_mappings: data.field_mappings,
        include_metadata: data.include_metadata ?? true,
        custom_payload: data.custom_payload ?? false,
      }
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
