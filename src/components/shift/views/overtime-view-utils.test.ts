import { describe, expect, it } from "vitest";

import {
  overtimeEstimatedCost,
  overtimeRequestDuration,
  overtimeRequestRisk,
} from "./overtime-view-utils";

describe("overtime view selectors", () => {
  it("prefers authoritative requested minutes and safely derives a fallback", () => {
    expect(overtimeRequestDuration({ requested_minutes: 90 })).toBe(90);
    expect(
      overtimeRequestDuration({
        requested_start_at: "2026-08-13T18:00:00Z",
        requested_end_at: "2026-08-13T20:30:00Z",
      }),
    ).toBe(150);
    expect(overtimeRequestDuration({})).toBe(0);
  });

  it("derives risk only from recorded policy warnings", () => {
    expect(overtimeRequestRisk({ policy_warnings: [] })).toBe("Compliant");
    expect(overtimeRequestRisk({ policy_warnings: ["Weekend policy"] })).toBe(
      "Policy risk",
    );
  });

  it("never invents an overtime cost", () => {
    expect(overtimeEstimatedCost({})).toBeNull();
    expect(overtimeEstimatedCost({ estimated_cost: "1250.50" })).toBe(1250.5);
  });
});
