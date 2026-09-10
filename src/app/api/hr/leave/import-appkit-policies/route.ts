export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { fetchAppKitSeedCollectionOrThrow } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { hasAnyPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import type { PlatformModuleId } from '@/lib/types';

const inputSchema = z.object({ environment: z.enum(['development', 'production']).default('production') });

type AppKitLeavePolicy = {
  name?: unknown;
  leaveType?: unknown;
  annualAllowance?: unknown;
  requiresApproval?: unknown;
  isActive?: unknown;
  allowHalfDay?: unknown;
  allowHourly?: unknown;
  excludeWeekends?: unknown;
  excludeHolidays?: unknown;
  minimumNoticeDays?: unknown;
  accrualFrequency?: unknown;
  accrualRate?: unknown;
  encashmentEligible?: unknown;
  minimumRetainedBalance?: unknown;
  maximumEncashmentUnits?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  if (!hasAnyPermission(session.user, ['HR_WORKFORCE_MANAGE'] as PlatformModuleId[])) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR manage permission.' }, { status: 403 });
  }

  try {
    const body = await readRequestJsonResult(request);
    const { environment } = inputSchema.parse(body.ok ? body.value : {});
    const records = await fetchAppKitSeedCollectionOrThrow<AppKitLeavePolicy>(environment, 'leave_policies');
    const policies = records.map(normalizePolicy).filter((policy): policy is NonNullable<typeof policy> => policy !== null);

    for (const policy of policies) {
      await getPool().query(`
        INSERT INTO "hr_leave_policies" (
          id, name, leave_type, annual_allowance, requires_approval, is_active,
          allow_half_day, allow_hourly, exclude_weekends, exclude_holidays,
          minimum_notice_days, accrual_frequency, accrual_rate,
          encashment_eligible, minimum_retained_balance, maximum_encashment_units,
          created_at, updated_at
        ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          leave_type = EXCLUDED.leave_type,
          annual_allowance = EXCLUDED.annual_allowance,
          requires_approval = EXCLUDED.requires_approval,
          is_active = EXCLUDED.is_active,
          allow_half_day = EXCLUDED.allow_half_day,
          allow_hourly = EXCLUDED.allow_hourly,
          exclude_weekends = EXCLUDED.exclude_weekends,
          exclude_holidays = EXCLUDED.exclude_holidays,
          minimum_notice_days = EXCLUDED.minimum_notice_days,
          accrual_frequency = EXCLUDED.accrual_frequency,
          accrual_rate = EXCLUDED.accrual_rate,
          encashment_eligible = EXCLUDED.encashment_eligible,
          minimum_retained_balance = EXCLUDED.minimum_retained_balance,
          maximum_encashment_units = EXCLUDED.maximum_encashment_units,
          updated_at = NOW()
      `, [
        randomUUID(), policy.name, policy.leaveType, policy.annualAllowance,
        policy.requiresApproval, policy.isActive, policy.allowHalfDay, policy.allowHourly,
        policy.excludeWeekends, policy.excludeHolidays, policy.minimumNoticeDays,
        policy.accrualFrequency, policy.accrualRate, policy.encashmentEligible,
        policy.minimumRetainedBalance, policy.maximumEncashmentUnits,
      ]);
    }

    await logAudit('INFO', `Loaded ${policies.length} leave policies from AppKit (${environment})`, 'API:HR:LeavePolicies:ImportAppKit', session.user.id);
    return NextResponse.json({ count: policies.length, policies });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    console.error('Failed to import leave policies from AppKit:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to load leave policies from AppKit.' }, { status: 500 });
  }
}

function normalizePolicy(record: AppKitLeavePolicy) {
  const name = String(record.name || '').trim();
  const leaveType = String(record.leaveType || '').trim();
  if (!name || !['annual', 'sick', 'personal', 'maternity', 'unpaid', 'other'].includes(leaveType)) return null;
  const numberOrNull = (value: unknown) => value === null || value === undefined || value === '' ? null : Number(value);
  return {
    name,
    leaveType,
    annualAllowance: Number(record.annualAllowance || 0),
    requiresApproval: record.requiresApproval !== false,
    isActive: record.isActive !== false,
    allowHalfDay: record.allowHalfDay !== false,
    allowHourly: record.allowHourly === true,
    excludeWeekends: record.excludeWeekends !== false,
    excludeHolidays: record.excludeHolidays !== false,
    minimumNoticeDays: Number(record.minimumNoticeDays || 0),
    accrualFrequency: record.accrualFrequency === 'monthly' ? 'monthly' : 'annual',
    accrualRate: numberOrNull(record.accrualRate),
    encashmentEligible: record.encashmentEligible === true,
    minimumRetainedBalance: Number(record.minimumRetainedBalance || 0),
    maximumEncashmentUnits: numberOrNull(record.maximumEncashmentUnits),
  };
}
