import prisma from '@/lib/prisma';

/** Marks expense reimbursements as being processed by Payroll after their
 * authoritative input has been attached to a run. */
export async function markPayrollSourcesCollected(runId: string) {
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(
      `UPDATE expense_claims claim
          SET status = CASE WHEN claim.status = 'approved' THEN 'reimbursement_processing' ELSE claim.status END,
              payment_status = CASE WHEN COALESCE(claim.payment_status, 'not_ready') = 'not_ready' THEN 'processing' ELSE claim.payment_status END,
              updated_at = now()
        WHERE EXISTS (
          SELECT 1 FROM hr_payroll_inputs payroll_input
           WHERE payroll_input.payroll_run_id = $1::uuid
             AND payroll_input.source_module = 'expenses'
             AND payroll_input.source_record_id = claim.id::text
        )`,
      runId,
    );
    await tx.$executeRawUnsafe(
      `UPDATE expense_reimbursements reimbursement
          SET status = CASE WHEN reimbursement.status = 'ready_for_payment' THEN 'processing' ELSE reimbursement.status END,
              updated_at = now()
        WHERE EXISTS (
          SELECT 1 FROM hr_payroll_inputs payroll_input
           WHERE payroll_input.payroll_run_id = $1::uuid
             AND payroll_input.source_module = 'expenses'
             AND payroll_input.source_record_id = reimbursement.claim_id::text
        )`,
      runId,
    ).catch(() => null);
  });
}

/** Closes the expense reimbursement lifecycle only after the payroll run has
 * passed the controlled external-settlement confirmation. */
export async function markPayrollSourcesPaid(
  runId: string,
  paymentReference?: string,
) {
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(
      `UPDATE expense_claims claim
          SET status = 'paid', payment_status = 'paid', updated_at = now()
        WHERE EXISTS (
          SELECT 1 FROM hr_payroll_inputs payroll_input
           WHERE payroll_input.payroll_run_id = $1::uuid
             AND payroll_input.source_module = 'expenses'
             AND payroll_input.source_record_id = claim.id::text
        )`,
      runId,
    );
    await tx.$executeRawUnsafe(
      `UPDATE expense_reimbursements reimbursement
          SET status = 'paid', payment_reference = COALESCE($2, reimbursement.payment_reference),
              paid_at = COALESCE(reimbursement.paid_at, now()), updated_at = now()
        WHERE EXISTS (
          SELECT 1 FROM hr_payroll_inputs payroll_input
           WHERE payroll_input.payroll_run_id = $1::uuid
             AND payroll_input.source_module = 'expenses'
             AND payroll_input.source_record_id = reimbursement.claim_id::text
        )`,
      runId,
      paymentReference || null,
    ).catch(() => null);
  });
}
