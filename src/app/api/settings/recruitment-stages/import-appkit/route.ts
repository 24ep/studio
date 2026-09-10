export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  recruitmentStageSeeds,
  type RecruitmentStageSeed,
} from '@/lib/appkit-load-seeds';
import { getAppKitSeedRecords } from '@/lib/appkit-sdk-client';
import {
  ensureRequiredRecruitmentStages,
  isRequiredRecruitmentStageName,
} from '@/lib/recruitment-stage-system';

const importSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  const input = importSchema.parse(bodyResult.ok ? bodyResult.value : {});
  const seeds = await getAppKitSeedRecords<RecruitmentStageSeed>(
    input.environment,
    'recruitment_stages',
    recruitmentStageSeeds,
  );
  const imported = [];
  await ensureRequiredRecruitmentStages();

  for (const stage of seeds) {
    if (isRequiredRecruitmentStageName(stage.name)) {
      continue;
    }

    const result = await getPool().query(`
      INSERT INTO "RecruitmentStage" (
        id, name, description, is_system, sort_order, color_complete, color_badge
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        is_system = EXCLUDED.is_system,
        sort_order = EXCLUDED.sort_order,
        color_complete = EXCLUDED.color_complete,
        color_badge = EXCLUDED.color_badge
      RETURNING id, name, description, is_system as "isSystem", sort_order as "sortOrder",
                color_complete, color_badge
    `, [
      stage.name,
      stage.description,
      false,
      stage.sortOrder,
      stage.colorComplete,
      stage.colorBadge,
    ]);

    if (result.rows[0]) imported.push(result.rows[0]);
  }

  return NextResponse.json({ stages: imported });
}
