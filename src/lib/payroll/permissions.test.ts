import { describe, expect, it } from "vitest";

import { canAccessPayrollSettlementEvidence } from "./permissions";

describe("payroll settlement evidence access", () => {
  it("does not grant evidence access to a view-only payroll user", () => {
    expect(
      canAccessPayrollSettlementEvidence({
        canManage: false,
        canApprove: false,
        canExport: false,
      }),
    ).toBe(false);
  });

  it.each([
    { canManage: true, canApprove: false, canExport: false },
    { canManage: false, canApprove: true, canExport: false },
    { canManage: false, canApprove: false, canExport: true },
  ])("allows an operational settlement role", (access) => {
    expect(canAccessPayrollSettlementEvidence(access)).toBe(true);
  });
});
