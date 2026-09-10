export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  platformDefaultSettingSeeds,
  type PlatformDefaultSettingSeed,
} from '@/lib/appkit-load-seeds';
import { getAppKitSeedRecords } from '@/lib/appkit-sdk-client';

const platformDefaultKeySchema = z.enum([
  'appLogoDataUrl',
  'defaultMatchCriteria',
  'applicantEvaluationCriteriaPrompt',
]);

const importSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
  keys: z.array(platformDefaultKeySchema).min(1).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  const input = importSchema.parse(bodyResult.ok ? bodyResult.value : {});
  const appKitSeeds = await getAppKitSeedRecords<PlatformDefaultSettingSeed>(
    input.environment,
    'platform_default_settings',
    platformDefaultSettingSeeds,
  );
  const requestedKeys = input.keys ? new Set(input.keys) : null;
  const seeds = requestedKeys
    ? appKitSeeds.filter((setting) => requestedKeys.has(setting.key))
    : appKitSeeds;
  const imported = [];

  for (const setting of seeds) {
    const result = await getPool().query(`
      INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "updatedAt" = NOW()
      RETURNING key, value, "createdAt", "updatedAt"
    `, [setting.key, setting.value]);

    if (result.rows[0]) imported.push({
      ...result.rows[0],
      description: setting.description,
    });
  }

  return NextResponse.json({ settings: imported });
}
