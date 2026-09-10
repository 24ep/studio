export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { platformSetupFeatureIds } from '@/lib/admin-platform-setup';
import {
  gradeSeeds,
  platformDefaultSettingSeeds,
  positionLevelSeeds,
  recruitmentStageSeeds,
} from '@/lib/appkit-load-seeds';
import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import { appKitCollectionByFeature, summarizeAppKitRecords } from '@/lib/appkit-setup-preview';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

const previewSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
  featureIds: z.array(z.enum(platformSetupFeatureIds)).min(1).max(platformSetupFeatureIds.length),
});

const fallbackRecords = {
  'platform-defaults': platformDefaultSettingSeeds,
  'recruitment-stages': recruitmentStageSeeds,
  'position-levels': positionLevelSeeds,
  grades: gradeSeeds,
} satisfies Partial<Record<(typeof platformSetupFeatureIds)[number], Array<Record<string, unknown>>>>;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const parsed = previewSchema.safeParse(body.ok ? body.value : {});
  if (!parsed.success) return NextResponse.json({ message: 'Invalid preview request' }, { status: 400 });

  const groups = await Promise.all(parsed.data.featureIds.map(async featureId => {
    const collection = appKitCollectionByFeature[featureId];
    if (!collection) return summarizeAppKitRecords(featureId, []);
    const appKitRecords = await fetchAppKitSeedCollection<Record<string, unknown>>(
      parsed.data.environment,
      collection,
    );
    const records = appKitRecords.length > 0
      ? appKitRecords
      : fallbackRecords[featureId as keyof typeof fallbackRecords] || [];
    return summarizeAppKitRecords(featureId, records);
  }));

  return NextResponse.json({ environment: parsed.data.environment, groups });
}
