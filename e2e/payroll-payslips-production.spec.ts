import { expect, test, type Page, type Route } from "@playwright/test";

const companyId = "11111111-1111-4111-8111-111111111111";
const periodId = "22222222-2222-4222-8222-222222222222";
const payslipId = "33333333-3333-4333-8333-333333333333";
const employeeId = "44444444-4444-4444-8444-444444444444";

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function payslipWorkspace(canExport: boolean) {
  return {
    resource: "payslips",
    generatedAt: "2026-08-21T10:00:00.000Z",
    companyId,
    access: {
      canView: true,
      canManage: true,
      canApprove: false,
      canExport,
      isAdmin: false,
      actorUserRole: "Payroll",
      actorJobTitle: "Payroll Specialist",
      actorDepartment: "People Operations",
    },
    summary: {},
    records: [
      {
        id: payslipId,
        employee_id: employeeId,
        payroll_period_id: periodId,
        period_name: "August 2026",
        pay_date: "2026-08-28",
        employee_name: "Narin Payroll",
        employee_number: "EMP-001",
        department: "People Operations",
        job_title: "Payroll Specialist",
        gross_pay: 60_000,
        total_deductions: 8_000,
        net_pay: 52_000,
        currency: "THB",
        payment_method: "bank_transfer",
        payment_destination: "****1234",
        status: "released",
        delivery_status: "unopened",
        downloadable: true,
        download_count: 0,
        published_at: "2026-08-21T08:00:00.000Z",
        last_downloaded_at: null,
        created_at: "2026-08-21T07:00:00.000Z",
        updated_at: "2026-08-21T08:00:00.000Z",
        breakdown: {
          earnings: [{ label: "Base salary", amount: 60_000 }],
          deductions: [{ label: "Withholding", amount: 8_000 }],
        },
      },
    ],
    secondary: [],
    issues: [],
    periods: [
      {
        id: periodId,
        name: "August 2026",
        pay_date: "2026-08-28",
      },
    ],
    groups: [],
    employees: [],
  };
}

async function mockPayslipWorkspace(page: Page, canExport: boolean) {
  await page.route("**/api/payroll/workspace/payslips", async (route) => {
    await fulfillJson(route, { data: payslipWorkspace(canExport) });
  });
}

test.describe("Payslip production journey", () => {
  test("bulk register export is permissioned and uses the audited server endpoint", async ({
    page,
  }) => {
    await mockPayslipWorkspace(page, true);
    let exportRequested = false;
    await page.route("**/api/payroll/v1/reports/payslips**", async (route) => {
      exportRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "text/csv; charset=utf-8",
        headers: {
          "content-disposition":
            'attachment; filename="payslip-release-register.csv"',
          "cache-control": "private, no-store",
        },
        body: '"employee_number","net_pay"\r\n"EMP-001","52000"',
      });
    });

    await page.goto("/payroll/payslips");
    const exportButton = page.getByRole("button", { name: "Export" });
    await expect(exportButton).toBeVisible();

    const download = page.waitForEvent("download");
    await exportButton.click();
    const file = await download;

    expect(exportRequested).toBe(true);
    expect(file.suggestedFilename()).toBe("payslip-release-register.csv");
  });

  test("view-only payroll users do not receive the bulk register export action", async ({
    page,
  }) => {
    await mockPayslipWorkspace(page, false);
    await page.goto("/payroll/payslips");

    await expect(page.getByRole("button", { name: "Export" })).toBeHidden();
  });

  test("released payslip preview requests the audited PDF endpoint and can send an audited reminder", async ({
    page,
  }) => {
    await mockPayslipWorkspace(page, true);
    let reminderRequested = false;

    await page.route(`**/api/payroll/v1/payslips/${payslipId}`, async (route) => {
      if (route.request().method() === "POST") {
        reminderRequested = true;
        await fulfillJson(route, { sent: true });
        return;
      }
      await route.continue();
    });

    await page.goto("/payroll/payslips");
    await page.getByText("Narin Payroll", { exact: true }).first().click();

    const drawer = page.getByRole("dialog", { name: /Payslip for Narin Payroll/i });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("tab", { name: /Delivery & access/i }).click();

    await page.evaluate(() => {
      HTMLAnchorElement.prototype.click = function recordDownloadTarget() {
        document.documentElement.dataset.payrollDownloadHref = this.href;
      };
    });

    await drawer.getByRole("button", { name: /Download PDF/i }).click();
    const downloadHref = await page.locator("html").getAttribute("data-payroll-download-href");
    expect(downloadHref).not.toBeNull();
    expect(new URL(downloadHref!).pathname).toBe(`/api/payroll/v1/payslips/${payslipId}`);

    await drawer.getByRole("button", { name: /Send reminder/i }).click();
    await expect.poll(() => reminderRequested).toBe(true);
  });
});
