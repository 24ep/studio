export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  gradeSeeds,
  type GradeSeed,
} from '@/lib/appkit-load-seeds';
import { getAppKitSeedRecords } from '@/lib/appkit-sdk-client';

const importSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
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
  const seeds = await getAppKitSeedRecords<GradeSeed>(
    input.environment,
    'position_grades',
    gradeSeeds,
  );
  const imported = [];

  for (const grade of seeds) {
    const result = await getPool().query(`
      INSERT INTO "Grade" (
        id, name, label, description, min_level, max_level, sla_days, color, is_active, sort_order, "createdAt", "updatedAt"
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        min_level = EXCLUDED.min_level,
        max_level = EXCLUDED.max_level,
        sla_days = EXCLUDED.sla_days,
        color = EXCLUDED.color,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        "updatedAt" = NOW()
      RETURNING id, name, label, description, min_level as "minLevel", max_level as "maxLevel",
                sla_days as "slaDays", color, is_active as "isActive", sort_order as "sortOrder",
                "createdAt", "updatedAt"
    `, [
      grade.name,
      grade.label,
      grade.description,
      grade.minLevel,
      grade.maxLevel,
      grade.slaDays,
      grade.color,
      grade.isActive,
      grade.sortOrder,
    ]);

    if (result.rows[0]) imported.push(result.rows[0]);
  }

  return NextResponse.json({ grades: imported });
}
