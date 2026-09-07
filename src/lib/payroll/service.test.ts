import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayrollAccess } from "./contracts";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ default: {
  $queryRawUnsafe: mocks.query,
  $transaction: mocks.transaction,
} }));
vi.mock("@/lib/auditLog", () => ({ logAudit: mocks.audit }));
vi.mock("@/lib/notificationService", () => ({ NotificationService: {} }));
vi.mock("../payroll-approval-route-config", () => ({
  getPayrollApprovalRoute: vi.fn(),
  getPayrollOperationsConfig: vi.fn(),
}));

import { getPayrollWorkspace, mutatePayroll, PayrollServiceError } from "./service";

const access: PayrollAccess = {
  canView: true, canViewAmounts: true, canManage: true, canApprove: false,
  canExport: false, isAdmin: false, actorCompanyId: "company-a",
  actorEmployeeId: "employee-a", actorUserRole: null,
  actorJobTitle: null, actorDepartment: null,
};
const action = {
  action: "calculate" as const, runId: "run-a", expectedVersion: 1,
  reason: "Calculate approved inputs",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async callback => callback({ $queryRawUnsafe: mocks.query }));
});

describe("payroll service public boundary", () => {
  it("rejects workspace reads without view access before querying", async () => {
    await expect(getPayrollWorkspace("overview", { ...access, canView: false }))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects cross-company reads before querying", async () => {
    await expect(getPayrollWorkspace("runs", access, "company-b"))
      .rejects.toMatchObject({ code: "COMPANY_SCOPE_VIOLATION", status: 403 });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("requires an employee identity for self-service payslips", async () => {
    await expect(getPayrollWorkspace("payslips", { ...access, canView: false, actorEmployeeId: null }))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("requires management permission for calculation", async () => {
    await expect(mutatePayroll(action, { ...access, canManage: false }, "actor-a"))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("requires approval permission even for managers", async () => {
    await expect(mutatePayroll({ ...action, action: "approve" }, access, "actor-a"))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("preserves concurrency errors and company scope through extracted run actions", async () => {
    mocks.query.mockResolvedValue([]);
    const result = mutatePayroll(action, access, "actor-a");
    await expect(result).rejects.toBeInstanceOf(PayrollServiceError);
    await expect(result).rejects.toMatchObject({ code: "CONCURRENT_UPDATE", status: 409 });
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("FOR UPDATE"), "run-a", 1, "company-a");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});

it("returns created groups and preserves audit events through setup actions", async () => {
  const group = { id: "group-a", company_id: "company-a" };
  mocks.query.mockResolvedValue([group]);
  await expect(mutatePayroll({
    action: "create_group", code: "MONTHLY", name: "Monthly payroll",
    payFrequency: "monthly", currency: "THB", timezone: "Asia/Bangkok",
    paymentMethod: "bank_transfer",
  }, access, "actor-a")).resolves.toEqual(group);
  expect(mocks.query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO hr_payroll_groups"), expect.any(String),
    "company-a", "MONTHLY", "Monthly payroll", "monthly", "THB",
    "Asia/Bangkok", "bank_transfer", "actor-a",
  );
  expect(mocks.audit).toHaveBeenCalledWith(
    "AUDIT", "Payroll group created.", "Payroll:Group:Create", "actor-a",
    { groupId: "group-a", companyId: "company-a" },
  );
  expect(mocks.audit).toHaveBeenCalledWith(
    "AUDIT", "Payroll action completed: create_group.", "Payroll:create_group",
    "actor-a", { entityId: "group-a" },
  );
});
