export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { fetchAppKitSeedCollectionOrThrow } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { hasAnyPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import type { PlatformModuleId } from '@/lib/types';

const inputSchema = z.object({ environment: z.enum(['development', 'production']).default('production') });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Admin' && !hasAnyPermission(session.user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[])) {
    return NextResponse.json({ message: 'Insufficient HR manage permission' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const parsed = inputSchema.safeParse(body.ok ? body.value : {});
  if (!parsed.success) return NextResponse.json({ message: 'Invalid import options' }, { status: 400 });

  try {
    const records = await fetchAppKitSeedCollectionOrThrow<{
      name?: unknown; description?: unknown; isActive?: unknown;
    }>(parsed.data.environment, 'onboarding_templates');
    const templates = records.map(record => ({
      name: String(record.name || '').trim(),
      description: String(record.description || '').trim() || null,
      isActive: record.isActive !== false,
    })).filter(template => template.name);

    for (const template of templates) {
      await getPool().query(
        `INSERT INTO "hr_onboarding_templates" (id, name, description, is_active, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = NOW()`,
        [randomUUID(), template.name, template.description, template.isActive],
      );
    }
    return NextResponse.json({ count: templates.length, templates });
  } catch (error) {
    console.error('Failed to import onboarding templates from AppKit:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Onboarding template import failed' }, { status: 502 });
  }
}
