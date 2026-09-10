import type { InstallationEnvironmentInput } from '@/lib/platform-installation';
import prisma from '@/lib/prisma';
import { seedHrDemoData } from '../../prisma/seed-hr';
import { seedShiftAttendanceDemoData } from '../../prisma/seed-shift-attendance';
import { seedEssDemoData } from '../../prisma/seed-ess';
import { seedLeaveDemoData } from '../../prisma/seed-leaves';
import { seedPerformanceDemoData } from '../../prisma/seed-performance';
import { seedAppraisalDemoData } from '../../prisma/seed-appraisal';
import { seedPayrollDemoData } from '../../prisma/seed-payroll';
import { seedAllDemoModules } from '@/lib/demo-module-seeds';

const DEMO_DATA_SEED_VERSION = '2';

export async function initializeInstallationEnvironment(
  input: Extract<InstallationEnvironmentInput, { environment: 'demo' }>,
  requestedById: string,
  onProgress: (progress: number, stage: string) => Promise<void> = async () => undefined,
) {
  await onProgress(5, 'Checking existing demo data');

  const [existing, existingVersion] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: 'demoDataInitializedAt' } }),
    prisma.systemSetting.findUnique({ where: { key: 'demoDataSeedVersion' } }),
  ]);
  if (existing?.value && existingVersion?.value === DEMO_DATA_SEED_VERSION) {
    const [employeeCount, attendanceRecords] = await Promise.all([
      prisma.employee.count({ where: { email: { endsWith: '@demo.hrive.local' } } }),
      prisma.attendanceRecord.count({ where: { source: 'demo-installation' } }),
    ]);
    const configuredAt = new Date().toISOString();
    await prisma.$transaction([
      prisma.systemSetting.upsert({ where: { key: 'installationEnvironment' }, update: { value: 'demo' }, create: { key: 'installationEnvironment', value: 'demo' } }),
      prisma.systemSetting.upsert({ where: { key: 'installationEnvironmentConfiguredAt' }, update: { value: configuredAt }, create: { key: 'installationEnvironmentConfiguredAt', value: configuredAt } }),
    ]);
    return { environment: 'demo' as const, employeeCount, attendanceRecords, alreadyInitialized: true };
  }

  const lockValue = new Date().toISOString();
  const acquired = await prisma.$queryRawUnsafe<Array<{ key: string }>>(`
    INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
    VALUES ('demoDataInitializationLock', $1, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
    WHERE "SystemSetting".value IS NULL
       OR "SystemSetting".value::timestamptz < NOW() - INTERVAL '30 minutes'
    RETURNING key
  `, lockValue);
  if (!acquired.length) throw new Error('Demo data initialization is already in progress.');

  try {
    return await initializeDemoData(input, requestedById, onProgress);
  } finally {
    await prisma.systemSetting.deleteMany({ where: { key: 'demoDataInitializationLock', value: lockValue } });
  }
}

async function initializeDemoData(
  input: Extract<InstallationEnvironmentInput, { environment: 'demo' }>,
  requestedById: string,
  onProgress: (progress: number, stage: string) => Promise<void>,
) {

  await onProgress(10, 'Creating workforce and attendance history');
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('hrive-demo-installation'))`;

    await tx.$executeRawUnsafe(`
      INSERT INTO hr_departments (id, name, code, division, department, section, description, headcount_allocation, updated_at)
      SELECT gen_random_uuid(), name, code, division, name, 'Core team', description, allocation, NOW()
      FROM (VALUES
        ('People & Culture', 'DEMO-PEOPLE', 'Corporate', 'Employee experience and HR operations', 80),
        ('Engineering', 'DEMO-ENG', 'Product', 'Product engineering and platform operations', 380),
        ('Sales', 'DEMO-SALES', 'Revenue', 'Regional sales and account growth', 240),
        ('Customer Success', 'DEMO-CS', 'Revenue', 'Customer onboarding and retention', 160),
        ('Finance & Operations', 'DEMO-OPS', 'Corporate', 'Finance, legal, and business operations', 140)
      ) AS seed(name, code, division, description, allocation)
      ON CONFLICT (code) DO NOTHING
    `);

    await tx.$executeRawUnsafe(`
      WITH departments AS (
        SELECT id, code, row_number() OVER (ORDER BY code) AS rn
        FROM hr_departments WHERE code LIKE 'DEMO-%'
      ), generated AS (
        SELECT n,
          ((n - 1) % 5) + 1 AS department_number,
          (CURRENT_DATE - (($2::int * 30) * ((n % 100)::numeric / 100))::int) AS hire_date
        FROM generate_series(1, $1::int) AS n
      )
      INSERT INTO hr_employees (
        id, employee_number, first_name, last_name, email, phone, department_id,
        job_title, employment_type, status, hire_date, location, business_unit,
        personal_information, address, emergency_contacts, skills, languages,
        profile_completion, updated_at
      )
      SELECT gen_random_uuid(), 'DEMO-' || lpad(g.n::text, 4, '0'),
        (ARRAY['Arun','Mali','Niran','Pim','Kanya','Theo','Lina','Sam','Mika','Nara'])[((g.n - 1) % 10) + 1],
        (ARRAY['Anan','Chen','Patel','Santos','Kim','Nguyen','Tan','Stone','Lee','Garcia'])[((g.n * 3 - 1) % 10) + 1],
        'employee.' || lpad(g.n::text, 4, '0') || '@demo.hrive.local',
        '+66 80 ' || lpad((1000000 + g.n)::text, 7, '0'), d.id,
        (ARRAY['HR Partner','Software Engineer','Account Executive','Customer Success Manager','Operations Analyst'])[g.department_number],
        CASE WHEN g.n % 12 = 0 THEN 'contract' ELSE 'full_time' END,
        CASE WHEN g.n % 25 = 0 THEN 'onboarding' ELSE 'active' END,
        g.hire_date, (ARRAY['Bangkok','Chiang Mai','Singapore','Remote'])[((g.n - 1) % 4) + 1],
        d.code, jsonb_build_object('demo', true, 'pronouns', CASE WHEN g.n % 2 = 0 THEN 'they/them' ELSE 'she/her' END),
        jsonb_build_object('country', 'Thailand'), '[]'::jsonb,
        jsonb_build_array('Communication', 'Digital literacy'), jsonb_build_array('English', 'Thai'), 88, NOW()
      FROM generated g JOIN departments d ON d.rn = g.department_number
      ON CONFLICT (email) DO NOTHING
    `, input.employeeCount, input.historyMonths);

    return tx.employee.count({ where: { email: { endsWith: '@demo.hrive.local' } } });
  }, { timeout: 60_000 });

  const attendanceBatchSize = 100;
  for (let offset = 0; offset < result; offset += attendanceBatchSize) {
    const batchNumber = Math.floor(offset / attendanceBatchSize) + 1;
    const totalBatches = Math.ceil(result / attendanceBatchSize);
    await onProgress(12 + Math.round((Math.min(offset + attendanceBatchSize, result) / result) * 34), `Creating attendance history · batch ${batchNumber} of ${totalBatches}`);
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        WITH demo_employees AS (
          SELECT id, employee_number FROM hr_employees
          WHERE email LIKE '%@demo.hrive.local' ORDER BY employee_number OFFSET $2::int LIMIT $3::int
        )
        INSERT INTO hr_attendance_records (
          id, employee_id, work_date, clock_in, clock_out, hours_worked, status, source,
          break_minutes, overtime_hours, late_minutes, work_location, scheduled_start_at,
          scheduled_end_at, scheduled_minutes, worked_minutes, regular_minutes,
          overtime_minutes, exception_status, review_status, timezone, updated_at
        )
        SELECT gen_random_uuid(), e.id, day::date,
          day::date + time '09:00' + ((abs(hashtext(e.employee_number || day::text)) % 26) || ' minutes')::interval,
          day::date + time '18:00' + ((abs(hashtext(day::text || e.employee_number)) % 46) || ' minutes')::interval,
          8, CASE WHEN abs(hashtext(e.employee_number || day::text)) % 31 = 0 THEN 'leave' ELSE 'present' END,
          'demo-installation', 60, CASE WHEN abs(hashtext(e.employee_number || day::text)) % 9 = 0 THEN 0.5 ELSE 0 END,
          abs(hashtext(e.employee_number || day::text)) % 26,
          CASE WHEN abs(hashtext(e.employee_number)) % 4 = 0 THEN 'remote' ELSE 'office' END,
          day::date + time '09:00', day::date + time '18:00', 480, 480, 480, 0,
          'clear', 'closed', 'Asia/Bangkok', NOW()
        FROM demo_employees e
        CROSS JOIN generate_series(CURRENT_DATE - ($1::int * interval '1 month'), CURRENT_DATE, interval '1 day') day
        WHERE extract(isodow from day) BETWEEN 1 AND 5
        ON CONFLICT (employee_id, work_date) DO NOTHING
      `, input.historyMonths, offset, attendanceBatchSize);
    }, { timeout: 60_000 });
  }
  const attendanceRecords = await prisma.attendanceRecord.count({ where: { source: 'demo-installation' } });
  const seeded = { environment: 'demo' as const, employeeCount: result, attendanceRecords };

  await onProgress(48, 'Creating core HR records');
  await seedHrDemoData();
  await onProgress(54, 'Creating shifts and attendance workflows');
  await seedShiftAttendanceDemoData();
  await onProgress(60, 'Creating employee self-service data');
  await seedEssDemoData();
  await onProgress(66, 'Creating leave records');
  await seedLeaveDemoData();
  await onProgress(72, 'Creating performance records');
  await seedPerformanceDemoData();
  await onProgress(78, 'Creating appraisal records');
  await seedAppraisalDemoData();
  await onProgress(84, 'Creating payroll records');
  await seedPayrollDemoData();
  const admin = await prisma.user.findFirst({ where: { id: requestedById, role: 'Admin', isActive: true }, select: { id: true } });
  if (!admin) throw new Error('The requesting administrator is no longer active.');
  await onProgress(90, 'Connecting example workflows across modules');
  const modules = await seedAllDemoModules(admin.id);
  const profile = { seedVersion: DEMO_DATA_SEED_VERSION, employeeCount: seeded.employeeCount, historyMonths: input.historyMonths, attendanceRecords: seeded.attendanceRecords, modules };
  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: 'demoDataProfile' }, update: { value: JSON.stringify(profile) },
      create: { key: 'demoDataProfile', value: JSON.stringify(profile) },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'demoDataInitializedAt' }, update: { value: new Date().toISOString() },
      create: { key: 'demoDataInitializedAt', value: new Date().toISOString() },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'demoDataSeedVersion' }, update: { value: DEMO_DATA_SEED_VERSION },
      create: { key: 'demoDataSeedVersion', value: DEMO_DATA_SEED_VERSION },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'installationEnvironment' }, update: { value: 'demo' },
      create: { key: 'installationEnvironment', value: 'demo' },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'installationEnvironmentConfiguredAt' }, update: { value: new Date().toISOString() },
      create: { key: 'installationEnvironmentConfiguredAt', value: new Date().toISOString() },
    }),
  ]);
  return { ...seeded, modules };
}
