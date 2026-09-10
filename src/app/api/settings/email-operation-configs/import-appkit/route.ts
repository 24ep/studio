export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { fetchAppKitSeedCollectionOrThrow } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { readRequestJsonResult } from '@/lib/request-json';

const inputSchema = z.object({ environment: z.enum(['development', 'production']).default('production') });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });

  const body = await readRequestJsonResult(request);
  const parsed = inputSchema.safeParse(body.ok ? body.value : {});
  if (!parsed.success) return NextResponse.json({ message: 'Invalid import options' }, { status: 400 });

  try {
    const records = await fetchAppKitSeedCollectionOrThrow<Record<string, unknown>>(
      parsed.data.environment,
      'email_operation_configs',
    );
    const configs: Array<Record<string, unknown>> = records
      .map(record => {
        const config = { ...record } as Record<string, unknown>;
        const appkitId = config.__appkitId;
        const appkitAppId = config.__appkitAppId;
        delete config.__appkitId;
        delete config.__appkitAppId;
        return { ...config, appkitId, appkitAppId } as Record<string, unknown>;
      })
      .filter(config => typeof config['operationKey'] === 'string' && config['operationKey'].trim());
    await getPool().query(
      `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
       VALUES ('emailOperationConfigs', $1, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      [JSON.stringify(configs)],
    );
    return NextResponse.json({ count: configs.length, configs });
  } catch (error) {
    console.error('Failed to import email operation configs from AppKit:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Email operation import failed' }, { status: 502 });
  }
}
