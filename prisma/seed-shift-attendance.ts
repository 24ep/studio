import prisma from '../src/lib/prisma';

export async function seedShiftAttendanceDemoData() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_departments"
      (id, name, code, division, department, section, unit_type, sort_order,
       description, is_active, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'Product Design', 'ATT-DEMO-DESIGN', 'Product', 'Product Design', 'Design', 'department', 10, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Customer Success', 'ATT-DEMO-CS', 'Commercial', 'Customer Success', 'Customer Success', 'department', 20, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Software Engineering', 'ATT-DEMO-ENG', 'Technology', 'Engineering', 'Software Engineering', 'department', 30, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Marketing', 'ATT-DEMO-MKT', 'Commercial', 'Marketing', 'Marketing', 'department', 40, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Sales', 'ATT-DEMO-SALES', 'Commercial', 'Sales', 'Sales', 'department', 50, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Operations', 'ATT-DEMO-OPS', 'Operations', 'Operations', 'Operations', 'department', 60, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Finance', 'ATT-DEMO-FIN', 'Corporate', 'Finance', 'Finance', 'department', 70, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'IT Support', 'ATT-DEMO-IT', 'Technology', 'IT', 'IT Support', 'department', 80, 'Sample department for attendance demonstrations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
  `);

  await prisma.$executeRawUnsafe(`
    WITH demo(employee_number, first_name, last_name, email, job_title, department_code, sort_order) AS (
      VALUES
        ('DEMO-ATT-001', 'Maya', 'Chen', 'attendance-demo-01@example.test', 'Product Designer', 'ATT-DEMO-DESIGN', 1),
        ('DEMO-ATT-002', 'Lina', 'Patel', 'attendance-demo-02@example.test', 'Customer Success Manager', 'ATT-DEMO-CS', 2),
        ('DEMO-ATT-003', 'Daniel', 'Wong', 'attendance-demo-03@example.test', 'Software Engineer', 'ATT-DEMO-ENG', 3),
        ('DEMO-ATT-004', 'Tanya', 'Lee', 'attendance-demo-04@example.test', 'Marketing Specialist', 'ATT-DEMO-MKT', 4),
        ('DEMO-ATT-005', 'Anucha', 'Prom', 'attendance-demo-05@example.test', 'Sales Executive', 'ATT-DEMO-SALES', 5),
        ('DEMO-ATT-006', 'Arun', 'Sombat', 'attendance-demo-06@example.test', 'Account Executive', 'ATT-DEMO-SALES', 6),
        ('DEMO-ATT-007', 'Narin', 'Chai', 'attendance-demo-07@example.test', 'Operations Analyst', 'ATT-DEMO-OPS', 7),
        ('DEMO-ATT-008', 'Krittaya', 'Sae', 'attendance-demo-08@example.test', 'Customer Success Specialist', 'ATT-DEMO-CS', 8),
        ('DEMO-ATT-009', 'Ben', 'Thompson', 'attendance-demo-09@example.test', 'Engineering Manager', 'ATT-DEMO-ENG', 9),
        ('DEMO-ATT-010', 'Ploy', 'Rattanakorn', 'attendance-demo-10@example.test', 'Financial Analyst', 'ATT-DEMO-FIN', 10),
        ('DEMO-ATT-011', 'Jirawat', 'K.', 'attendance-demo-11@example.test', 'IT Support Specialist', 'ATT-DEMO-IT', 11),
        ('DEMO-ATT-012', 'Sofia', 'Martinez', 'attendance-demo-12@example.test', 'People Operations Partner', 'ATT-DEMO-OPS', 12)
    )
    INSERT INTO "hr_employees"
      (id, employee_number, first_name, last_name, email, department_id, job_title,
       employment_type, status, hire_date, location, profile_completion, version,
       created_at, updated_at)
    SELECT gen_random_uuid(), demo.employee_number, demo.first_name, demo.last_name,
           demo.email, department.id, demo.job_title, 'full_time', 'active',
           CURRENT_DATE - (180 + demo.sort_order), 'Bangkok HQ', 80, 1,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM demo
    JOIN "hr_departments" department ON department.code = demo.department_code
    ON CONFLICT (employee_number) DO UPDATE
      SET first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          department_id = EXCLUDED.department_id,
          job_title = EXCLUDED.job_title,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_work_schedules"
      (id, name, weekly_hours, timezone, is_active, schedule_type,
       expected_daily_minutes, rotation_cycle_days, effective_from, version,
       created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'Bangkok Standard Week', 40, 'Asia/Bangkok', TRUE, 'fixed', 480, NULL, CURRENT_DATE - 365, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Product Flexible Hours', 40, 'Asia/Bangkok', TRUE, 'flexible', 480, NULL, CURRENT_DATE - 365, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'Operations 4-on 2-off', 48, 'Asia/Bangkok', TRUE, 'rotating', 720, 6, CURRENT_DATE - 365, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (name) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_shift_definitions"
      (id, code, name, color_token, current_version, is_active, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'BKK-DAY', 'Bangkok Day', 'indigo', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'BKK-EARLY', 'Early Operations', 'amber', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'BKK-NIGHT', 'Night Operations', 'violet', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'REMOTE-FLEX', 'Remote Flexible', 'emerald', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_shift_definition_versions"
      (id, shift_definition_id, version, start_time, end_time, overnight, break_rules,
       grace_period_minutes, early_departure_tolerance_minutes, check_in_window_minutes,
       check_out_window_minutes, minimum_rest_minutes, maximum_scheduled_minutes,
       overtime_eligible, work_location, applicable_employee_groups,
       effective_from, created_at)
    SELECT gen_random_uuid(), sd.id, 1,
           CASE sd.code WHEN 'BKK-EARLY' THEN '07:00' WHEN 'BKK-NIGHT' THEN '22:00' WHEN 'REMOTE-FLEX' THEN '08:00' ELSE '09:00' END,
           CASE sd.code WHEN 'BKK-EARLY' THEN '16:00' WHEN 'BKK-NIGHT' THEN '06:00' WHEN 'REMOTE-FLEX' THEN '17:00' ELSE '18:00' END,
           sd.code = 'BKK-NIGHT',
           '[{"type":"unpaid","minutes":60,"afterMinutes":240}]'::jsonb,
           5, 5, 60, 180, 660, 720, TRUE,
           CASE sd.code WHEN 'REMOTE-FLEX' THEN 'Remote' ELSE 'Bangkok Office' END,
           '[]'::jsonb, CURRENT_DATE - 365, CURRENT_TIMESTAMP
    FROM "hr_shift_definitions" sd
    WHERE sd.code IN ('BKK-DAY', 'BKK-EARLY', 'BKK-NIGHT', 'REMOTE-FLEX')
    ON CONFLICT (shift_definition_id, version) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_roster_periods"
      (id, name, start_date, end_date, status, version, created_at, updated_at)
    SELECT gen_random_uuid(),
           'Bangkok Operations · ' || to_char(date_trunc('week', CURRENT_DATE), 'DD Mon') || '–' || to_char(date_trunc('week', CURRENT_DATE) + INTERVAL '13 days', 'DD Mon YYYY'),
           date_trunc('week', CURRENT_DATE)::date,
           (date_trunc('week', CURRENT_DATE) + INTERVAL '13 days')::date,
           'ready_for_review', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "hr_roster_periods"
      WHERE start_date = date_trunc('week', CURRENT_DATE)::date
    )
  `);

  await prisma.$executeRawUnsafe(`
    WITH roster AS (
      SELECT id FROM "hr_roster_periods"
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC LIMIT 1
    ),
    schedule AS (
      SELECT id FROM "hr_work_schedules" WHERE name = 'Bangkok Standard Week' LIMIT 1
    ),
    definition AS (
      SELECT id, current_version FROM "hr_shift_definitions" WHERE code = 'BKK-DAY' LIMIT 1
    ),
    team AS (
      SELECT id, row_number() OVER (ORDER BY employee_number) AS employee_order
      FROM "hr_employees"
      WHERE status IN ('active', 'onboarding')
      ORDER BY CASE WHEN email LIKE 'attendance-demo-%@example.test' THEN 0 ELSE 1 END, employee_number
      LIMIT 12
    ),
    workdays AS (
      SELECT day::date AS shift_date
      FROM generate_series(
        date_trunc('week', CURRENT_DATE),
        date_trunc('week', CURRENT_DATE) + INTERVAL '11 days',
        INTERVAL '1 day'
      ) day
      WHERE EXTRACT(ISODOW FROM day) <= 5
    )
    INSERT INTO "hr_shift_assignments"
      (id, employee_id, schedule_id, roster_period_id, shift_definition_id,
       shift_definition_version, shift_date, logical_shift_date, start_time, end_time,
       start_at, end_at, break_minutes, work_location, status, publication_status,
       version, created_at, updated_at)
    SELECT gen_random_uuid(), team.id, schedule.id, roster.id, definition.id,
           definition.current_version, workdays.shift_date, workdays.shift_date,
           '09:00', '18:00',
           (workdays.shift_date + TIME '09:00') AT TIME ZONE 'Asia/Bangkok',
           (workdays.shift_date + TIME '18:00') AT TIME ZONE 'Asia/Bangkok',
           60, 'Bangkok Office', 'scheduled', 'draft', 1,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM team CROSS JOIN workdays CROSS JOIN roster CROSS JOIN schedule CROSS JOIN definition
    WHERE NOT EXISTS (
      SELECT 1 FROM "hr_shift_assignments" existing
      WHERE existing.employee_id = team.id
        AND existing.shift_date::date = workdays.shift_date
        AND existing.status <> 'cancelled'
    )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_attendance_periods"
      (id, name, period_type, start_date, end_date, status, version, created_at, updated_at)
    SELECT gen_random_uuid(), to_char(CURRENT_DATE, 'FMMonth YYYY') || ' Attendance',
           'monthly', date_trunc('month', CURRENT_DATE)::date,
           (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
           'under_review', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "hr_attendance_periods"
      WHERE start_date = date_trunc('month', CURRENT_DATE)::date
    )
  `);

  await prisma.$executeRawUnsafe(`
    WITH team AS (
      SELECT id, row_number() OVER (ORDER BY employee_number) AS employee_order
      FROM "hr_employees"
      WHERE status IN ('active', 'onboarding')
      ORDER BY CASE WHEN email LIKE 'attendance-demo-%@example.test' THEN 0 ELSE 1 END, employee_number
      LIMIT 8
    ),
    days AS (
      SELECT day::date AS work_date,
             row_number() OVER (ORDER BY day) AS day_order
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') day
      WHERE EXTRACT(ISODOW FROM day) <= 5
    )
    INSERT INTO "hr_attendance_records"
      (id, employee_id, work_date, clock_in, clock_out, hours_worked, status, source,
       break_minutes, overtime_hours, late_minutes, early_departure_minutes,
       work_location, scheduled_start_at, scheduled_end_at, scheduled_minutes,
       worked_minutes, regular_minutes, overtime_minutes, exception_status,
       review_status, timezone, calculation_version, created_at, updated_at)
    SELECT gen_random_uuid(), team.id, days.work_date,
           (days.work_date + TIME '09:00' + CASE WHEN team.employee_order % 4 = 0 THEN INTERVAL '18 minutes' ELSE INTERVAL '0 minutes' END) AT TIME ZONE 'Asia/Bangkok',
           CASE WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN NULL
             ELSE (days.work_date + TIME '18:00' + CASE WHEN team.employee_order % 5 = 0 THEN INTERVAL '42 minutes' ELSE INTERVAL '0 minutes' END) AT TIME ZONE 'Asia/Bangkok' END,
           CASE WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN 0 ELSE 8 END,
           CASE
             WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN 'present'
             WHEN team.employee_order % 4 = 0 THEN 'late'
             ELSE 'checked_out'
           END,
           'clock', 60,
           CASE WHEN team.employee_order % 5 = 0 THEN 0.7 ELSE 0 END,
           CASE WHEN team.employee_order % 4 = 0 THEN 13 ELSE 0 END,
           0,
           CASE WHEN team.employee_order % 6 = 0 THEN 'remote' ELSE 'office' END,
           (days.work_date + TIME '09:00') AT TIME ZONE 'Asia/Bangkok',
           (days.work_date + TIME '18:00') AT TIME ZONE 'Asia/Bangkok',
           540,
           CASE WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN 0 ELSE 480 END,
           CASE WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN 0 ELSE 480 END,
           CASE WHEN team.employee_order % 5 = 0 THEN 42 ELSE 0 END,
           CASE
             WHEN days.work_date = CURRENT_DATE AND team.employee_order % 3 = 0 THEN 'open'
             WHEN team.employee_order % 4 = 0 OR team.employee_order % 5 = 0 THEN 'open'
             ELSE 'clear'
           END,
           'open', 'Asia/Bangkok', 'shift-attendance-v1',
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM team CROSS JOIN days
    ON CONFLICT (employee_id, work_date) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_attendance_exceptions"
      (id, attendance_record_id, code, severity, status, explanation, created_at, updated_at)
    SELECT gen_random_uuid(), ar.id, 'LATE_ARRIVAL', 'warning', 'open',
           'Check-in occurred beyond the configured five-minute tolerance.',
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "hr_attendance_records" ar
    WHERE ar.late_minutes > 0
      AND NOT EXISTS (
        SELECT 1 FROM "hr_attendance_exceptions" ae
        WHERE ae.attendance_record_id = ar.id AND ae.code = 'LATE_ARRIVAL'
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_attendance_exceptions"
      (id, attendance_record_id, code, severity, status, explanation, created_at, updated_at)
    SELECT gen_random_uuid(), ar.id, 'MISSING_CHECK_OUT', 'critical', 'open',
           'A check-out was not recorded for the scheduled shift.',
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "hr_attendance_records" ar
    JOIN "hr_employees" employee ON employee.id = ar.employee_id
    WHERE employee.email LIKE 'attendance-demo-%@example.test'
      AND ar.work_date = CURRENT_DATE
      AND ar.clock_in IS NOT NULL
      AND ar.clock_out IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "hr_attendance_exceptions" ae
        WHERE ae.attendance_record_id = ar.id AND ae.code = 'MISSING_CHECK_OUT'
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_attendance_exceptions"
      (id, attendance_record_id, code, severity, status, explanation, created_at, updated_at)
    SELECT gen_random_uuid(), ar.id, 'OVERTIME_VARIANCE', 'warning', 'open',
           'Recorded time exceeds the planned shift and requires review.',
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "hr_attendance_records" ar
    JOIN "hr_employees" employee ON employee.id = ar.employee_id
    WHERE employee.email LIKE 'attendance-demo-%@example.test'
      AND ar.overtime_minutes > 0
      AND NOT EXISTS (
        SELECT 1 FROM "hr_attendance_exceptions" ae
        WHERE ae.attendance_record_id = ar.id AND ae.code = 'OVERTIME_VARIANCE'
      )
  `);

  await prisma.$executeRawUnsafe(`
    WITH employee AS (
      SELECT id FROM "hr_employees" WHERE email = 'mika.stone@example.com' LIMIT 1
    )
    INSERT INTO "hr_overtime_requests"
      (id, request_id, employee_id, work_date, overtime_type,
       requested_start_at, requested_end_at, requested_minutes, break_minutes,
       business_reason, project, cost_center, work_location, compensation_method,
       policy_warnings, status, version, created_at, updated_at)
    SELECT request_uuid, 'OT-' || upper(substr(replace(request_uuid::text, '-', ''), 1, 10)),
           employee.id, CURRENT_DATE + 1, 'planned',
           (CURRENT_DATE + 1 + TIME '18:00') AT TIME ZONE 'Asia/Bangkok',
           (CURRENT_DATE + 1 + TIME '20:00') AT TIME ZONE 'Asia/Bangkok',
           120, 0, 'Complete the quarterly hiring operations dashboard',
           'People Analytics', 'HR-OPS', 'Bangkok Office', 'paid',
           '[]'::jsonb, 'pending_approval', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM employee CROSS JOIN LATERAL (SELECT gen_random_uuid() AS request_uuid) generated
    WHERE NOT EXISTS (
      SELECT 1 FROM "hr_overtime_requests" existing
      WHERE existing.employee_id = employee.id AND existing.work_date = CURRENT_DATE + 1
    )
  `);

  await prisma.$executeRawUnsafe(`
    WITH employee AS (
      SELECT id FROM "hr_employees" WHERE email = 'mika.stone@example.com' LIMIT 1
    ),
    sheet AS (
      INSERT INTO "hr_timesheets"
        (id, timesheet_number, employee_id, period_start, period_end, status,
         total_minutes, billable_minutes, attendance_minutes, difference_minutes,
         version, created_at, updated_at)
      SELECT sheet_uuid, 'TS-' || upper(substr(replace(sheet_uuid::text, '-', ''), 1, 10)),
             employee.id, date_trunc('week', CURRENT_DATE)::date,
             (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date,
             'draft', 480, 300, 480, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM employee CROSS JOIN LATERAL (SELECT gen_random_uuid() AS sheet_uuid) generated
      ON CONFLICT (employee_id, period_start, period_end)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id
    )
    INSERT INTO "hr_timesheet_entries"
      (id, timesheet_id, work_date, project, task, client, cost_center, work_type,
       duration_minutes, billable, description, work_location, status, version,
       created_at, updated_at)
    SELECT gen_random_uuid(), sheet.id, CURRENT_DATE, 'Talent Operations Platform',
           'Attendance module rollout', 'Internal', 'HR-OPS', 'implementation',
           300, TRUE, 'Implemented roster validation and attendance exception review workflows.',
           'office', 'draft', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM sheet
    WHERE NOT EXISTS (
      SELECT 1 FROM "hr_timesheet_entries" existing
      WHERE existing.timesheet_id = sheet.id
        AND existing.work_date = CURRENT_DATE
        AND existing.project = 'Talent Operations Platform'
    )
  `);
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-shift-attendance.ts')) seedShiftAttendanceDemoData()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
