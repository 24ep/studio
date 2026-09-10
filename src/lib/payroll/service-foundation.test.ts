import { describe, expect, it } from "vitest";

import {
  PayrollServiceError,
  approvalStepStatusLabel,
  assertPayrollStepResponsibility,
  mapMoneyRows,
  matchesResponsibility,
  number,
} from "./service-foundation";

describe("payroll service foundation", () => {
  it("normalizes responsibility labels without weakening role matching", () => {
    expect(
      matchesResponsibility("Payroll Manager", "Senior Payroll Manager"),
    ).toBe(true);
    expect(
      matchesResponsibility("Finance Approver", "Engineering Manager"),
    ).toBe(false);
  });

  it("enforces assigned approvers", () => {
    const access = {
      isAdmin: false,
      actorUserRole: "manager",
      actorJobTitle: "Payroll Manager",
      actorDepartment: "Finance",
    } as never;
    expect(() =>
      assertPayrollStepResponsibility(access, "actor-1", {
        approver_user_id: "actor-2",
      }),
    ).toThrow(PayrollServiceError);
    expect(() =>
      assertPayrollStepResponsibility(access, "actor-1", {
        approval_role: "Payroll Manager",
      }),
    ).not.toThrow();
  });

  it("normalizes money rows and workflow labels", () => {
    expect(number("12.5")).toBe(12.5);
    expect(
      mapMoneyRows([
        { total_amount: "9.25", created_at: new Date("2026-08-13T00:00:00Z") },
      ]),
    ).toEqual([{ total_amount: 9.25, created_at: "2026-08-13T00:00:00.000Z" }]);
    expect(approvalStepStatusLabel("rejected")).toBe("returned");
  });
});
