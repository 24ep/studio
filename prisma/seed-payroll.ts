import { randomUUID } from 'crypto';
import prisma from '../src/lib/prisma';

export async function seedPayrollDemoData() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const periodKey = startDate.slice(0, 7);
  const baselineDate = `${today.getUTCFullYear() - 1}-01-01`;
  const periodLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const employees = await prisma.$queryRawUnsafe<Array<{ id: string; company_id: string | null; hire_date: Date | null }>>(
    `SELECT id, company_id, hire_date FROM hr_employees WHERE status IN ('active','probation','onboarding') ORDER BY employee_number LIMIT 40`,
  );
  if (!employees.length) return;

  const companyIds = [...new Set(employees.map((employee) => employee.company_id).filter(Boolean))] as string[];
  for (const companyId of companyIds.length ? companyIds : [null]) {
    const group = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO hr_payroll_groups (id, company_id, code, name, pay_frequency, currency, timezone, payment_method, cutoff_day, pay_day, effective_from)
       VALUES ($1::uuid, $2::uuid, 'TH-MONTHLY', 'Thailand Monthly Salaried', 'monthly', 'THB', 'Asia/Bangkok', 'bank_transfer', 24, 28, $3::date)
       ON CONFLICT (company_id, code) DO UPDATE SET updated_at = NOW() RETURNING id`, randomUUID(), companyId, baselineDate,
    ))[0];
    const periodName = `${periodLabel} · ${companyId ? companyId.slice(0, 6).toUpperCase() : 'Global Monthly'}`;
    const period = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO hr_payroll_periods (id, name, start_date, end_date, pay_date, status, company_id, payroll_group_id, version, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::date, $4::date, $4::date, 'open', $5::uuid, $6::uuid, 1, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`, randomUUID(), periodName, startDate, endDate, companyId, group.id,
    ))[0];
    const scoped = employees.filter((employee) => employee.company_id === companyId || companyId === null);
    for (let index = 0; index < scoped.length; index += 1) {
      const employee = scoped[index];
      const salary = 42_000 + (index % 8) * 6_500;
      await prisma.$executeRawUnsafe(
        `INSERT INTO hr_employee_payroll_profiles (id, employee_id, company_id, payroll_group_id, payment_method, payment_currency, bank_account_reference, tax_profile_reference, payroll_start_date, status, version)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'bank_transfer', 'THB', $5, $6, $7::date, 'active', 1)
         ON CONFLICT (employee_id) DO UPDATE SET payroll_group_id = EXCLUDED.payroll_group_id, updated_at = NOW()`,
        randomUUID(), employee.id, companyId, group.id, `PAY-${String(index + 1).padStart(4, '0')}`, `TAX-${String(index + 1).padStart(4, '0')}`, employee.hire_date || baselineDate,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO hr_compensation_packages (id, employee_id, company_id, base_salary, currency, pay_frequency, effective_from, components, reason, status, version, created_at, updated_at)
         SELECT $1::uuid, $2::uuid, $3::uuid, $4, 'THB', 'monthly', $5::date, $6::jsonb, 'Demo compensation baseline', 'approved', 1, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM hr_compensation_packages WHERE employee_id = $2::uuid AND effective_from = $5::date)`,
        randomUUID(), employee.id, companyId, salary, baselineDate, JSON.stringify([{ code: 'BASE_SALARY', amount: salary, recurring: true }]),
      );
    }
    const planName = `Core Medical · ${companyId ? companyId.slice(0, 6).toUpperCase() : 'Global'}`;
    const plan = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO hr_benefit_plans (id, company_id, name, type, description, employer_cost, employee_cost, is_active, eligibility_rules, provider_code, effective_from, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, 'health_insurance', 'Synthetic core employee medical coverage', 1850, 450, true, $4::jsonb, 'DEMO-HEALTH-CORE', $5::date, 1, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`, randomUUID(), companyId, planName,
      JSON.stringify({ statuses: ['active', 'probation', 'onboarding'], waitingDays: 30 }), baselineDate,
    ))[0];
    for (const employee of scoped.slice(0, Math.max(1, Math.floor(scoped.length * 0.75)))) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO hr_employee_benefit_enrollments (id, employee_id, benefit_plan_id, company_id, status, effective_from, employee_contribution, employer_contribution, enrolled_at, version, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'active', $5::date, 450, 1850, NOW(), 1, NOW(), NOW())
         ON CONFLICT (employee_id, benefit_plan_id) DO NOTHING`, randomUUID(), employee.id, plan.id, companyId, baselineDate,
      );
    }
    const run = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO hr_payroll_runs (id, period_id, company_id, payroll_group_id, run_type, status, idempotency_key, employee_count, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'regular', 'calculated', $5, $6, 1, NOW(), NOW())
       ON CONFLICT (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO UPDATE SET employee_count = EXCLUDED.employee_count, updated_at = NOW() RETURNING id`,
      randomUUID(), period.id, companyId, group.id, `demo:regular:${companyId || 'global'}:${periodKey}`, scoped.length,
    ))[0];
    for (let index = 0; index < scoped.length; index += 1) {
      const employee = scoped[index];
      const base = 42_000 + (index % 8) * 6_500;
      const variable = index % 4 === 0 ? 3_000 : 0;
      const gross = base + variable;
      const deductions = Math.round(gross * 0.075);
      const net = gross - deductions;
      const item = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO hr_payroll_run_items (id, payroll_run_id, employee_id, gross_pay, net_pay, base_salary, regular_earnings, variable_earnings, total_deductions, employer_cost, taxable_income, pit_withholding, employee_social_security, employer_social_security, components, calculation_trace, input_snapshot, status)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $6, $7, $8, $9, $4, $10, $11, $11, $12::jsonb, $13::jsonb, $14::jsonb, 'calculated')
         ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET gross_pay = EXCLUDED.gross_pay, net_pay = EXCLUDED.net_pay, updated_at = NOW() RETURNING id`,
        randomUUID(), run.id, employee.id, gross, net, base, variable, deductions, gross + Math.round(gross * 0.05), Math.round(gross * 0.025), Math.round(gross * 0.05),
        JSON.stringify([{ code: 'BASE', amount: base }, { code: 'VARIABLE', amount: variable }, { code: 'DEDUCTIONS', amount: deductions }]),
        JSON.stringify({ demo: true, formula: 'gross minus deductions' }), JSON.stringify({ period: periodKey, synthetic: true }),
      ))[0];
      await prisma.$executeRawUnsafe(
        `INSERT INTO hr_payslips (id, payroll_run_item_id, employee_id, company_id, payroll_period_id, status, currency, gross_pay, total_deductions, net_pay, year_to_date, breakdown, published_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'published', 'THB', $6, $7, $8, $9::jsonb, $10::jsonb, NOW())
         ON CONFLICT (payroll_run_item_id) DO NOTHING`, randomUUID(), item.id, employee.id, companyId, period.id, gross, deductions, net,
        JSON.stringify({ gross, net }), JSON.stringify({ synthetic: true, base, variable, deductions }),
      );
    }
  }
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-payroll.ts')) seedPayrollDemoData().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
