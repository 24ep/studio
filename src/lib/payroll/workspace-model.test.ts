import { describe, expect, it } from "vitest";

import {
  approvalStepStyle,
  initialsFromName,
  parseApprovalSteps,
  payrollPeriodIsRunnable,
  payrollProgressCursor,
  payrollProgressStepState,
  payrollReviewerFromSteps,
  reviewerRoleLabel,
} from "./workspace-model";

describe("payroll workspace model", () => {
  it("accepts only open payroll periods with valid dates", () => {
    expect(
      payrollPeriodIsRunnable({
        status: "open",
        start_date: "2026-08-01",
        end_date: "2026-08-31",
        pay_date: "2026-08-31",
      }),
    ).toBe(true);
    expect(
      payrollPeriodIsRunnable({
        status: "closed",
        start_date: "2026-08-01",
        end_date: "2026-08-31",
        pay_date: "2026-08-31",
      }),
    ).toBe(false);
    expect(payrollPeriodIsRunnable(undefined)).toBe(false);
  });

  it("parses approval steps from JSON or array payloads", () => {
    expect(
      parseApprovalSteps(
        '[{"id":"hr","sequence":2,"role":"HR","status":"pending","approver_id":"e1","approver_name":"Jane Doe"}]',
      ),
    ).toEqual([
      {
        id: "hr",
        sequence: 2,
        role: "HR",
        status: "pending",
        approverId: "e1",
        approverName: "Jane Doe",
        decisionReason: "",
        decidedAt: undefined,
      },
    ]);
    expect(parseApprovalSteps("not-json")).toEqual([]);
    expect(parseApprovalSteps({})).toEqual([]);
  });

  it("normalizes approval visual states", () => {
    expect(approvalStepStyle("approved").label).toBe("Approved");
    expect(approvalStepStyle("rejected").label).toBe("Rejected");
    expect(approvalStepStyle("reviewing").label).toBe("In progress");
    expect(approvalStepStyle("queued").label).toBe("Waiting");
    expect(approvalStepStyle("other").label).toBe("Pending");
  });

  it("derives stable initials and reviewer role labels", () => {
    expect(initialsFromName("Jane Doe")).toBe("JD");
    expect(initialsFromName("Payroll")).toBe("PA");
    expect(initialsFromName("")).toBe("NA");
    expect(reviewerRoleLabel("manager")).toBe("Manager");
    expect(reviewerRoleLabel("payroll_owner")).toBe("Payroll owner");
  });

  it("maps workflow statuses to progress cursor", () => {
    expect(payrollProgressCursor("draft")).toBe(0);
    expect(payrollProgressCursor("collecting_inputs")).toBe(1);
    expect(payrollProgressCursor("calculated")).toBe(2);
    expect(payrollProgressCursor("pending_approval")).toBe(3);
    expect(payrollProgressCursor("approved")).toBe(4);
    expect(payrollProgressCursor("payment_processing")).toBe(5);
    expect(payrollProgressCursor("paid")).toBe(6);
  });

  it("marks progress steps as done, active, or pending", () => {
    expect(payrollProgressStepState(0, 2, 6)).toEqual({
      completed: true,
      active: false,
      label: "done",
    });
    expect(payrollProgressStepState(2, 2, 6)).toEqual({
      completed: false,
      active: true,
      label: "active",
    });
    expect(payrollProgressStepState(4, 2, 6)).toEqual({
      completed: false,
      active: false,
      label: "pending",
    });
  });

  it("returns the first pending-like reviewer, then the first step", () => {
    const steps = parseApprovalSteps([
      { id: "one", sequence: 1, role: "HR", status: "approved" },
      { id: "two", sequence: 2, role: "Finance", status: "reviewing" },
    ]);
    expect(payrollReviewerFromSteps(steps)?.id).toBe("two");
    expect(payrollReviewerFromSteps([steps[0]])?.id).toBe("one");
    expect(payrollReviewerFromSteps([])).toBeNull();
  });
});
