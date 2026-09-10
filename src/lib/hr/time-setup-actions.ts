import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import { resolveShiftWindow } from './attendance-calculation';
import { getTimePolicyConfig, timezoneOffsetMinutesForDate } from './time-policy-config';
import type { TimeActionActor } from './time-owner-actions';

type SetupInput =
  | { action: 'create_roster_period'; name: string; startDate: string; endDate: string; location?: string | null }
  | { action: 'create_shift_definition'; code: string; name: string; startTime: string; endTime: string; workLocation?: string | null; breakMinutes: number; gracePeriodMinutes?: number | null }
  | { action: 'create_work_schedule'; name: string; weeklyHours: number; startTime: string; endTime: string; workLocation?: string | null }
  | { action: 'create_open_shift'; shiftDate: string; startTime: string; endTime: string; workLocation: string; headcountRequired: number; shiftDefinitionId?: string | null };

function requireManage(actor: TimeActionActor) {
  if (!actor.canManageWorkforce) throw new Error('FORBIDDEN');
}

export async function mutateTimeSetup(actor: TimeActionActor, input: SetupInput) {
  requireManage(actor);
  if (input.action === 'create_roster_period') {
    if (input.endDate < input.startDate) throw new Error('INVALID_DATE_RANGE');
    const id = randomUUID();
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO "hr_roster_periods"
        (id, name, company_id, location, start_date, end_date, status, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5::date, $6::date, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      id,
      input.name,
      actor.companyId,
      input.location || null,
      input.startDate,
      input.endDate,
    );
    return rows[0];
  }

  if (input.action === 'create_shift_definition') {
    const policy = await getTimePolicyConfig();
    const id = randomUUID();
    return prisma.$transaction(async tx => {
      const definitions = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO "hr_shift_definitions"
          (id, code, name, color_token, current_version, is_active, created_at, updated_at)
         VALUES ($1::uuid, upper($2), $3, 'indigo', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        id,
        input.code,
        input.name,
      );
      const [startHour, startMinute] = input.startTime.split(':').map(Number);
      const [endHour, endMinute] = input.endTime.split(':').map(Number);
      const overnight = endHour * 60 + endMinute <= startHour * 60 + startMinute;
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_shift_definition_versions"
          (id, shift_definition_id, version, start_time, end_time, overnight,
           break_rules, grace_period_minutes, early_departure_tolerance_minutes,
           check_in_window_minutes, check_out_window_minutes, minimum_rest_minutes,
           maximum_scheduled_minutes, overtime_eligible, work_location,
           applicable_employee_groups, effective_from, created_by_id, created_at)
         VALUES (gen_random_uuid(), $1::uuid, 1, $2, $3, $4, $5::jsonb, $6, $7,
                 60, 180, $8, 720, TRUE, $9, '[]'::jsonb, CURRENT_DATE, $10::uuid, CURRENT_TIMESTAMP)`,
        id,
        input.startTime,
        input.endTime,
        overnight,
        JSON.stringify([{ minutes: input.breakMinutes, paid: false }]),
        input.gracePeriodMinutes ?? policy.lateGraceMinutes,
        input.gracePeriodMinutes ?? policy.lateGraceMinutes,
        Math.round(policy.minimumShiftRestHours * 60),
        input.workLocation || null,
        actor.user.id,
      );
      return definitions[0];
    });
  }

  if (input.action === 'create_work_schedule') {
    const policy = await getTimePolicyConfig();
    const id = randomUUID();
    const dailyMinutes = Math.max(1, Math.round((input.weeklyHours * 60) / 5));
    return prisma.$transaction(async tx => {
      const schedules = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO "hr_work_schedules"
          (id, name, weekly_hours, timezone, is_active, schedule_type,
           expected_daily_minutes, effective_from, version, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4, TRUE, 'fixed', $5, CURRENT_DATE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        id,
        input.name,
        input.weeklyHours,
        policy.timezone,
        dailyMinutes,
      );
      for (let day = 1; day <= 7; day += 1) {
        const working = day <= 5;
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_work_schedule_days"
            (id, schedule_id, cycle_day, day_of_week, is_working_day,
             start_time, end_time, expected_minutes, break_rules, created_at, updated_at)
           VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, $8::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          id,
          day,
          day,
          working,
          working ? input.startTime : null,
          working ? input.endTime : null,
          working ? dailyMinutes : 0,
          JSON.stringify(working ? [{ minutes: 60, paid: false, workLocation: input.workLocation || null }] : []),
        );
      }
      return schedules[0];
    });
  }

  const policy = await getTimePolicyConfig();
  const offset = timezoneOffsetMinutesForDate(policy.timezone, input.shiftDate);
  const { start, end } = resolveShiftWindow(input.shiftDate, input.startTime, input.endTime, offset);
  return prisma.$transaction(async tx => {
    let periods = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "hr_roster_periods"
       WHERE $1::date BETWEEN start_date AND end_date
         AND ($2::uuid IS NULL OR company_id IS NULL OR company_id = $2::uuid)
         AND status NOT IN ('locked', 'archived')
       ORDER BY company_id NULLS LAST, start_date DESC LIMIT 1 FOR UPDATE`,
      input.shiftDate,
      actor.companyId,
    );
    if (!periods[0]) {
      const monday = new Date(`${input.shiftDate}T00:00:00.000Z`);
      const day = monday.getUTCDay() || 7;
      monday.setUTCDate(monday.getUTCDate() - day + 1);
      const sunday = new Date(monday);
      sunday.setUTCDate(sunday.getUTCDate() + 6);
      periods = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO "hr_roster_periods"
          (id, name, company_id, start_date, end_date, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2::uuid, $3::date, $4::date, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        `Roster · ${monday.toISOString().slice(0, 10)}`,
        actor.companyId,
        monday.toISOString().slice(0, 10),
        sunday.toISOString().slice(0, 10),
      );
    }
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO "hr_open_shifts"
        (id, roster_period_id, shift_definition_id, shift_date, start_at, end_at,
         work_location, required_skills, headcount_required, headcount_assigned,
         status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::date, $4, $5, $6,
               '[]'::jsonb, $7, 0, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      periods[0].id,
      input.shiftDefinitionId || null,
      input.shiftDate,
      start,
      end,
      input.workLocation,
      input.headcountRequired,
    );
    return rows[0];
  });
}
