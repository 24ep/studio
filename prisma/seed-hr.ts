import prisma from '../src/lib/prisma';

export async function seedHrDemoData() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_departments (id, name, code, division, department, section, description, updated_at)
    VALUES
      (gen_random_uuid(), 'People Operations', 'POPS', 'Corporate Services', 'Human Resources', 'People Operations', 'Core HR operations and employee support', NOW()),
      (gen_random_uuid(), 'Engineering', 'ENG', 'Product', 'Engineering', 'Platform', 'Product and platform engineering', NOW()),
      (gen_random_uuid(), 'Finance', 'FIN', 'Corporate Services', 'Finance', 'Payroll', 'Finance, payroll, and reporting', NOW())
    ON CONFLICT (code) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_employees (
      id,
      employee_number,
      first_name,
      last_name,
      email,
      phone,
      job_title,
      employment_type,
      status,
      hire_date,
      location,
      updated_at
    )
    VALUES
      (gen_random_uuid(), 'EMP-1001', 'Nara', 'Chan', 'nara.chan@example.com', '+66 80 111 1001', 'HR Operations Lead', 'full_time', 'active', NOW() - INTERVAL '420 days', 'Bangkok', NOW()),
      (gen_random_uuid(), 'EMP-1002', 'Mika', 'Stone', 'mika.stone@example.com', '+66 80 111 1002', 'Recruiter', 'full_time', 'active', NOW() - INTERVAL '160 days', 'Bangkok', NOW()),
      (gen_random_uuid(), 'EMP-1003', 'Ari', 'Patel', 'ari.patel@example.com', '+66 80 111 1003', 'Frontend Engineer', 'full_time', 'onboarding', NOW() - INTERVAL '5 days', 'Bangkok', NOW())
    ON CONFLICT (email) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_leave_policies (id, name, leave_type, annual_allowance, updated_at)
    VALUES
      (gen_random_uuid(), 'Annual Leave', 'annual', 12, NOW()),
      (gen_random_uuid(), 'Sick Leave', 'sick', 30, NOW())
    ON CONFLICT (name) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_onboarding_templates (id, name, description, updated_at)
    VALUES (gen_random_uuid(), 'Default new hire onboarding', 'Baseline onboarding checklist for new employees', NOW())
    ON CONFLICT (name) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_learning_courses (id, title, category, description, duration_hours, is_required, updated_at)
    VALUES
      (gen_random_uuid(), 'Company Orientation', 'Onboarding', 'Company policy and culture overview', 2, true, NOW()),
      (gen_random_uuid(), 'Interview Compliance', 'Compliance', 'Fair hiring and evaluation practices', 1.5, true, NOW())
    ON CONFLICT DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_benefit_plans (id, name, type, description, employer_cost, employee_cost, updated_at)
    VALUES
      (gen_random_uuid(), 'Standard Health Plan', 'health', 'Core health insurance plan', 2500, 500, NOW()),
      (gen_random_uuid(), 'Wellbeing Allowance', 'allowance', 'Monthly wellbeing allowance', 1000, 0, NOW())
    ON CONFLICT (name) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO hr_payroll_periods (id, name, start_date, end_date, pay_date, status, updated_at)
    VALUES (gen_random_uuid(), to_char(CURRENT_DATE - INTERVAL '1 month', 'FMMonth YYYY') || ' Payroll', date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date, (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date, 'open', NOW())
    ON CONFLICT (name) DO NOTHING
  `);
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-hr.ts')) seedHrDemoData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
