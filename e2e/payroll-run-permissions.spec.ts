import { expect, test, type Page, type Route } from "@playwright/test";

const runId = "11111111-1111-4111-8111-111111111111";
const periodId = "22222222-2222-4222-8222-222222222222";

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function runsWorkspace({
  status,
  canManage,
  canApprove,
}: {
  status: string;
  canManage: boolean;
  canApprove: boolean;
}) {
  return {
    resource: "runs",
    generatedAt: "2026-08-21T10:00:00.000Z",
    companyId: "33333333-3333-4333-8333-333333333333",
    access: {
      canView: true,
      canManage,
      canApprove,
      canExport: false,
      isAdmin: false,
      actorUserRole: "Payroll Viewer",
      actorJobTitle: "HR Analyst",
      actorDepartment: "People Operations",
    },
    summary: { runCount: 1, inProgress: 1, pendingApproval: 0, periods: 1 },
    records: [
      {
        id: runId,
        period_id: periodId,
        period_name: "August 2026",
        pay_date: "2026-08-28",
        run_type: "regular",
        status,
        version: 1,
        employee_count: 10,
        gross_total: 100_000,
        total_deductions: 10_000,
        net_total: 90_000,
        employer_cost: 110_000,
        exception_count: 0,
        variance_count: 0,
        unreleased_payslip_count: 0,
        approval_steps: [],
        created_at: "2026-08-21T07:00:00.000Z",
        updated_at: "2026-08-21T08:00:00.000Z",
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
      },
    ],
    groups: [],
    employees: [],
  };
}

async function mockRuns(page: Page, body: ReturnType<typeof runsWorkspace>) {
  await page.route("**/api/payroll/workspace/runs", async (route) => {
    await fulfillJson(route, { data: body });
  });
}

test.describe("Payroll run permission journey", () => {
  test("view-only users can inspect a draft without receiving management transitions", async ({
    page,
  }) => {
    await mockRuns(
      page,
      runsWorkspace({ status: "draft", canManage: false, canApprove: false }),
    );

    await page.goto("/payroll/runs");
    await expect(page.getByText(/Read-only payroll access/i)).toBeVisible();
    await page.getByLabel("August 2026 · regular").click();

    await expect(
      page.getByRole("button", { name: /Collect Inputs/i }),
    ).toBeHidden();
  });

  test("approval permission remains available without payroll management permission", async ({
    page,
  }) => {
    await mockRuns(
      page,
      runsWorkspace({
        status: "pending_approval",
        canManage: false,
        canApprove: true,
      }),
    );

    await page.goto("/payroll/runs");
    await page.getByLabel("August 2026 · regular").click();

    await expect(page.getByRole("button", { name: /Approve/i })).toBeVisible();
  });
});
