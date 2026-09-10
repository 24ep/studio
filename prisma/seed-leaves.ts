import { randomUUID } from 'crypto';
import prisma from '../src/lib/prisma';

export async function seedLeaveDemoData() {
  const policies = [
    { name: 'Thailand Annual Leave', leaveType: 'annual', allowance: 12, accrual: 1, encashable: true, retained: 3, maximum: 5 },
    { name: 'Medical Leave & Recovery', leaveType: 'sick', allowance: 30, accrual: null, encashable: false, retained: 0, maximum: null },
    { name: 'Family Care Leave', leaveType: 'personal', allowance: 5, accrual: null, encashable: false, retained: 0, maximum: null },
  ];
  for (const policy of policies) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "hr_leave_policies"
        (id, name, leave_type, annual_allowance, requires_approval, is_active, allow_half_day,
         allow_hourly, exclude_weekends, exclude_holidays, minimum_notice_days,
         accrual_frequency, accrual_rate, encashment_eligible, minimum_retained_balance,
         maximum_encashment_units, effective_from, version, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $4, true, true, true, $5, true, true, $6,
              $7, $8, $9, $10, $11, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 1),
              1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET
        annual_allowance = EXCLUDED.annual_allowance,
        accrual_frequency = EXCLUDED.accrual_frequency,
        accrual_rate = EXCLUDED.accrual_rate,
        encashment_eligible = EXCLUDED.encashment_eligible,
        minimum_retained_balance = EXCLUDED.minimum_retained_balance,
        maximum_encashment_units = EXCLUDED.maximum_encashment_units,
        updated_at = CURRENT_TIMESTAMP
    `, randomUUID(), policy.name, policy.leaveType, policy.allowance, policy.leaveType === 'annual',
    policy.leaveType === 'annual' ? 3 : 0, policy.accrual ? 'monthly' : 'annual', policy.accrual,
    policy.encashable, policy.retained, policy.maximum);
  }

  const employees = await prisma.$queryRawUnsafe<Array<{ id: string; hire_date: Date | null }>>(
    `SELECT id, hire_date FROM "hr_employees" WHERE status = 'active' ORDER BY created_at LIMIT 12`,
  );
  const activePolicies = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; annual_allowance: number }>>(
    `SELECT id, name, annual_allowance FROM "hr_leave_policies"
     WHERE name IN ('Thailand Annual Leave', 'Medical Leave & Recovery', 'Family Care Leave')`,
  );
  const year = new Date().getFullYear();
  for (const employee of employees) {
    for (const policy of activePolicies) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "hr_leave_policy_assignments"
          (id, policy_id, employee_id, assignment_type, effective_from, priority, source,
           status, notes, created_at, updated_at)
        SELECT $1::uuid, $2::uuid, $3::uuid, 'employee', make_date($4, 1, 1), 100,
               'seed_eligibility', 'active', 'Eligible active employee population',
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
          SELECT 1 FROM "hr_leave_policy_assignments"
          WHERE policy_id = $2::uuid AND employee_id = $3::uuid AND status = 'active'
        )
      `, randomUUID(), policy.id, employee.id, year);
      const balanceId = randomUUID();
      await prisma.$executeRawUnsafe(`
        INSERT INTO "hr_leave_balances"
          (id, employee_id, policy_id, year, allocated, accrued, used, pending, reserved,
           carry_forward, expiring, version, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 0, 0, 0, 0,
                CASE WHEN $6 = 'Thailand Annual Leave' THEN 2 ELSE 0 END,
                CASE WHEN $6 = 'Thailand Annual Leave' THEN 1 ELSE 0 END,
                1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (employee_id, policy_id, year) DO NOTHING
      `, balanceId, employee.id, policy.id, year, policy.annual_allowance, policy.name);
      const balances = await prisma.$queryRawUnsafe<Array<{ id: string; available: number }>>(`
        SELECT id, allocated + accrued + carry_forward - used - pending - reserved AS available
        FROM "hr_leave_balances" WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND year = $3
      `, employee.id, policy.id, year);
      if (balances[0]) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "hr_leave_balance_ledger"
            (id, employee_id, policy_id, balance_id, transaction_type, units, balance_before,
             balance_after, effective_date, source_type, idempotency_key, reason, metadata, created_at)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'annual_entitlement', $5, 0, $6,
                  make_date($7, 1, 1), 'seed_allocation', $8,
                  'Annual entitlement established from the active policy',
                  jsonb_build_object('policyName', $9), CURRENT_TIMESTAMP)
          ON CONFLICT (idempotency_key) DO NOTHING
        `, randomUUID(), employee.id, policy.id, balances[0].id, policy.annual_allowance,
        balances[0].available, year, `seed-leave-opening:${employee.id}:${policy.id}:${year}`, policy.name);
      }
    }
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO "hr_leave_periods"
      (id, name, period_type, start_date, end_date, status, version, created_at, updated_at)
    SELECT $1::uuid, $2, 'calendar_year', make_date($3, 1, 1), make_date($3, 12, 31),
           'open', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM "hr_leave_periods" WHERE name = $2)
  `, randomUUID(), `${year} Thailand Leave Year`, year);

  if (employees[0]) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "hr_leave_exceptions"
        (id, exception_type, employee_id, severity, status, message, details, created_at, updated_at)
      SELECT $1::uuid, 'policy_review', $2::uuid, 'information', 'open',
             'Review the employee policy after their next service anniversary.',
             jsonb_build_object('source', 'seed-readiness-check'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1 FROM "hr_leave_exceptions"
        WHERE employee_id = $2::uuid AND exception_type = 'policy_review' AND status = 'open'
      )
    `, randomUUID(), employees[0].id);
  }
  console.log(`Leaves seed completed for ${employees.length} active employee(s).`);
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed-leaves.ts')) seedLeaveDemoData()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
