import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Payroll end-to-end journey contract', () => {
  it('turns attendance overtime into a group-scoped taxable earning', () => {
    const attendance = source('src/lib/payroll/attendance-inputs.ts');
    expect(attendance).toContain("'OVERTIME'::text AS component_code");
    expect(attendance).toContain("'earning'::text AS input_type");
    expect(attendance).toContain("'statutoryCategory', 'overtime'");
    expect(attendance).toContain('profile.payroll_group_id = $6::uuid');
    expect(attendance).toContain('every employee present in its payload');
  });

  it('collects unpaid leave and non-taxable expenses before calculation', () => {
    const collection = source('src/lib/payroll/collect-inputs.ts');
    const leave = source('src/lib/payroll/leave-inputs.ts');
    expect(collection).toContain('collectLeavePayrollInputs');
    expect(leave).toContain("'pre_tax_deduction', 'UNPAID_LEAVE'");
    expect(collection).toContain("jsonb_build_object('taxable', false, 'reimbursement', true");
    expect(collection).toContain("COALESCE(claim.payment_status, 'not_ready') = 'not_ready'");
    expect(collection).toContain("existing.source_module = 'expenses'");
    expect(collection).toContain('profile.payroll_group_id = $5::uuid');
  });

  it('continues the expense lifecycle through payroll settlement', () => {
    const lifecycle = source('src/lib/payroll/source-lifecycle.ts');
    const workspaceRoute = source('src/app/api/payroll/workspace/[resource]/route.ts');
    expect(lifecycle).toContain("'reimbursement_processing'");
    expect(lifecycle).toContain("status = 'paid', payment_status = 'paid'");
    expect(workspaceRoute).toContain('markPayrollSourcesCollected');
    expect(workspaceRoute).toContain('markPayrollSourcesPaid');
  });

  it('serves released payslips to ESS through the authoritative protected PDF endpoint', () => {
    const essApi = source('src/app/api/ess/payslips/route.ts');
    const essView = source('src/components/ess/PayslipsView.tsx');
    const payslipApi = source('src/app/api/payroll/v1/payslips/[id]/route.ts');
    expect(essApi).toContain("payslip.status = 'released'");
    expect(essView).toContain('/api/payroll/v1/payslips/');
    expect(essView).not.toContain('/api/ess/files?kind=payslip');
    expect(payslipApi).toContain('href: "/ess/payslips"');
  });

  it('exposes governed manual adjustments and consolidated outputs', () => {
    const inputsApi = source('src/app/api/payroll/v1/inputs/route.ts');
    const inputsPage = source('src/app/payroll/inputs/page.tsx');
    const outputsPage = source('src/app/payroll/outputs/page.tsx');
    const outputs = source('src/components/payroll/PayrollOutputsWorkspace.tsx');
    expect(inputsApi).toContain('Payroll management or approval permission required.');
    expect(inputsApi).toContain('The creator cannot approve or reject their own payroll adjustment.');
    expect(inputsApi).toContain("approval_status = $2, status = $3");
    expect(inputsPage).toContain('PayrollInputsWorkspace');
    expect(outputsPage).toContain('PayrollOutputsWorkspace');
    expect(outputs).toContain('/exports/${type.id}');
  });

  it('separates payroll workflow visibility from sensitive amount visibility', () => {
    const modules = source('src/lib/platform-modules/hr-platform-modules.ts');
    const permissions = source('src/lib/payroll/permissions.ts');
    const redaction = source('src/lib/payroll/amount-visibility.ts');
    const route = source('src/app/api/payroll/workspace/[resource]/route.ts');
    const inputs = source('src/app/api/payroll/v1/inputs/route.ts');
    const timeline = source('src/app/api/hr/v1/employees/[id]/timeline/route.ts');
    expect(modules).toContain("id: 'HR_PAYROLL_AMOUNT_VIEW'");
    expect(permissions).toContain('requestedAmountView');
    expect(redaction).toContain('applyPayrollAmountVisibility');
    expect(route).toContain('applyPayrollAmountVisibility(workspace, resolved.access.canViewAmounts)');
    expect(inputs).toContain('CASE WHEN $2::boolean THEN input.amount ELSE NULL END AS amount');
    expect(timeline).toContain('getPayrollAccess(session.user)');
    expect(timeline).toContain("payslip.status = 'released'");
    expect(timeline).toContain("'amountVisibility', CASE WHEN");
    expect(timeline).not.toContain("'paymentDestination', item.payment_destination");
  });

  it('replaces prompt-based governance with a controlled boundary and continues blocker links', () => {
    const runs = source('src/components/payroll/PayrollRunsWorkspace.tsx');
    const governance = source('src/components/payroll/PayrollRunGovernanceBoundary.tsx');
    const focus = source('src/components/hr/PayrollEmployeeFocusBridge.tsx');
    expect(runs).toContain('PayrollRunGovernanceBoundary');
    expect(governance).toContain('Reason / control note');
    expect(governance).toContain('reassign_approval');
    expect(governance).toContain('waive_variance');
    expect(focus).toContain('bank-details');
    expect(focus).toContain('tax-details');
  });

  it('persists custom payroll run types and mounts the selector rehydration boundary', () => {
    const registry = source('src/lib/payroll/run-type-registry.ts');
    const route = source('src/app/api/payroll/workspace/[resource]/route.ts');
    const boundary = source('src/components/payroll/PayrollRunTypeBoundary.tsx');
    const runs = source('src/components/payroll/PayrollRunsWorkspace.tsx');
    expect(registry).toContain('PAYROLL_RUN_TYPES_SETTING_KEY');
    expect(registry).toContain('ON CONFLICT (key) DO UPDATE');
    expect(route).toContain('rememberPayrollRunType(parsed.data.runType)');
    expect(boundary).toContain('/api/payroll/v1/run-types');
    expect(boundary).toContain('__create_new_type__');
    expect(runs).toContain('<PayrollRunTypeBoundary>');
  });

  it('makes payroll calculation assumptions editable through audited admin configuration', () => {
    const config = source('src/lib/payroll-approval-route-config.ts');
    const card = source('src/app/settings/payroll-approval-routes/PayrollCalculationAssumptionsCard.tsx');
    const settingsPage = source('src/app/settings/payroll-approval-routes/page.tsx');
    expect(config).toContain('overtimeMultiplier: z.number().positive().max(10).default(1.5)');
    expect(config).toContain('standardHoursPerDay: z.number().positive().max(24).default(8)');
    expect(config).toContain('salaryDaysPerMonth: z.number().positive().max(31).default(30)');
    expect(card).toContain('Payroll calculation assumptions');
    expect(card).toContain('overtimeMultiplier');
    expect(card).toContain('standardHoursPerDay');
    expect(card).toContain('salaryDaysPerMonth');
    expect(settingsPage).toContain('PayrollCalculationAssumptionsCard');
  });

  it('adds employee payslips and payroll operations destinations to shared navigation', () => {
    const navigation = source('src/components/layout/use-header-navigation-categories.ts');
    expect(navigation).toContain('/ess/payslips');
    expect(navigation).toContain('/payroll/inputs');
    expect(navigation).toContain('/payroll/outputs');
  });
});
