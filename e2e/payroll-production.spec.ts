import {
  expect,
  test,
  type Page,
  type Response,
  type Route,
} from "@playwright/test";

const runId = "11111111-1111-4111-8111-111111111111";
const periodId = "22222222-2222-4222-8222-222222222222";
const groupId = "33333333-3333-4333-8333-333333333333";
const ownerId = "44444444-4444-4444-8444-444444444444";
const companyId = "55555555-5555-4555-8555-555555555555";
const employeeId = "77777777-7777-4777-8777-777777777777";
const packageId = "88888888-8888-4888-8888-888888888888";
const changeId = "99999999-9999-4999-8999-999999999999";

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

function completion(status: string) {
  return {
    draft: 0,
    collecting_inputs: 15,
    calculated: 45,
    pending_approval: 60,
    approved: 72,
    finalized: 78,
    payment_processing: 88,
    paid: 94,
    reconciled: 98,
    closed: 100,
  }[status] ?? 0;
}

function payrollRun(status = "draft", version = 1, unreleasedPayslips = 1) {
  return {
    id: runId,
    period_id: periodId,
    payroll_group_id: groupId,
    period_name: "August 2026",
    pay_date: "2026-08-28",
    pay_date_label: "28 Aug 2026",
    run_type: "regular",
    status,
    version,
    employee_count: 10,
    gross_total: 100_000,
    total_deductions: 10_000,
    net_total: 90_000,
    employer_cost: 110_000,
    payroll_group_name: "Thailand Monthly",
    owner_name: "Payroll Admin",
    created_by_id: ownerId,
    exception_count: 0,
    variance_count: 0,
    unreleased_payslip_count: unreleasedPayslips,
    completion: completion(status),
    approval_steps:
      status === "pending_approval"
        ? [
            {
              id: "66666666-6666-4666-8666-666666666666",
              sequence: 1,
              role: "Payroll owner",
              status: "pending",
              approver_id: ownerId,
              approver_name: "Payroll Admin",
            },
          ]
        : status === "approved" || completion(status) > completion("approved")
          ? [
              {
                id: "66666666-6666-4666-8666-666666666666",
                sequence: 1,
                role: "Payroll owner",
                status: "approved",
                approver_id: ownerId,
                approver_name: "Payroll Admin",
                decided_at: "2026-08-19T05:00:00.000Z",
              },
            ]
          : [],
    created_at: "2026-08-19T04:00:00.000Z",
    updated_at: "2026-08-19T05:00:00.000Z",
  };
}

function workspacePayload(
  resource: string,
  options: { status?: string; version?: number; unreleasedPayslips?: number } = {},
) {
  const status = options.status ?? "draft";
  const version = options.version ?? 1;
  const unreleasedPayslips = options.unreleasedPayslips ?? 1;
  const run = payrollRun(status, version, unreleasedPayslips);

  return {
    resource,
    generatedAt: "2026-08-19T06:00:00.000Z",
    companyId,
    access,
    summary: {
      runCount: 1,
      inProgress: status === "closed" ? 0 : 1,
      pendingApproval: status === "pending_approval" ? 1 : 0,
      periods: 1,
      gross: 100_000,
      net: 90_000,
      pendingReconciliation: ["paid", "payment_processing"].includes(status)
        ? 1
        : 0,
      cutoffLabel: "Payroll cutoff 24 Aug",
    },
    records:
      resource === "compensation" ||
      resource === "benefits" ||
      resource === "payslips"
        ? []
        : [run],
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
        payroll_group_id: groupId,
      },
    ],
    groups: [
      {
        id: groupId,
        name: "Thailand Monthly",
        code: "TH-MONTHLY",
      },
    ],
    employees: [],
  };
}

function compensationPayload(changes: Array<Record<string, unknown>> = []) {
  return {
    ...workspacePayload("compensation"),
    summary: {
      activePackages: 1,
      totalPackages: 1,
      pendingChanges: changes.filter(
        (change) => change.status === "pending_approval",
      ).length,
      annualBase: 600_000,
    },
    records: [
      {
        id: packageId,
        employee_id: employeeId,
        employee_name: "Narin Payroll",
        employee_number: "EMP-001",
        job_title: "Payroll Specialist",
        base_salary: 50_000,
        currency: "THB",
        pay_frequency: "monthly",
        components: [],
        effective_from: "2026-01-01",
        effective_to: null,
        status: "approved",
        version: 1,
      },
    ],
    secondary: changes,
    employees: [
      {
        id: employeeId,
        employee_number: "EMP-001",
        name: "Narin Payroll",
        employee_name: "Narin Payroll",
        currency: "THB",
        base_salary: 50_000,
      },
    ],
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockPayrollWorkspace(page: Page) {
  await page.route("**/api/payroll/workspace/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const resource = pathname.split("/").filter(Boolean).at(-1) || "overview";
    await fulfillJson(route, { data: workspacePayload(resource) });
  });
}

async function selectPayrollRun(page: Page) {
  const row = page.getByLabel("August 2026 · regular");
  await expect(row).toBeVisible();
  await row.click();
}

async function expectAction(page: Page, label: RegExp) {
  const button = page.getByRole("button", { name: label });

  // A payroll mutation refreshes the drawer in place. Give the next action time
  // to settle before deciding the run needs to be re-selected; otherwise a
  // transient render can make the test click the table behind an open sheet.
  try {
    await expect(button).toBeVisible({ timeout: 5_000 });
    return button;
  } catch {
    const openOverlay = page.locator('[role="dialog"][data-state="open"]');
    if ((await openOverlay.count()) === 0) {
      await selectPayrollRun(page);
    }
  }

  await expect(button).toBeVisible({ timeout: 5_000 });
  return button;
}

function waitForRunMutation(page: Page) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/payroll/workspace/runs" &&
      response.request().method() === "POST" &&
      response.ok(),
  );
}

function observeRunWorkspaceRefreshes(page: Page) {
  let refreshCount = 0;
  let lastRefreshAt = 0;
  const listener = (response: Response) => {
    if (
      new URL(response.url()).pathname === "/api/payroll/workspace/runs" &&
      response.request().method() === "GET" &&
      response.ok()
    ) {
      refreshCount += 1;
      lastRefreshAt = Date.now();
    }
  };

  page.on("response", listener);

  return {
    async settle() {
      // The mutation must be followed by an authoritative workspace read.
      await expect.poll(() => refreshCount, { timeout: 5_000 }).toBeGreaterThan(0);
      // PayrollWorkspace currently performs an additional Next router refresh
      // after its own data reload. Wait for a quiet window so that refresh cannot
      // replace the next action button while the following click is in progress.
      await expect
        .poll(() => (lastRefreshAt ? Date.now() - lastRefreshAt : 0), {
          timeout: 5_000,
          intervals: [100, 150, 200, 250],
        })
        .toBeGreaterThanOrEqual(750);
    },
    stop() {
      page.off("response", listener);
    },
  };
}

test.describe("Payroll production surfaces", () => {
  const surfaces = [
    ["/payroll", "Payroll"],
    ["/payroll/runs", "Payroll Runs"],
    ["/payroll/payslips", "Payslips"],
    ["/payroll/compensation", "Compensation"],
    ["/payroll/benefits", "Benefits"],
    ["/payroll/reports", "Reports"],
  ] as const;

  for (const [path, heading] of surfaces) {
    test(`${heading} has a reachable, non-dead-end page`, async ({ page }) => {
      await mockPayrollWorkspace(page);
      const response = await page.goto(path);

      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(heading);
      await expect(page.getByText("Payroll could not load")).toHaveCount(0);
    });
  }

  test("Payroll Reports downloads the register from the audited server endpoint", async ({
    page,
  }) => {
    await mockPayrollWorkspace(page);
    let registerRequested = false;
    await page.route("**/api/payroll/v1/reports/register", async (route) => {
      registerRequested = true;
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

    await page.goto("/payroll/reports");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export CSV/i }).click();
    const file = await download;

    expect(registerRequested).toBe(true);
    expect(file.suggestedFilename()).toBe("payroll-register.csv");
  });
});

test.describe("Compensation production journey", () => {
  test("employee deep link opens once and Cancel does not reopen the dialog", async ({
    page,
  }) => {
    await page.route("**/api/payroll/workspace/compensation", async (route) => {
      await fulfillJson(route, { data: compensationPayload() });
    });

    await page.goto(`/payroll/compensation?employee=${employeeId}`);
    const dialog = page.getByRole("dialog", {
      name: /Create compensation change/i,
    });

    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/payroll\/compensation$/);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(100);
    await expect(dialog).toBeHidden();
  });

  test("create → submit → approve persists through payroll mutations", async ({
    page,
  }) => {
    let changes: Array<Record<string, unknown>> = [];
    const actions: string[] = [];

    await page.route("**/api/payroll/workspace/compensation", async (route) => {
      if (route.request().method() === "GET") {
        await fulfillJson(route, { data: compensationPayload(changes) });
        return;
      }

      const body = route.request().postDataJSON() as Record<string, unknown>;
      const action = String(body.action || "");
      actions.push(action);

      if (action === "create_change") {
        expect(body.employeeId).toBe(employeeId);
        expect(body.proposedAmount).toBe(55_000);
        changes = [
          {
            id: changeId,
            employee_id: employeeId,
            current_amount: 50_000,
            proposed_amount: 55_000,
            effective_date: String(body.effectiveDate),
            budget_impact: 5_000,
            currency: "THB",
            status: "draft",
            reason: String(body.reason),
            version: 1,
            employee_name: "Narin Payroll",
            employee_number: "EMP-001",
            change_type: String(body.changeType),
          },
        ];
      } else if (action === "submit_change") {
        expect(body.id).toBe(changeId);
        expect(body.expectedVersion).toBe(1);
        changes = [{ ...changes[0], status: "pending_approval", version: 2 }];
      } else if (action === "approve_change") {
        expect(body.id).toBe(changeId);
        expect(body.expectedVersion).toBe(2);
        changes = [{ ...changes[0], status: "approved", version: 3 }];
      }

      await fulfillJson(route, { data: changes[0] || {} });
    });

    await page.goto("/payroll/compensation");
    await page
      .getByRole("button", { name: "New compensation change" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: /Create compensation change/i,
    });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Proposed amount").fill("55000");
    await dialog.getByLabel("Reason").fill("Annual compensation review");
    await dialog.getByRole("button", { name: "Create draft" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Changes" }).click();
    await expect(
      page.getByRole("button", { name: /Submit for approval/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Submit for approval/i }).click();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();

    await expect(page.getByText("approved", { exact: true }).first()).toBeVisible();
    expect(actions).toEqual(["create_change", "submit_change", "approve_change"]);
  });
});

test.describe("Payroll run lifecycle", () => {
  test("draft → paid → reconciled → closed has no dead end", async ({ page }) => {
    test.setTimeout(60_000);

    let status = "draft";
    let version = 1;
    let unreleasedPayslips = 1;
    const actions: string[] = [];

    await page.route("**/api/payroll/v1/runs/**/payment-evidence", async (route) => {
      expect(route.request().method()).toBe("POST");
      await fulfillJson(route, {
        evidenceReference: "payroll/runs/evidence/bank-confirmation.pdf",
        name: "bank-confirmation.pdf",
      });
    });

    await page.route("**/api/payroll/workspace/runs", async (route) => {
      if (route.request().method() === "GET") {
        await fulfillJson(route, {
          data: workspacePayload("runs", {
            status,
            version,
            unreleasedPayslips,
          }),
        });
        return;
      }

      const body = route.request().postDataJSON() as Record<string, unknown>;
      const action = String(body.action || "");
      expect(body.runId).toBe(runId);
      expect(body.expectedVersion).toBe(version);
      actions.push(action);

      if (action === "release_payslips") {
        unreleasedPayslips = 0;
      } else {
        status =
          {
            collect_inputs: "collecting_inputs",
            calculate: "calculated",
            submit: "pending_approval",
            approve: "approved",
            finalize: "finalized",
            generate_outputs: "payment_processing",
            mark_paid: "paid",
            reconcile: "reconciled",
            close: "closed",
          }[action] || status;
      }

      if (action === "mark_paid") {
        expect(body.paymentReference).toBe("BANK-CONF-2026-08");
        expect(body.evidenceReference).toBe(
          "payroll/runs/evidence/bank-confirmation.pdf",
        );
      }

      version += 1;
      await fulfillJson(route, {
        data: payrollRun(status, version, unreleasedPayslips),
      });
    });

    await page.goto("/payroll/runs");
    await expect(
      page.getByText(
        "Payment boundary: Studio prepares and controls payroll; the bank moves the money.",
      ),
    ).toBeVisible();
    await selectPayrollRun(page);

    const clickAction = async (label: RegExp) => {
      const button = await expectAction(page, label);
      const refreshes = observeRunWorkspaceRefreshes(page);
      const mutation = waitForRunMutation(page);
      try {
        await button.click();
        await mutation;
        await refreshes.settle();
      } finally {
        refreshes.stop();
      }
    };

    await clickAction(/Collect Inputs/i);
    await clickAction(/Calculate/i);
    await clickAction(/Submit/i);
    await clickAction(/Approve/i);
    await clickAction(/Finalize/i);
    await clickAction(/Generate Outputs/i);
    await clickAction(/Release Payslips/i);
    await expectAction(page, /Mark Paid/i);

    await page.getByRole("button", { name: /Mark Paid/i }).click();
    const settlementDialog = page.getByRole("dialog", {
      name: /Confirm payroll payment/i,
    });
    await expect(settlementDialog).toBeVisible();
    await settlementDialog
      .getByLabel(/Bank \/ payment confirmation reference/i)
      .fill("BANK-CONF-2026-08");
    await settlementDialog.locator('input[type="file"]').setInputFiles({
      name: "bank-confirmation.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% payroll settlement evidence"),
    });

    const markPaidMutation = waitForRunMutation(page);
    await settlementDialog.getByRole("button", { name: /Confirm paid/i }).click();
    await markPaidMutation;
    await page.waitForLoadState("domcontentloaded");

    await clickAction(/Reconcile/i);
    await clickAction(/^Close$/i);

    await expect(page.getByText("closed", { exact: true }).first()).toBeVisible();
    expect(actions).toEqual([
      "collect_inputs",
      "calculate",
      "submit",
      "approve",
      "finalize",
      "generate_outputs",
      "release_payslips",
      "mark_paid",
      "reconcile",
      "close",
    ]);
  });
});
