import { expect, test } from "@playwright/test";

test("Payroll overview makes Paid → Reconciled → Closed explicit", async ({
  page,
}) => {
  await page.route("**/api/payroll/workspace/overview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          resource: "overview",
          generatedAt: "2026-08-21T10:00:00.000Z",
          companyId: "11111111-1111-4111-8111-111111111111",
          access: {
            canView: true,
            canManage: true,
            canApprove: true,
            canExport: true,
            isAdmin: true,
            actorUserRole: "Admin",
            actorJobTitle: "Payroll Lead",
            actorDepartment: "People Operations",
          },
          summary: {
            employees: 10,
            readiness: 100,
            net: 90_000,
            currentPeriod: "August 2026",
            cutoffLabel: "24 Aug 2026",
            payDateLabel: "28 Aug 2026",
          },
          records: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              period_name: "August 2026",
              pay_date: "2026-08-28",
              status: "paid",
              gross_total: 100_000,
              total_deductions: 10_000,
              net_total: 90_000,
            },
          ],
          secondary: [],
          issues: [],
          periods: [],
          groups: [],
          employees: [],
        },
      }),
    });
  });

  await page.goto("/payroll");

  const boundary = page.getByRole("region", {
    name: "Payroll operational completion boundary",
  });
  await expect(boundary).toContainText("Paid is not the finish line");
  await expect(boundary).toContainText("1. Paid");
  await expect(boundary).toContainText("2. Reconciled");
  await expect(boundary).toContainText("3. Closed");
});
