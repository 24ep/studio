import { describe, expect, it } from "vitest";
import {
  buildHeadcountRequestCreateData,
  getHeadcountRequestActionStatus,
  getHeadcountRequestActionTransitionError,
  getHeadcountRequestActionValidationError,
  getHeadcountRequestStatus,
  getHeadcountRequestValidationError,
  mergeHeadcountRequestActionFields,
} from "./headcount-request-utils";

describe("headcount-request-utils", () => {
  it("validates required request fields", () => {
    expect(getHeadcountRequestValidationError({ positionId: "", type: "new" })).toBe("Position is required");
    expect(getHeadcountRequestValidationError({ positionId: "position-1", type: "unknown" })).toBe("Headcount type is invalid");
    expect(getHeadcountRequestValidationError({ positionId: "position-1", type: "new" })).toBeNull();
  });

  it("maps headcount status to request status", () => {
    expect(getHeadcountRequestStatus("draft")).toBe("draft");
    expect(getHeadcountRequestStatus("pending")).toBe("in_review");
    expect(getHeadcountRequestStatus("in_review")).toBe("in_review");
    expect(getHeadcountRequestStatus("vacant")).toBe("approved");
    expect(getHeadcountRequestStatus("filled")).toBe("filled");
    expect(getHeadcountRequestStatus("rejected")).toBe("rejected");
  });

  it("builds a pending ticket create payload", () => {
    const data = buildHeadcountRequestCreateData({
      positionId: "position-1",
      type: "replace",
      requestDate: "2026-07-23",
      priority: "urgent",
      businessJustification: "Backfill approved role",
    }, {
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
    });

    expect(data).toMatchObject({
      positionId: "position-1",
      type: "replace",
      status: "in_review",
      onboardingDate: null,
      notes: null,
      memoId: null,
      customFields: {
        requestedById: "user-1",
        requestedByName: "Ada",
        requesterTitle: "Request owner",
        priority: "urgent",
        businessJustification: "Backfill approved role",
        roleCount: 1,
        annualCost: 0,
        currency: "THB",
        approvalRoute: "standard",
        requestSource: "hiring_headcount_request",
      },
    });
    expect(data.requestDate).toEqual(new Date("2026-07-23"));
  });

  it("uses the approval path configured in Admin Center", () => {
    const data = buildHeadcountRequestCreateData({
      positionId: "position-1",
      approvalRoute: "regional",
    }, {
      id: "user-1",
      name: "Ada",
    }, {
      id: "regional",
      name: "Regional approval",
      description: "",
      isActive: true,
      isDefault: false,
      steps: [
        { role: "Country lead", title: "Country approval" },
        { role: "Finance", title: "Budget approval" },
      ],
    });

    expect(data.customFields).toMatchObject({
      approvalRoute: "regional",
      approvalPath: [
        { role: "Requester", name: "Ada", status: "complete" },
        { role: "Country lead", title: "Country approval", status: "in_review" },
        { role: "Finance", title: "Budget approval", status: "pending" },
      ],
    });
  });

  it("validates approval and rejection actions", () => {
    expect(getHeadcountRequestActionValidationError({ action: "approve" })).toBe("Request ID is required");
    expect(getHeadcountRequestActionValidationError({ id: "hc-1", action: "hold" })).toBe("Request action is invalid");
    expect(getHeadcountRequestActionValidationError({ id: "hc-1", action: "reject", reason: "" })).toBe("Rejection reason is required");
    expect(getHeadcountRequestActionValidationError({ id: "hc-1", action: "submit" })).toBeNull();
    expect(getHeadcountRequestActionValidationError({ id: "hc-1", action: "approve" })).toBeNull();
    expect(getHeadcountRequestActionValidationError({ id: "hc-1", action: "reject", reason: "Budget not approved" })).toBeNull();
  });

  it("maps request actions to stored headcount statuses", () => {
    expect(getHeadcountRequestActionStatus("submit")).toBe("in_review");
    expect(getHeadcountRequestActionStatus("approve")).toBe("vacant");
    expect(getHeadcountRequestActionStatus("reject")).toBe("rejected");
  });

  it("merges action audit fields into custom fields", () => {
    const fields = mergeHeadcountRequestActionFields(
      { requestedByName: "Hiring Manager" },
      { action: "reject", reason: "Budget not approved" },
      { id: "user-1", email: "approver@example.com" },
    );

    expect(fields).toMatchObject({
      requestedByName: "Hiring Manager",
      approvalAction: "reject",
      approvalActionById: "user-1",
      approvalActionByName: "approver@example.com",
      rejectionReason: "Budget not approved",
    });
    expect(String((fields as Record<string, unknown>).approvalActionAt)).toBeTruthy();

    const approvedFields = mergeHeadcountRequestActionFields(
      fields,
      { action: "approve" },
      { id: "user-2", name: "Grace Hopper" },
    );

    expect(approvedFields).toMatchObject({
      approvalAction: "approve",
      approvalActionById: "user-2",
      approvalActionByName: "Grace Hopper",
      rejectionReason: null,
    });

    const submittedFields = mergeHeadcountRequestActionFields(
      { requestedByName: "Hiring Manager" },
      { action: "submit" },
      { id: "user-3", name: "Lin Chen" },
    );

    expect(submittedFields).toMatchObject({
      submittedById: "user-3",
      submittedByName: "Lin Chen",
      approvalAction: null,
      rejectionReason: null,
    });
    expect(String((submittedFields as Record<string, unknown>).submittedAt)).toBeTruthy();
  });

  it("guards request actions by journey state", () => {
    expect(getHeadcountRequestActionTransitionError("draft", "submit")).toBeNull();
    expect(getHeadcountRequestActionTransitionError("draft", "approve")).toBe("Submit the draft for review before making a decision.");
    expect(getHeadcountRequestActionTransitionError("in_review", "submit")).toBe("Only draft requests can be submitted for review.");
    expect(getHeadcountRequestActionTransitionError("filled", "reject")).toBe("Filled headcount requests cannot be changed.");
  });
});
