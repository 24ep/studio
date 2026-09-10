import { describe, expect, it } from "vitest";

import {
  buildHeadcountCreateData,
  getCreateHeadcountValidationError,
} from "./headcount-route-data";

describe("headcount-route-data", () => {
  it("validates required create-headcount fields", () => {
    expect(getCreateHeadcountValidationError({
      positionId: "",
      type: "new",
    })).toBe("Position ID and type are required");

    expect(getCreateHeadcountValidationError({
      positionId: "position-1",
      type: "new",
      status: "filled",
      applicantId: null,
    })).toBeNull();

    expect(getCreateHeadcountValidationError({
      positionId: "position-1",
      type: "new",
      status: "filled",
      applicantId: "applicant-1",
    })).toBeNull();
  });

  it("builds prisma create data with nullable optional fields", () => {
    expect(buildHeadcountCreateData({
      positionId: "position-1",
      type: "replace",
      status: "vacant",
      applicantId: "applicant-1",
      employeeId: "EMP-1",
      onboardingDate: "2026-01-02",
      requestDate: "2026-01-01",
      customFields: {
        costCenter: "ENG",
      },
    }, {
      id: "user-1",
      name: "Ada Lovelace",
    })).toEqual({
      positionId: "position-1",
      type: "replace",
      status: "pending",
      applicantId: null,
      onboardingDate: new Date("2026-01-02"),
      requestDate: new Date("2026-01-01"),
      notes: null,
      memoId: null,
      employeeId: null,
      customFields: {
        costCenter: "ENG",
        requestedById: "user-1",
        requestedByName: "Ada Lovelace",
        requestSource: "position_headcount_management",
        approvalAction: null,
        approvalActionAt: null,
        approvalActionById: null,
        approvalActionByName: null,
        rejectionReason: null,
      },
    });
  });
});
