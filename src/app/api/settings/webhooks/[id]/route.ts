import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validateWebhookUrl } from '@/lib/webhookSecurity';
import { readRequestJsonResult } from '@/lib/request-json';
import type { Prisma } from '@prisma/client';

const jsonValueSchema = z.custom<Prisma.InputJsonValue>();

const fieldMappingSchema = z.object({
  source_field: z.string(),
  target_field: z.string(),
  transform: z.enum(['uppercase', 'lowercase', 'trim', 'date', 'number', 'boolean']).optional(),
  default_value: jsonValueSchema.optional(),
});

const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
  is_active: z.boolean().optional(),
  auth_type: z.enum(['none', 'basic', 'bearer', 'header']).optional(),
  auth_username: z.string().optional(),
  auth_password: z.string().optional(),
  auth_token: z.string().optional(),
  auth_header_name: z.string().optional(),
  auth_header_value: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retry_count: z.number().min(0).max(10).optional(),
  timeout: z.number().min(5).max(300).optional(),
  // New body customization fields
  body_template: z.string().optional(),
  field_mappings: z.array(fieldMappingSchema).optional(),
  include_metadata: z.boolean().optional(),
  custom_payload: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const webhook = await prisma.webhook.findUnique({ 
      where: { id: id },
      include: {
        body_configs: {
          where: { is_active: true },
          orderBy: { event_type: 'asc' }
        }
      }
    });
    
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Sanitize webhook data
    const sanitizedWebhook = {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      method: webhook.method,
      is_active: webhook.is_active,
      auth_type: webhook.auth_type,
      auth_username: webhook.auth_username,
      auth_password: webhook.auth_password,
      auth_token: webhook.auth_token,
      auth_header_name: webhook.auth_header_name,
      auth_header_value: webhook.auth_header_value,
      headers: webhook.headers,
      retry_count: webhook.retry_count,
      timeout: webhook.timeout,
      // New body customization fields
      body_template: webhook.body_template,
      field_mappings: webhook.field_mappings,
      include_metadata: webhook.include_metadata,
      custom_payload: webhook.custom_payload,
      body_configs: webhook.body_configs.map((config) => ({
        id: config.id,
        event_type: config.event_type,
        body_template: config.body_template,
        field_mappings: config.field_mappings,
        is_active: config.is_active,
        created_at: config.created_at,
        updated_at: config.updated_at
      })),
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt
    };

    return NextResponse.json(sanitizedWebhook);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
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
    const validation = webhookSchema.partial().safeParse(bodyResult.value);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const data = validation.data;
    
    // SECURITY: Validate webhook URL if provided to prevent SSRF attacks
    if (data.url) {
      const urlValidation = validateWebhookUrl(data.url);
      if (!urlValidation.valid) {
        return NextResponse.json({ 
          error: 'Invalid webhook URL', 
          details: urlValidation.error 
        }, { status: 400 });
      }
    }
    const webhook = await prisma.webhook.update({
      where: { id: id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    // Delete associated logs and body configs first
    await prisma.webhookLog.deleteMany({ where: { webhook_id: id } });
    await prisma.webhookBodyConfig.deleteMany({ where: { webhook_id: id } });
    await prisma.webhook.delete({ where: { id: id } });
    return NextResponse.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
