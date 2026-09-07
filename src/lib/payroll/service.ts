import { logAudit } from "@/lib/auditLog";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { PayrollServiceError } from "./service-foundation";
import { createRun, createPeriod, createGroup, assignPayrollProfile } from "./setup-actions";
import { runAction } from "./run-actions";
import { compensationAction } from "./compensation-actions";
import { benefitAction } from "./benefit-actions";

type Row = Record<string, unknown>;

export async function mutatePayroll(
  input: PayrollActionInput,
  access: PayrollAccess,
  actorId: string,
) {
  const approvalActions = [
    "approve",
    "return",
    "resolve_exception",
    "waive_exception",
    "resolve_variance",
    "waive_variance",
    "reassign_approval",
    "approve_change",
    "reject_change",
    "approve_enrollment",
    "return_enrollment",
  ];
  if (approvalActions.includes(input.action) && !access.canApprove) {
    throw new PayrollServiceError(
      "FORBIDDEN",
      "Payroll approval permission is required.",
      403,
    );
  }
  if (
    !access.canManage &&
    !(approvalActions.includes(input.action) && access.canApprove)
  ) {
    throw new PayrollServiceError(
      "FORBIDDEN",
      "Payroll management or approval permission is required.",
      403,
    );
  }
  try {
    const result =
      input.action === "assign_payroll_profile"
        ? await assignPayrollProfile(input, access, actorId)
        : input.action === "create_group"
          ? await createGroup(input, access, actorId)
          : input.action === "create_period"
            ? await createPeriod(input, access, actorId)
            : input.action === "create_run"
              ? await createRun(input, access, actorId)
              : "runId" in input
                ? await runAction(input, access, actorId)
                : [
                      "create_change",
                      "submit_change",
                      "approve_change",
                      "reject_change",
                    ].includes(input.action)
                  ? await compensationAction(
                      input as Extract<
                        PayrollActionInput,
                        { action: "create_change" }
                      >,
                      access,
                      actorId,
                    )
                  : await benefitAction(
                      input as Extract<
                        PayrollActionInput,
                        { action: "create_plan" }
                      >,
                      access,
                    );
    await logAudit(
      "AUDIT",
      `Payroll action completed: ${input.action}.`,
      `Payroll:${input.action}`,
      actorId,
      { entityId: (result as Row)?.id },
    );
    return result;
  } catch (error) {
    if (error instanceof PayrollServiceError) throw error;
    console.error("[Payroll workspace] action failed", error);
    if (input.action === "collect_inputs") {
      throw new PayrollServiceError(
        "INPUT_COLLECTION_FAILED",
        "Payroll could not collect the inputs. Check the payroll period and approved input records, then try again.",
        500,
      );
    }
    throw new PayrollServiceError(
      "ACTION_FAILED",
      "Payroll could not complete that action.",
      500,
    );
  }
}

export { getPayrollWorkspace } from "./workspace-queries";
export { PayrollServiceError } from "./service-foundation";
