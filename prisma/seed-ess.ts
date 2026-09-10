import prisma from '../src/lib/prisma';

export async function seedEssDemoData() {
  await prisma.$executeRawUnsafe(`
    UPDATE "hr_employees" e
    SET "user_id" = u.id
    FROM "User" u
    WHERE e."user_id" IS NULL AND lower(e.email) = lower(u.email)
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "hr_employees"
    SET "manager_id" = (SELECT id FROM "hr_employees" WHERE email = 'nara.chan@example.com'),
        "department_id" = (SELECT id FROM "hr_departments" WHERE code = 'ENG'),
        "preferred_name" = 'Ari',
        "legal_name" = 'Ari Patel',
        "phone" = '+66 81 234 5678',
        "work_phone" = '+66 2 123 4567',
        "location" = 'Bangkok, Thailand',
        "business_unit" = 'Product',
        "status" = 'probation',
        "hire_date" = CURRENT_DATE - INTERVAL '82 days',
        "probation_period_days" = 90,
        "probation_evaluation_frequency_days" = 30,
        "profile_completion" = 78,
        "personal_information" = '{"preferredPronouns":"they/them","nationality":"Thai"}'::jsonb,
        "address" = '{"city":"Bangkok","country":"Thailand"}'::jsonb,
        "emergency_contacts" = '[{"name":"Sam Patel","relationship":"Sibling","phone":"+66 80 555 0101"}]'::jsonb,
        "skills" = '["React","TypeScript","Accessibility"]'::jsonb,
        "languages" = '[{"language":"English","level":"Professional"},{"language":"Thai","level":"Conversational"}]'::jsonb,
        "bank_information" = '{"bank":"Demo Bank","accountNumber":"9834567890"}'::jsonb,
        "tax_information" = '{"taxId":"TH-9876543210"}'::jsonb,
        "government_identification" = '{"nationalId":"1234567890123"}'::jsonb
    WHERE email = 'ari.patel@example.com'
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_onboarding_tasks"
      ("id", "template_id", "title", "description", "owner_role", "due_day", "sort_order", "updated_at")
    SELECT gen_random_uuid(), template.id, task.title, task.description, task.owner_role, task.due_day, task.sort_order, NOW()
    FROM "hr_onboarding_templates" template
    CROSS JOIN (
      VALUES
        ('Policy acknowledgments', 'Read and acknowledge the employee handbook and required policies.', 'employee', 3, 10),
        ('Equipment & access', 'Confirm equipment delivery and access to required systems.', 'it', 5, 20)
    ) AS task(title, description, owner_role, due_day, sort_order)
    WHERE template.name = 'Default new hire onboarding'
      AND NOT EXISTS (
        SELECT 1 FROM "hr_onboarding_tasks" existing
        WHERE existing.template_id = template.id AND existing.title = task.title
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_employee_onboarding"
      ("id", "employee_id", "template_id", "status", "progress", "start_date", "target_date", "updated_at")
    SELECT gen_random_uuid(), employee.id, template.id, 'in_progress', 75,
           employee.hire_date, CURRENT_DATE + INTERVAL '8 days', NOW()
    FROM "hr_employees" employee
    CROSS JOIN "hr_onboarding_templates" template
    WHERE employee.email = 'ari.patel@example.com'
      AND template.name = 'Default new hire onboarding'
      AND NOT EXISTS (
        SELECT 1 FROM "hr_employee_onboarding" existing
        WHERE existing.employee_id = employee.id AND existing.template_id = template.id
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_employee_onboarding_task_progress"
      ("id", "onboarding_id", "task_id", "employee_id", "status", "completed_at", "updated_at")
    SELECT gen_random_uuid(), onboarding.id, task.id, employee.id,
           CASE WHEN task.title = 'Policy acknowledgments' THEN 'completed' ELSE 'pending' END,
           CASE WHEN task.title = 'Policy acknowledgments' THEN CURRENT_DATE - INTERVAL '2 days' ELSE NULL END,
           NOW()
    FROM "hr_employees" employee
    JOIN "hr_employee_onboarding" onboarding ON onboarding.employee_id = employee.id
    JOIN "hr_onboarding_tasks" task ON task.template_id = onboarding.template_id
    WHERE employee.email = 'ari.patel@example.com'
      AND task.title IN ('Policy acknowledgments', 'Equipment & access')
    ON CONFLICT ("onboarding_id", "task_id") DO UPDATE
      SET "status" = EXCLUDED."status",
          "completed_at" = EXCLUDED."completed_at",
          "updated_at" = NOW()
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_leave_balances" ("employee_id", "policy_id", "year", "allocated", "used", "pending", "carry_forward", "expiring")
    SELECT e.id, p.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer,
           p.annual_allowance, CASE WHEN p.leave_type = 'annual' THEN 3 ELSE 1 END, 0, 2, 1
    FROM "hr_employees" e
    CROSS JOIN "hr_leave_policies" p
    WHERE e.email IN ('ari.patel@example.com', 'mika.stone@example.com')
    ON CONFLICT ("employee_id", "policy_id", "year") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_work_schedules" ("name", "weekly_hours", "timezone")
    VALUES ('Bangkok standard hours', 40, 'Asia/Bangkok')
    ON CONFLICT ("name") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_shift_assignments" ("employee_id", "schedule_id", "shift_date", "start_time", "end_time", "status")
    SELECT e.id, s.id, CURRENT_DATE + offset_day, '09:00', '18:00', 'scheduled'
    FROM "hr_employees" e
    CROSS JOIN "hr_work_schedules" s
    CROSS JOIN generate_series(0, 6) AS days(offset_day)
    WHERE e.email = 'ari.patel@example.com' AND s.name = 'Bangkok standard hours'
      AND NOT EXISTS (
        SELECT 1 FROM "hr_shift_assignments" existing
        WHERE existing.employee_id = e.id AND existing.shift_date = CURRENT_DATE + offset_day
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_attendance_records"
      ("employee_id", "work_date", "clock_in", "clock_out", "hours_worked", "break_minutes", "status", "source", "work_location")
    SELECT e.id, CURRENT_DATE - 1, CURRENT_DATE - 1 + TIME '09:05',
           CURRENT_DATE - 1 + TIME '18:00', 7.92, 60, 'present', 'seed', 'office'
    FROM "hr_employees" e
    WHERE e.email = 'ari.patel@example.com'
    ON CONFLICT ("employee_id", "work_date") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_employee_documents"
      ("employee_id", "title", "type", "category", "status", "issue_date",
       "confidentiality_level", "requires_acknowledgment")
    SELECT e.id, 'Employee handbook ' || EXTRACT(YEAR FROM CURRENT_DATE)::int, 'policy_acknowledgment', 'policy_acknowledgment',
           'complete', CURRENT_DATE - 10, 'employee', true
    FROM "hr_employees" e
    WHERE e.email = 'ari.patel@example.com'
      AND NOT EXISTS (
        SELECT 1 FROM "hr_employee_documents" d
        WHERE d.employee_id = e.id AND d.title = 'Employee handbook ' || EXTRACT(YEAR FROM CURRENT_DATE)::int
      )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_performance_cycles" ("name", "start_date", "end_date", "status")
    VALUES (EXTRACT(YEAR FROM CURRENT_DATE)::int || ' Mid-year Review', date_trunc('year', CURRENT_DATE)::date + INTERVAL '6 months', date_trunc('year', CURRENT_DATE)::date + INTERVAL '8 months - 1 day', 'active')
    ON CONFLICT ("name") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_performance_reviews" ("cycle_id", "employee_id", "reviewer_id", "status")
    SELECT c.id, e.id, e.manager_id, 'in_progress'
    FROM "hr_performance_cycles" c
    CROSS JOIN "hr_employees" e
    WHERE c.name = EXTRACT(YEAR FROM CURRENT_DATE)::int || ' Mid-year Review' AND e.email = 'ari.patel@example.com'
    ON CONFLICT ("cycle_id", "employee_id") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_performance_goals"
      ("employee_id", "review_id", "title", "description", "status", "progress", "due_date", "key_results")
    SELECT e.id, r.id, 'Improve employee portal accessibility',
           'Raise WCAG coverage across employee-facing workflows.', 'active', 55, date_trunc('year', CURRENT_DATE)::date + INTERVAL '8 months - 1 day',
           '[{"title":"Resolve critical accessibility findings"},{"title":"Add keyboard workflow tests"}]'::jsonb
    FROM "hr_employees" e
    JOIN "hr_performance_reviews" r ON r.employee_id = e.id
    WHERE e.email = 'ari.patel@example.com'
      AND NOT EXISTS (
        SELECT 1 FROM "hr_performance_goals" g
        WHERE g.employee_id = e.id AND g.title = 'Improve employee portal accessibility'
      )
  `);

  console.log('ESS demo data seeded.');
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-ess.ts')) seedEssDemoData()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
