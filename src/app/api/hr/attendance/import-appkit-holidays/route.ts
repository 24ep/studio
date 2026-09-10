export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z, ZodError } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { hasAnyPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import type { PlatformModuleId } from '@/lib/types';

const appKitHolidayImportSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
  year: z.number().int().optional(),
});

type AppKitHolidayImportInput = z.infer<typeof appKitHolidayImportSchema>;

type HolidayImportRecord = {
  name: string;
  holidayDate: string;
  holiday_date?: string;
  location: string | null;
  isPaid: boolean;
  is_paid?: boolean;
};

type HolidayRow = {
  id: string;
  name: string;
  holidayDate: string;
  location: string | null;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  if (!hasAnyPermission(session.user, ['HR_WORKFORCE_MANAGE'] as PlatformModuleId[])) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR manage permission.' }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const input = appKitHolidayImportSchema.parse(bodyResult.ok ? bodyResult.value : {});
    const holidays = await importHolidaysFromAppKit(input);
    await logAudit('INFO', `Loaded holiday list from AppKit (${input.environment})`, 'API:HR:Holidays:ImportAppKit', session.user.id);
    return NextResponse.json({ holidays }, { status: 200 });
  } catch (error) {
    console.error('Failed to import holiday list from AppKit:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({
      message: 'Error importing holiday list from AppKit',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

async function importHolidaysFromAppKit(input: AppKitHolidayImportInput) {
  const productionHolidays: HolidayImportRecord[] = [
    {
      name: 'New Year Holiday',
      holidayDate: `${input.year || 2026}-01-01`,
      location: 'All locations',
      isPaid: true,
    },
  ];
  const appKitHolidays = await fetchAppKitSeedCollection<HolidayImportRecord>(input.environment, 'holiday_list');
  const holidays = appKitHolidays.length > 0
    ? appKitHolidays.map(normalizeHolidaySeed).filter((holiday) => holiday.name && holiday.holidayDate)
    : productionHolidays;
  const imported: HolidayRow[] = [];

  for (const holiday of holidays) {
    const existing = await getPool().query<{ id: string }>(`
      SELECT id
      FROM "hr_holidays"
      WHERE lower(name) = lower($1)
        AND holiday_date::date = $2::date
        AND COALESCE(location, '') = COALESCE($3, '')
      LIMIT 1
    `, [holiday.name, holiday.holidayDate, holiday.location]);

    const result = existing.rows[0]?.id
      ? await getPool().query<HolidayRow>(`
        UPDATE "hr_holidays"
        SET is_paid = $2, updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING id, name, holiday_date as "holidayDate", location, is_paid as "isPaid", created_at as "createdAt", updated_at as "updatedAt"
      `, [existing.rows[0].id, holiday.isPaid])
      : await getPool().query<HolidayRow>(`
        INSERT INTO "hr_holidays" (id, name, holiday_date, location, is_paid, created_at, updated_at)
        VALUES ($1::uuid, $2, $3::date, $4, $5, NOW(), NOW())
        RETURNING id, name, holiday_date as "holidayDate", location, is_paid as "isPaid", created_at as "createdAt", updated_at as "updatedAt"
      `, [randomUUID(), holiday.name, holiday.holidayDate, holiday.location, holiday.isPaid]);

    if (result.rows[0]) {
      imported.push(result.rows[0]);
    }
  }

  return imported;
}

function normalizeHolidaySeed(holiday: HolidayImportRecord): HolidayImportRecord {
  const holidayDate = String(holiday.holidayDate || holiday.holiday_date || '').slice(0, 10);
  return {
    name: String(holiday.name || '').trim(),
    holidayDate: isValidDateOnly(holidayDate) ? holidayDate : '',
    location: holiday.location ? String(holiday.location) : 'All locations',
    isPaid: (holiday.isPaid ?? holiday.is_paid) !== false,
  };
}

function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
