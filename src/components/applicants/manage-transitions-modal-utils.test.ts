import { describe, expect, it } from "vitest";

import {
  buildTransitionFormErrorMessage,
  getTransitionCurrentStatus,
  getTrimmedTransitionNotes,
  isBlockedTransitionUpdateResult,
  isNoopTransitionSubmit,
  resolveTransitionStageId,
} from "./manage-transitions-modal-utils";
import type { RecruitmentStage } from "@/lib/types";

const stages: RecruitmentStage[] = [
  { id: "applied", name: "Applied", sortOrder: 1 },
  { id: "interview", name: "Interview", sortOrder: 2 },
] as RecruitmentStage[];

describe("manage transitions modal utilities", () => {
  it("resolves stage ids from ids, names, and unknown values", () => {
    expect(resolveTransitionStageId(stages, "interview")).toBe("interview");
    expect(resolveTransitionStageId(stages, "Applied")).toBe("applied");
    expect(resolveTransitionStageId(stages, "unknown")).toBe("unknown");
    expect(resolveTransitionStageId(stages, null)).toBe("");
  });

  it("normalizes transition status and notes", () => {
    expect(getTransitionCurrentStatus({ statusId: "screening", status: "Applied" })).toBe("screening");
    expect(getTransitionCurrentStatus({ status: "Applied" })).toBe("Applied");
    expect(getTrimmedTransitionNotes("  hello  ")).toBe("hello");
    expect(getTrimmedTransitionNotes(null)).toBe("");
  });

  it("detects no-op and blocked transition updates", () => {
    expect(isNoopTransitionSubmit({ currentStatus: "applied", newStatus: "applied", notes: "" })).toBe(true);
    expect(isNoopTransitionSubmit({ currentStatus: "applied", newStatus: "interview", notes: "" })).toBe(false);
    expect(isNoopTransitionSubmit({ currentStatus: "applied", newStatus: "applied", notes: "note" })).toBe(false);

    expect(isBlockedTransitionUpdateResult(false)).toBe(true);
    expect(isBlockedTransitionUpdateResult(undefined)).toBe(true);
    expect(isBlockedTransitionUpdateResult(true)).toBe(false);
  });

  it("builds validation error messages", () => {
    expect(buildTransitionFormErrorMessage({
      newStatus: { message: "New status is required" },
      notes: undefined,
    })).toBe("Please fix the following errors: New status is required");
    expect(buildTransitionFormErrorMessage({})).toBe("Please fix the form errors before submitting");
  });
});
