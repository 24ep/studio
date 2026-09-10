import prisma from "@/lib/prisma";
import type { PayrollAccess, PayrollResource, PayrollWorkspacePayload } from "./contracts";
import { calculatePayrollReadiness, payrollRunCompletion } from "./workflow-rules";
import { PayrollServiceError, formatDateLabel, formatReviewDateTimeLabel, mapMoneyRows, number, scope } from "./service-foundation";

type Row = Record<string, unknown>;

async function common(companyId: string | null) {
  const [periods, groups, employees] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT id, name, start_date, end_date, pay_date, status, version
       FROM hr_payroll_periods WHERE ($1::uuid IS NULL OR company_id = $1::uuid OR company_id IS NULL)
       ORDER BY pay_date DESC LIMIT 24`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT id, code, name, pay_frequency, currency, timezone, payment_method, status, version
       FROM hr_payroll_groups WHERE ($1::uuid IS NULL OR company_id = $1::uuid)
      ORDER BY name`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT employee.id, employee.user_id, employee.employee_number, concat(employee.first_name, ' ', employee.last_name) name,
              employee.job_title, employee.department_id, department.name department_name,
              employee.employment_type, employee.status, employee.hire_date, employee.location,
              COALESCE(account_user."avatarUrl", employee.profile_photo_url) avatar_url
       FROM hr_employees employee
       LEFT JOIN hr_departments department ON department.id = employee.department_id
       LEFT JOIN "User" account_user ON account_user.id = employee.user_id
       WHERE employee.status IN ('active','probation','onboarding','notice')
         AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       ORDER BY employee.first_name, employee.last_name LIMIT 1000`,
      companyId,
    ),
  ]);
  return { periods, groups, employees };
}

async function expenseClaimsReady(companyId: string | null) {
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ expenses_ready: number }>
    >(
      `SELECT COUNT(*)::int AS expenses_ready
       FROM expense_claims
       WHERE status = 'approved' AND payment_status = 'not_ready'
         AND ($1::uuid IS NULL OR company_id = $1::uuid)`,
      companyId,
    );
    return number(rows[0]?.expenses_ready);
  } catch (error) {
    // Expenses is an optional upstream integration. Its migration may be deployed
    // independently, so an unavailable claims table must not disable Payroll.
    console.warn(
      "[Payroll workspace] Expense claims readiness is unavailable",
      error,
    );
    return 0;
  }
}

async function overview(companyId: string | null) {
  const [metrics, currentRuns, readiness, integrations, expensesReady] =
    await Promise.all([
      prisma.$queryRawUnsafe<Row[]>(
        `SELECT
         COUNT(*)::int AS employees,
         COUNT(*) FILTER (WHERE profile.id IS NULL)::int AS missing_payroll_profile,
         COUNT(*) FILTER (WHERE compensation.id IS NULL)::int AS missing_compensation,
         COUNT(*) FILTER (WHERE COALESCE(profile.payment_method, 'bank_transfer') = 'bank_transfer'
                            AND COALESCE(employee.bank_information, '{}'::jsonb) = '{}'::jsonb)::int AS missing_bank_details,
         COUNT(*) FILTER (WHERE COALESCE(employee.tax_information, '{}'::jsonb) = '{}'::jsonb)::int AS missing_tax_information,
         COUNT(*) FILTER (WHERE profile.id IS NULL OR profile.payroll_group_id IS NULL OR NOT EXISTS (
           SELECT 1 FROM hr_payroll_groups payroll_group
            WHERE payroll_group.id = profile.payroll_group_id
              AND payroll_group.status = 'active'
              AND ($1::uuid IS NULL OR payroll_group.company_id = $1::uuid)
         ))::int AS missing_payroll_group,
         EXISTS(SELECT 1 FROM hr_payroll_periods configured_period
                 WHERE configured_period.status = 'open'
                   AND ($1::uuid IS NULL OR configured_period.company_id = $1::uuid OR configured_period.company_id IS NULL)) AS period_configured
       FROM hr_employees employee
       LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id AND profile.status = 'active'
       LEFT JOIN LATERAL (
         SELECT package.id FROM hr_compensation_packages package
         WHERE package.employee_id = employee.id AND package.status = 'approved'
           AND package.effective_from <= CURRENT_DATE
           AND (package.effective_to IS NULL OR package.effective_to >= CURRENT_DATE)
         ORDER BY package.effective_from DESC LIMIT 1
       ) compensation ON TRUE
       WHERE employee.status IN ('active','probation','onboarding')
         AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)`,
        companyId,
      ),
      prisma.$queryRawUnsafe<Row[]>(
        `SELECT run.id, run.status, run.run_type, run.employee_count, run.gross_total,
              run.total_deductions, run.net_total, run.employer_cost, run.approval_status,
              run.payment_status, run.reconciliation_status, run.version, run.approved_by_id, run.approved_at,
              concat(approved_by.name, ' ', approved_by.email) AS review_owner_name,
              period.name AS period_name, period.start_date, period.end_date, period.pay_date,
              payroll_group.name AS payroll_group_name,
              (SELECT COUNT(*) FROM hr_payroll_exceptions exception WHERE exception.payroll_run_id = run.id AND exception.status = 'open')::int AS exception_count,
              (SELECT COUNT(*) FROM hr_payroll_variances variance WHERE variance.payroll_run_id = run.id AND variance.status = 'open')::int AS variance_count
      FROM hr_payroll_runs run
      JOIN hr_payroll_periods period ON period.id = run.period_id
      LEFT JOIN "User" approved_by ON approved_by.id = run.approved_by_id
      LEFT JOIN hr_payroll_groups payroll_group ON payroll_group.id = run.payroll_group_id
      WHERE ($1::uuid IS NULL OR run.company_id = $1::uuid)
      ORDER BY period.pay_date DESC, run.created_at DESC LIMIT 8`,
        companyId,
      ),
      prisma.$queryRawUnsafe<Row[]>(
        `SELECT issue_type, severity, employee_id, employee_name, reason, source_module, required_action
       FROM (
         SELECT 'payroll_profile' issue_type, 'blocking' severity, employee.id employee_id,
                concat(employee.first_name, ' ', employee.last_name) employee_name,
                'Employee has no payroll profile' reason, 'Employee' source_module,
                'Assign a payroll group and payment method' required_action
         FROM hr_employees employee LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id
         WHERE profile.id IS NULL AND employee.status IN ('active','probation','onboarding')
           AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
         UNION ALL
         SELECT 'compensation', 'blocking', employee.id, concat(employee.first_name, ' ', employee.last_name),
                'No effective approved compensation', 'Compensation', 'Create or approve a compensation package'
         FROM hr_employees employee
         WHERE employee.status IN ('active','probation','onboarding')
           AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
           AND NOT EXISTS (SELECT 1 FROM hr_compensation_packages package WHERE package.employee_id = employee.id
             AND package.status = 'approved' AND package.effective_from <= CURRENT_DATE
             AND (package.effective_to IS NULL OR package.effective_to >= CURRENT_DATE))
         UNION ALL
         SELECT 'bank_details', 'requires_review', employee.id, concat(employee.first_name, ' ', employee.last_name),
                'Bank payment information is incomplete', 'Employee', 'Complete the employee bank-information record'
         FROM hr_employees employee
         LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id AND profile.status = 'active'
         WHERE COALESCE(profile.payment_method, 'bank_transfer') = 'bank_transfer'
           AND COALESCE(employee.bank_information, '{}'::jsonb) = '{}'::jsonb
           AND employee.status IN ('active','probation','onboarding')
           AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
         UNION ALL
         SELECT 'payroll_group', 'blocking', employee.id, concat(employee.first_name, ' ', employee.last_name),
                'Employee has no payroll group', 'Employee', 'Assign an active payroll group'
         FROM hr_employees employee
         LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id AND profile.status = 'active'
         WHERE profile.id IS NOT NULL
           AND (profile.payroll_group_id IS NULL OR NOT EXISTS (
             SELECT 1 FROM hr_payroll_groups payroll_group
              WHERE payroll_group.id = profile.payroll_group_id
                AND payroll_group.status = 'active'
                AND ($1::uuid IS NULL OR payroll_group.company_id = $1::uuid)
           ))
           AND employee.status IN ('active','probation','onboarding')
           AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
         UNION ALL
         SELECT 'tax_information', 'requires_review', employee.id, concat(employee.first_name, ' ', employee.last_name),
                'Tax information is incomplete', 'Employee', 'Complete the employee tax-information record'
         FROM hr_employees employee
         WHERE COALESCE(employee.tax_information, '{}'::jsonb) = '{}'::jsonb
           AND employee.status IN ('active','probation','onboarding')
           AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       ) issues ORDER BY CASE severity WHEN 'blocking' THEN 1 ELSE 2 END, employee_name LIMIT 100`,
        companyId,
      ),
      prisma.$queryRawUnsafe<Row[]>(
        `SELECT
        (SELECT COUNT(*) FROM hr_payroll_attendance_exports WHERE status = 'ready')::int AS attendance_ready,
        (SELECT COUNT(*) FROM hr_leave_payroll_exports WHERE status IN ('prepared','ready'))::int AS leave_ready,
        (SELECT COUNT(*) FROM hr_payroll_inputs WHERE approval_status = 'approved' AND status = 'ready' AND ($1::uuid IS NULL OR company_id = $1::uuid))::int AS manual_inputs_ready`,
        companyId,
      ),
      expenseClaimsReady(companyId),
    ]);
  const metric = metrics[0] || {};
  const readinessResult = calculatePayrollReadiness({
    employees: number(metric.employees),
    periodConfigured: Boolean(metric.period_configured),
    missingPayrollProfile: number(metric.missing_payroll_profile),
    missingCompensation: number(metric.missing_compensation),
    missingBankDetails: number(metric.missing_bank_details),
    missingTaxInformation: number(metric.missing_tax_information),
    missingPayrollGroup: number(metric.missing_payroll_group),
  });
  const current = currentRuns[0] || {};
  const previous = currentRuns[1] || {};
  return {
    summary: {
      employees: number(metric.employees),
      notReady:
        number(metric.missing_payroll_profile) +
        number(metric.missing_compensation) +
        Math.max(
          0,
          number(metric.missing_payroll_group) -
            number(metric.missing_payroll_profile),
        ),
      readiness: readinessResult.score,
      missingPayrollProfile: number(metric.missing_payroll_profile),
      missingCompensation: number(metric.missing_compensation),
      missingBankDetails: number(metric.missing_bank_details),
      missingTaxInformation: number(metric.missing_tax_information),
      missingPayrollGroup: number(metric.missing_payroll_group),
      currentStatus: String(currentRuns[0]?.status || "No active run"),
      currentPeriod: String(currentRuns[0]?.period_name || "Not configured"),
      cutoffLabel: formatDateLabel(currentRuns[0]?.end_date),
      payDateLabel: formatDateLabel(currentRuns[0]?.pay_date),
      reviewOwner: String(currentRuns[0]?.review_owner_name || ""),
      reviewedAtLabel: formatReviewDateTimeLabel(currentRuns[0]?.approved_at),
      gross: number(current.gross_total),
      deductions: number(current.total_deductions),
      employerContributions: Math.max(
        0,
        number(current.employer_cost) - number(current.gross_total),
      ),
      net: number(current.net_total),
      priorGross: number(previous.gross_total),
      priorDeductions: number(previous.total_deductions),
      priorEmployerContributions: Math.max(
        0,
        number(previous.employer_cost) - number(previous.gross_total),
      ),
      priorNet: number(previous.net_total),
    },
    records: mapMoneyRows(currentRuns),
    secondary: integrations.map((integration) => ({
      ...integration,
      expenses_ready: expensesReady,
      period_readiness: readinessResult.checks.period,
      payroll_profile_readiness: readinessResult.checks.payrollProfile,
      compensation_readiness: readinessResult.checks.compensation,
      payroll_group_readiness: readinessResult.checks.payrollGroup,
      bank_details_readiness: readinessResult.checks.bankDetails,
      tax_information_readiness: readinessResult.checks.taxInformation,
    })),
    issues: readiness,
  };
}

async function runs(companyId: string | null) {
  const records = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT run.*, period.name AS period_name, period.start_date, period.end_date, period.pay_date,
            payroll_group.name AS payroll_group_name,
            concat(creator.name, ' ', creator.email) AS owner_name,
            (SELECT COALESCE(jsonb_agg(
               jsonb_build_object(
                 'id', approval.id,
                 'sequence', approval.sequence,
                 'role', approval.approval_role,
                 'status', approval.status,
                 'approver_id', approval.approver_user_id,
                 'approver_name', concat(approver.name, ' ', approver.email),
                 'decision_reason', approval.decision_reason,
                 'decided_at', approval.decided_at
               ) ORDER BY approval.sequence
             ), '[]'::jsonb)
             FROM hr_payroll_approvals approval
             LEFT JOIN "User" approver ON approver.id = approval.approver_user_id
             WHERE approval.payroll_run_id = run.id) AS approval_steps,
            (SELECT COUNT(*) FROM hr_payroll_exceptions exception WHERE exception.payroll_run_id = run.id AND exception.status = 'open')::int AS exception_count,
            (SELECT COUNT(*) FROM hr_payroll_variances variance WHERE variance.payroll_run_id = run.id AND variance.status = 'open')::int AS variance_count,
            (SELECT COUNT(*) FROM hr_payslips payslip JOIN hr_payroll_run_items item ON item.id = payslip.payroll_run_item_id
              WHERE item.payroll_run_id = run.id AND payslip.status <> 'released')::int AS unreleased_payslip_count,
            (SELECT COUNT(*) FROM hr_payslips payslip JOIN hr_payroll_run_items item ON item.id = payslip.payroll_run_item_id
              WHERE item.payroll_run_id = run.id AND payslip.status = 'released')::int AS released_payslip_count
            ,(SELECT reversal.id FROM hr_payroll_runs reversal
               WHERE reversal.reversal_of_id = run.id
               ORDER BY reversal.created_at DESC LIMIT 1) AS reversal_run_id
            ,(SELECT reversal.status FROM hr_payroll_runs reversal
               WHERE reversal.reversal_of_id = run.id
               ORDER BY reversal.created_at DESC LIMIT 1) AS reversal_run_status
     FROM hr_payroll_runs run
     JOIN hr_payroll_periods period ON period.id = run.period_id
     LEFT JOIN hr_payroll_groups payroll_group ON payroll_group.id = run.payroll_group_id
     LEFT JOIN "User" creator ON creator.id = run.created_by_id
     WHERE ($1::uuid IS NULL OR run.company_id = $1::uuid)
     ORDER BY period.pay_date DESC, run.created_at DESC LIMIT 100`,
    companyId,
  );
  const totals = records.reduce<{
    gross: number;
    net: number;
    deductions: number;
    employees: number;
  }>(
    (acc, row) => ({
      gross: acc.gross + number(row.gross_total),
      net: acc.net + number(row.net_total),
      deductions: acc.deductions + number(row.total_deductions),
      employees: acc.employees + number(row.employee_count),
    }),
    { gross: 0, net: 0, deductions: 0, employees: 0 },
  );
  records.forEach((row) => {
    row.completion = payrollRunCompletion(row.status);
  });
  const [issues, audit] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT exception.id, exception.payroll_run_id, 'exception' AS issue_kind, exception.code AS label,
              exception.severity, exception.message, exception.status, exception.resolution,
              concat(employee.first_name, ' ', employee.last_name) AS employee_name, exception.created_at, exception.resolved_at
         FROM hr_payroll_exceptions exception JOIN hr_payroll_runs run ON run.id = exception.payroll_run_id
         LEFT JOIN hr_employees employee ON employee.id = exception.employee_id
        WHERE ($1::uuid IS NULL OR run.company_id = $1::uuid)
       UNION ALL
       SELECT variance.id, variance.payroll_run_id, 'variance', variance.metric, 'warning',
              concat('Net pay variance ', round(COALESCE(variance.variance_percent, 0), 2), '%'), variance.status,
              variance.explanation, concat(employee.first_name, ' ', employee.last_name), variance.created_at, variance.resolved_at
         FROM hr_payroll_variances variance JOIN hr_payroll_runs run ON run.id = variance.payroll_run_id
         LEFT JOIN hr_employees employee ON employee.id = variance.employee_id
        WHERE ($1::uuid IS NULL OR run.company_id = $1::uuid)
        ORDER BY created_at DESC LIMIT 500`,
      companyId,
    ),
    prisma
      .$queryRawUnsafe<Row[]>(
        `SELECT event.id, event.occurred_at, event.action, event.message, event.outcome,
              concat(actor.name, ' ', actor.email) AS actor_name, event.entity_id AS payroll_run_id, event.reason
         FROM audit_events event LEFT JOIN "User" actor ON actor.id = event.actor_user_id
        WHERE event.entity_type = 'payroll-run'
          AND event.entity_id IN (SELECT id::text FROM hr_payroll_runs WHERE ($1::uuid IS NULL OR company_id = $1::uuid))
        ORDER BY event.occurred_at DESC LIMIT 300`,
        companyId,
      )
      .catch(() => []),
  ]);
  return {
    summary: { runCount: records.length, ...totals },
    records: mapMoneyRows(records),
    secondary: audit,
    issues: mapMoneyRows(issues),
  };
}

async function compensation(companyId: string | null) {
  const [packages, changes] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT package.id, package.employee_id, concat(employee.first_name, ' ', employee.last_name) employee_name,
              employee.employee_number, employee.job_title, package.base_salary, package.currency,
              package.pay_frequency, package.components, package.effective_from, package.effective_to,
              package.status, package.version
       FROM hr_compensation_packages package JOIN hr_employees employee ON employee.id = package.employee_id
       WHERE ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       ORDER BY package.effective_from DESC LIMIT 200`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT change.*, concat(employee.first_name, ' ', employee.last_name) employee_name, employee.employee_number
       FROM hr_compensation_changes change JOIN hr_employees employee ON employee.id = change.employee_id
       WHERE ($1::uuid IS NULL OR change.company_id = $1::uuid)
       ORDER BY change.created_at DESC LIMIT 100`,
      companyId,
    ),
  ]);
  const active = packages.filter(
    (row) =>
      !row.effective_to || new Date(String(row.effective_to)) >= new Date(),
  );
  return {
    summary: {
      activePackages: active.length,
      pendingChanges: changes.filter((row) =>
        ["draft", "pending_approval"].includes(String(row.status)),
      ).length,
      annualBase: active.reduce(
        (sum, row) => sum + number(row.base_salary) * 12,
        0,
      ),
    },
    records: mapMoneyRows(packages),
    secondary: mapMoneyRows(changes),
    issues: [],
  };
}

export async function benefits(companyId: string | null) {
  const [plans, enrollments] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT plan.*, (SELECT COUNT(*) FROM hr_employee_benefit_enrollments enrollment WHERE enrollment.benefit_plan_id = plan.id AND enrollment.status = 'active')::int AS enrollment_count
       FROM hr_benefit_plans plan WHERE ($1::uuid IS NULL OR plan.company_id = $1::uuid OR plan.company_id IS NULL)
       ORDER BY plan.is_active DESC, plan.name`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT enrollment.*, plan.name plan_name, plan.type plan_type,
              employee.id employee_id, concat(employee.first_name, ' ', employee.last_name) employee_name,
              employee.employee_number, employee.job_title position, employee.employment_type,
              employee.hire_date joined_at, employee.location
       FROM hr_employee_benefit_enrollments enrollment
       JOIN hr_benefit_plans plan ON plan.id = enrollment.benefit_plan_id
       JOIN hr_employees employee ON employee.id = enrollment.employee_id
       WHERE ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       ORDER BY enrollment.created_at DESC LIMIT 200`,
      companyId,
    ),
  ]);
  return {
    summary: {
      activePlans: plans.filter((row) => row.is_active).length,
      activeEnrollments: enrollments.filter((row) => row.status === "active")
        .length,
      employeeContribution: enrollments.reduce(
        (sum, row) => sum + number(row.employee_contribution),
        0,
      ),
      employerContribution: enrollments.reduce(
        (sum, row) => sum + number(row.employer_contribution),
        0,
      ),
    },
    records: mapMoneyRows(plans),
    secondary: mapMoneyRows(enrollments),
    issues: [],
  };
}

async function reports(companyId: string | null) {
  const [register, exports, accounting] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT period.name period_name, period.pay_date, run.run_type, run.status,
              run.employee_count, run.gross_total, run.total_deductions, run.net_total,
              run.employer_cost, run.payment_status, run.accounting_status, run.reconciliation_status
       FROM hr_payroll_runs run JOIN hr_payroll_periods period ON period.id = run.period_id
       WHERE ($1::uuid IS NULL OR run.company_id = $1::uuid)
       ORDER BY period.pay_date DESC LIMIT 120`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT export.id, export.export_type, export.status, export.totals, export.generated_at,
              export.reconciled_at, period.name period_name
       FROM hr_payroll_exports export
       JOIN hr_payroll_runs run ON run.id = export.payroll_run_id
       JOIN hr_payroll_periods period ON period.id = run.period_id
       WHERE ($1::uuid IS NULL OR export.company_id = $1::uuid)
       ORDER BY export.created_at DESC LIMIT 100`,
      companyId,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT entry.reference, entry.accounting_date, entry.currency, entry.total_debit,
              entry.total_credit, entry.status, period.name period_name
       FROM hr_payroll_accounting_entries entry
       JOIN hr_payroll_runs run ON run.id = entry.payroll_run_id
       JOIN hr_payroll_periods period ON period.id = run.period_id
       WHERE ($1::uuid IS NULL OR entry.company_id = $1::uuid)
       ORDER BY entry.accounting_date DESC LIMIT 100`,
      companyId,
    ),
  ]);
  return {
    summary: {
      periods: register.length,
      gross: register.reduce((sum, row) => sum + number(row.gross_total), 0),
      net: register.reduce((sum, row) => sum + number(row.net_total), 0),
      employerCost: register.reduce(
        (sum, row) => sum + number(row.employer_cost),
        0,
      ),
      pendingReconciliation: register.filter(
        (row) =>
          ["paid", "reconciliation_pending"].includes(String(row.status)) &&
          String(row.reconciliation_status) !== "reconciled",
      ).length,
    },
    records: mapMoneyRows(register),
    secondary: [...exports, ...mapMoneyRows(accounting)],
    issues: [],
  };
}

async function payslips(companyId: string | null, access: PayrollAccess) {
  const employeeFilter = access.canView ? null : access.actorEmployeeId;
  const records = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT payslip.id, payslip.employee_id, payslip.payroll_run_item_id, payslip.payroll_period_id,
            concat(employee.first_name, ' ', employee.last_name) employee_name,
            employee.employee_number, employee.job_title,
            department.name AS department, period.name AS period_name, period.pay_date,
            payslip.status, payslip.currency, payslip.gross_pay, payslip.total_deductions, payslip.net_pay,
            payslip.year_to_date, payslip.breakdown, payslip.published_at, payslip.version, payslip.file_path,
            payslip.created_at, payslip.updated_at, payslip.download_count, payslip.last_downloaded_at,
            CASE WHEN payslip.status = 'released' OR payslip.file_path IS NOT NULL THEN true ELSE false END AS downloadable,
            payment.payment_method, payment.payment_destination
     FROM hr_payslips payslip
     JOIN hr_employees employee ON employee.id = payslip.employee_id
     LEFT JOIN hr_departments department ON department.id = employee.department_id
     LEFT JOIN hr_payroll_periods period ON period.id = payslip.payroll_period_id
     LEFT JOIN LATERAL (
       SELECT pay.payment_method, pay.payment_destination
       FROM hr_payroll_payments pay
       WHERE pay.payroll_run_item_id = payslip.payroll_run_item_id
       ORDER BY pay.created_at DESC
       LIMIT 1
     ) payment ON true
     WHERE ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       AND ($2::uuid IS NULL OR payslip.employee_id = $2::uuid)
       AND ($2::uuid IS NULL OR payslip.status = 'released')
     ORDER BY period.pay_date DESC NULLS LAST, payslip.created_at DESC LIMIT 120`,
    companyId,
    employeeFilter,
  );

  const enriched: Row[] = records.map((record) => {
    const status = String(record.status || "draft");
    const downloadCount = number(record.download_count);
    const hasDownload = downloadCount > 0 || Boolean(record.last_downloaded_at);
    const deliveryStatus =
      status === "released"
        ? hasDownload
          ? "delivered"
          : "unopened"
        : "issue";
    const lastActivity =
      record.last_downloaded_at ||
      record.published_at ||
      record.updated_at ||
      record.created_at;
    return {
      ...record,
      delivery_status: deliveryStatus,
      last_activity: lastActivity,
    } as Row;
  });
  const releasedRows = enriched.filter(
    (record) => String(record.delivery_status) !== "issue",
  );
  const deliveredRows = enriched.filter(
    (record) => String(record.delivery_status) === "delivered",
  );
  const unopenedRows = enriched.filter(
    (record) => String(record.delivery_status) === "unopened",
  );
  const issueRows = enriched.filter(
    (record) => String(record.delivery_status) === "issue",
  );
  const publishedValues = releasedRows
    .map((row) =>
      row.published_at ? new Date(String(row.published_at)).getTime() : NaN,
    )
    .filter((value) => Number.isFinite(value));

  return {
    summary: {
      released: releasedRows.length,
      delivered: deliveredRows.length,
      unopened: unopenedRows.length,
      issues: issueRows.length,
      totalNet: records.reduce((sum, row) => sum + number(row.net_pay), 0),
      lastReleasedAt: publishedValues.length
        ? String(new Date(Math.max(...publishedValues)).toISOString())
        : "",
      totalDownloaded: deliveredRows.reduce(
        (sum, row) => sum + number(row.download_count),
        0,
      ),
      recordsWithDownload: deliveredRows.length,
    },
    records: mapMoneyRows(enriched),
    secondary: [],
    issues: [],
  };
}

export async function getPayrollWorkspace(
  resource: PayrollResource,
  access: PayrollAccess,
  requestedCompanyId?: string | null,
): Promise<PayrollWorkspacePayload> {
  if (!access.canView && resource !== "payslips")
    throw new PayrollServiceError(
      "FORBIDDEN",
      "Payroll view permission is required.",
      403,
    );
  if (resource === "payslips" && !access.canView && !access.actorEmployeeId)
    throw new PayrollServiceError(
      "FORBIDDEN",
      "An employee payroll profile is required.",
      403,
    );
  const companyId = scope(access, requestedCompanyId);
  try {
    const [data, shared] = await Promise.all([
      resource === "overview"
        ? overview(companyId)
        : resource === "runs"
          ? runs(companyId)
          : resource === "compensation"
            ? compensation(companyId)
            : resource === "benefits"
              ? benefits(companyId)
              : resource === "reports"
                ? reports(companyId)
                : payslips(companyId, access),
      common(companyId),
    ]);
    return {
      resource,
      generatedAt: new Date().toISOString(),
      companyId,
      access: {
        canView: access.canView,
        canManage: access.canManage,
        canApprove: access.canApprove,
        canExport: access.canExport,
        isAdmin: access.isAdmin,
        actorUserRole: access.actorUserRole,
        actorJobTitle: access.actorJobTitle,
        actorDepartment: access.actorDepartment,
      },
      ...data,
      ...shared,
    };
  } catch (error) {
    if (error instanceof PayrollServiceError) throw error;
    console.error("[Payroll workspace] load failed", error);
    throw new PayrollServiceError(
      "RESOURCE_UNAVAILABLE",
      "Apply the Payroll operations migration to enable this workspace.",
      503,
    );
  }
}
