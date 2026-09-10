import { describe, expect, it } from "vitest";
import {
  parsePayrollApprovalRoutes,
  parsePayrollOperationsConfig,
} from "./payroll-approval-route-config";

describe("payroll administration configuration", () => {
  it("normalizes conditional routes and named approvers", () => {
    const routes = parsePayrollApprovalRoutes(
      JSON.stringify([
        {
          id: "default",
          name: "Default approval",
          description: "",
          isActive: true,
          isDefault: true,
          runTypes: [],
          payrollGroupIds: [],
          minimumNetTotal: null,
          steps: [{ role: "Payroll", title: "Payroll review" }],
        },
        {
          id: "bonus",
          name: "Bonus approval",
          description: "",
          isActive: true,
          isDefault: false,
          runTypes: ["bonus"],
          payrollGroupIds: [],
          minimumNetTotal: 500000,
          steps: [
            {
              role: "Finance",
              title: "Finance review",
              approverUserId: "11111111-1111-4111-8111-111111111111",
              approverName: "Finance Owner",
            },
          ],
        },
      ]),
    );
    expect(routes[1]).toMatchObject({
      runTypes: ["bonus"],
      minimumNetTotal: 500000,
    });
    expect(routes[1].steps[0].approverUserId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("applies safe operations defaults", () => {
    expect(parsePayrollOperationsConfig("")).toMatchObject({
      allowBlockingWaivers: false,
      requirePaymentReference: true,
      varianceReviewThresholdPercent: 10,
      overtimeMultiplier: 1.5,
      standardHoursPerDay: 8,
      salaryDaysPerMonth: 30,
    });
  });

  it("rejects invalid configuration and returns defaults", () => {
    expect(
      parsePayrollOperationsConfig(
        JSON.stringify({ varianceReviewThresholdPercent: -1 }),
      ),
    ).toMatchObject({ varianceReviewThresholdPercent: 10 });
  });

  it("requires the default route to be active and unconditional", () => {
    const routes = parsePayrollApprovalRoutes(
      JSON.stringify([
        {
          id: "conditional-default",
          name: "Bad default",
          description: "",
          isActive: true,
          isDefault: true,
          runTypes: ["bonus"],
          payrollGroupIds: [],
          minimumNetTotal: null,
          steps: [{ role: "Finance", title: "Review" }],
        },
      ]),
    );
    expect(routes[0].id).toBe("standard-payroll");
  });

  it("requires an employer tax ID for official PND.1 output", () => {
    const config = parsePayrollOperationsConfig(
      JSON.stringify({ statutoryExportFormat: "pnd1_v1" }),
    );
    expect(config.statutoryExportFormat).toBe("summary_csv");
  });

  it("persists an explicitly reviewed statutory rule set", () => {
    const config = parsePayrollOperationsConfig(
      JSON.stringify({
        statutoryRules: {
          enabled: true,
          jurisdiction: "TH",
          legalVersion: "TH-REVIEWED-1",
          reviewerName: "Qualified payroll reviewer",
          reviewedAt: "2026-01-15",
          effectiveFrom: "2026-01-01",
          employeeSocialSecurityRate: 0.05,
          employerSocialSecurityRate: 0.05,
          socialSecurityMonthlyWageCeiling: 15000,
          annualDeductions: 60000,
          taxBrackets: [
            { upTo: 150000, rate: 0 },
            { upTo: null, rate: 0.35 },
          ],
        },
      }),
    );
    expect(config.statutoryRules).toMatchObject({
      enabled: true,
      legalVersion: "TH-REVIEWED-1",
    });
  });
});
