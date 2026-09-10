import { expect, test } from "@playwright/test";

const companyId = "55555555-5555-4555-8555-555555555555";
const runId = "11111111-1111-4111-8111-111111111111";
const periodId = "22222222-2222-4222-8222-222222222222";

const access = {
  canView: true,
  canManage: true,
  canApprove: true,
  canExport: true,
  isAdmin: true,
  actorUserRole: "Admin",
  actorJobTitle: "Payroll Lead",
  actorDepartment: "People Operations",
};

function runsWorkspace() {
  return {
    resource: "runs",
    generatedAt: "2026-08-19T06:00:00.000Z",
    companyId,
    access,
    summary: {
      runCount: 1,
      inProgress: 1,
      pendingApproval: 0,
      gross: 100_000,
      net: 90_000,
    },
    records: [
      {
        id: runId,
        period_id: periodId,
        period_name: "August 2026",
        pay_date: "2026-08-28",
        pay_date_label: "28 Aug 2026",
        run_type: "regular",
        status: "draft",
        version: 1,
        employee_count: 10,
        gross_total: 100_000,
        total_deductions: 10_000,
        net_total: 90_000,
        employer_cost: 110_000,
        owner_name: "Payroll Admin",
        exception_count: 0,
        variance_count: 0,
        completion: 0,
        approval_steps: [],
        created_at: "2026-08-19T04:00:00.000Z",
        updated_at: "2026-08-19T05:00:00.000Z",
      },
    ],
    secondary: [],
    issues: [],
    periods: [
      {
        id: periodId,
        name: "August 2026",
        start_date: "2026-08-01",
        end_date: "2026-08-27",
        pay_date: "2026-08-28",
        status: "open",
        company_id: companyId,
      },
    ],
    groups: [],
    employees: [],
  };
}

test("Payroll Runs Export uses the audited server register endpoint", async ({ page }) => {
  await page.route("**/api/payroll/workspace/runs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: runsWorkspace() }),
    });
  });

  let registerRequests = 0;
  await page.route("**/api/payroll/v1/reports/register", async (route) => {
    registerRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "text/csv; charset=utf-8",
      headers: {
        "content-disposition": 'attachment; filename="payroll-register.csv"',
        "cache-control": "private, no-store",
      },
      body: '"period_name","net_total"\r\n"August 2026","90000"',
    });
  });

  await page.goto("/payroll/runs");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const file = await download;

  expect(registerRequests).toBe(1);
  expect(file.suggestedFilename()).toBe("payroll-register.csv");
});
