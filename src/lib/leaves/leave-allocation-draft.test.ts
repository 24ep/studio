import { describe, expect, it } from "vitest";

import {
  LEAVE_ALLOCATION_DRAFT_STORAGE_KEY,
  parseLeaveAllocationDraft,
  serializeLeaveAllocationDraft,
  type LeaveAllocationDraft,
} from "./leave-allocation-draft";

const draft: LeaveAllocationDraft = {
  form: {
    policyId: "policy-1",
    year: "2026",
    runType: "annual_entitlement",
    effectiveDate: "2026-08-15",
    scope: "all_eligible",
  },
  currentStep: 3,
  furthestStep: 3,
  acknowledged: true,
  exceptionDecisions: { "employee-1": "include", "employee-2": "exclude" },
  preview: {
    employees: [{ id: "employee-1", units: 12 }],
    policy: { id: "policy-1", name: "Annual Leave" },
    year: 2026,
    runType: "annual_entitlement",
  },
  summary: { population: 1, included: 1, units: 12 },
  savedAt: "2026-08-23T12:00:00.000Z",
};

describe("leave allocation draft", () => {
  it("keeps the existing persisted storage key", () => {
    expect(LEAVE_ALLOCATION_DRAFT_STORAGE_KEY).toBe("leave-allocation-draft");
  });

  it("returns null for empty or malformed storage values", () => {
    expect(parseLeaveAllocationDraft(null)).toBeNull();
    expect(parseLeaveAllocationDraft("")).toBeNull();
    expect(parseLeaveAllocationDraft("not-json")).toBeNull();
  });

  it("preserves the existing draft shape when reading storage", () => {
    expect(parseLeaveAllocationDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it("round-trips the current persisted fields without mutation", () => {
    const original = structuredClone(draft);
    const serialized = serializeLeaveAllocationDraft(draft);
    expect(JSON.parse(serialized)).toEqual(draft);
    expect(parseLeaveAllocationDraft(serialized)).toEqual(draft);
    expect(draft).toEqual(original);
  });
});
