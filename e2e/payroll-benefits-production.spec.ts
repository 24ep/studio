import { expect, test, type Page, type Route } from "@playwright/test";

const companyId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const employeeId = "33333333-3333-4333-8333-333333333333";
const enrollmentId = "44444444-4444-4444-8444-444444444444";

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function benefitWorkspace(
  plans: Array<Record<string, unknown>>,
  enrollments: Array<Record<string, unknown>>,
) {
  return {
    resource: "benefits",
    generatedAt: "2026-08-21T10:00:00.000Z",
    companyId,
    access: {
      canView: true,
      canManage: true,
      canApprove: true,
      canExport: false,
      isAdmin: false,
      actorUserRole: "Payroll",
      actorJobTitle: "Benefits Lead",
      actorDepartment: "People Operations",
    },
    summary: {
      activePlans: plans.filter((plan) => plan.is_active).length,
      activeEnrollments: enrollments.filter(
        (enrollment) => enrollment.status === "active",
      ).length,
      employerContribution: enrollments
        .filter((enrollment) => enrollment.status === "active")
        .reduce(
          (sum, enrollment) =>
            sum + Number(enrollment.employer_contribution || 0),
          0,
        ),
    },
    records: plans,
    secondary: enrollments,
    issues: [],
    periods: [],
    groups: [],
    employees: [
      {
        id: employeeId,
        employee_number: "EMP-001",
        name: "Narin Payroll",
        employee_name: "Narin Payroll",
        job_title: "Payroll Specialist",
        employment_type: "full_time",
        status: "active",
        hire_date: "2025-01-01",
        location: "Bangkok",
      },
    ],
  };
}

async function waitForBenefitMutation(page: Page) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/payroll/workspace/benefits" &&
      response.request().method() === "POST" &&
      response.ok(),
  );
}

test.describe("Benefits production journey", () => {
  test("plan → enroll → approve → end coverage has no dead end", async ({
    page,
  }) => {
    let plans: Array<Record<string, unknown>> = [];
    let enrollments: Array<Record<string, unknown>> = [];
    const actions: string[] = [];

    await page.route("**/api/payroll/workspace/benefits", async (route) => {
      if (route.request().method() === "GET") {
        await fulfillJson(route, {
          data: benefitWorkspace(plans, enrollments),
        });
        return;
      }

      const body = route.request().postDataJSON() as Record<string, unknown>;
      const action = String(body.action || "");
      actions.push(action);

      if (action === "create_plan") {
        plans = [
          {
            id: planId,
            name: String(body.name),
            type: String(body.type),
            provider_code: String(body.providerCode || ""),
            description: String(body.description || ""),
            employee_cost: Number(body.employeeCost || 0),
            employer_cost: Number(body.employerCost || 0),
            effective_from: String(body.effectiveFrom),
            effective_to: body.effectiveTo || null,
            is_active: body.isActive !== false,
            eligibility_rules: body.eligibilityRules || {
              employmentTypes: [],
              statuses: ["active", "probation"],
              minimumServiceMonths: 0,
              approvalRequired: true,
            },
            enrollment_count: 0,
            created_at: "2026-08-21T10:00:00.000Z",
            updated_at: "2026-08-21T10:00:00.000Z",
          },
        ];
      } else if (action === "enroll") {
        expect(body.benefitPlanId).toBe(planId);
        expect(body.employeeIds).toEqual([employeeId]);
        enrollments = [
          {
            id: enrollmentId,
            benefit_plan_id: planId,
            plan_name: "Health Plus",
            employee_id: employeeId,
            employee_name: "Narin Payroll",
            employee_number: "EMP-001",
            employer_contribution: 1_000,
            employee_contribution: 500,
            effective_from: String(body.effectiveFrom),
            effective_to: null,
            status: "pending_approval",
            created_at: "2026-08-21T10:10:00.000Z",
            updated_at: "2026-08-21T10:10:00.000Z",
          },
        ];
      } else if (action === "approve_enrollment") {
        expect(body.id).toBe(enrollmentId);
        enrollments = [
          {
            ...enrollments[0],
            status: "active",
            updated_at: "2026-08-21T10:20:00.000Z",
          },
        ];
      } else if (action === "end_enrollment") {
        expect(body.id).toBe(enrollmentId);
        expect(String(body.reason)).toContain("Coverage ended");
        enrollments = [
          {
            ...enrollments[0],
            status: "ended",
            effective_to: "2026-08-31",
            updated_at: "2026-08-21T10:30:00.000Z",
          },
        ];
      }

      await fulfillJson(route, { data: { ok: true } });
    });

    await page.goto("/payroll/benefits");

    await page.getByRole("button", { name: "Add benefit plan" }).click();
    const planDialog = page.getByRole("dialog", { name: "Add benefit plan" });
    await expect(planDialog).toBeVisible();
    await planDialog.getByLabel("Plan name").fill("Health Plus");
    await planDialog.getByLabel("Provider").fill("Health Provider");
    await planDialog.getByLabel("Employee / month").fill("500");
    await planDialog.getByLabel("Employer / month").fill("1000");
    await planDialog.getByLabel("Effective from").fill("2026-09-01");
    const createPlan = waitForBenefitMutation(page);
    await planDialog.getByRole("button", { name: "Save plan" }).click();
    await createPlan;
    await expect(page.getByText("Health Plus", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Enroll employee" }).first().click();
    const enrollmentDialog = page.getByRole("dialog", {
      name: "Enroll employees",
    });
    await expect(enrollmentDialog).toBeVisible();
    await expect(enrollmentDialog.getByText("1 selected")).toBeVisible();
    const enroll = waitForBenefitMutation(page);
    await enrollmentDialog
      .getByRole("button", { name: "Enroll 1 employee" })
      .click();
    await enroll;

    await page.getByText("Health Plus", { exact: true }).first().click();
    const planDrawer = page.getByRole("dialog", {
      name: /Health Plus benefit plan details/i,
    });
    await expect(planDrawer).toBeVisible();
    await planDrawer.getByRole("tab", { name: "enrollments" }).click();
    await expect(
      planDrawer.getByRole("button", { name: "Approve enrollment" }),
    ).toBeVisible();

    const approve = waitForBenefitMutation(page);
    await planDrawer
      .getByRole("button", { name: "Approve enrollment" })
      .click();
    await approve;
    await expect(
      planDrawer.getByRole("button", { name: "End coverage" }),
    ).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Reason for ending coverage");
      await dialog.accept("Coverage ended after employee request");
    });
    const end = waitForBenefitMutation(page);
    await planDrawer.getByRole("button", { name: "End coverage" }).click();
    await end;
    await expect(planDrawer.getByText("ended", { exact: true })).toBeVisible();

    expect(actions).toEqual([
      "create_plan",
      "enroll",
      "approve_enrollment",
      "end_enrollment",
    ]);
  });
});
