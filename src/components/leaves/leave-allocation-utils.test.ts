import { describe, expect, it } from "vitest";

import {
  allocationEmployeeName,
  allocationImpactRowId,
  allocationNumber,
  allocationObject,
  allocationValue,
  displayAllocationDays,
} from "./leave-allocation-utils";

describe("leave allocation presentation helpers", () => {
  it("normalizes unknown API values safely", () => {
    expect(allocationValue(null)).toBe("—");
    expect(allocationValue(2026)).toBe("2026");
    expect(allocationNumber("12.5")).toBe(12.5);
    expect(allocationNumber("invalid")).toBe(0);
    expect(allocationObject([])).toEqual({});
    expect(allocationObject({ processed: 3 })).toEqual({ processed: 3 });
  });

  it("builds stable employee labels and impact identifiers", () => {
    expect(
      allocationEmployeeName({ first_name: "Ada", last_name: "Lovelace" }),
    ).toBe("Ada Lovelace");
    expect(allocationImpactRowId({ employee_id: "employee-1" }, 2)).toBe(
      "employee-1",
    );
    expect(allocationImpactRowId({}, 2)).toBe("impact-2");
  });

  it("formats signed allocation days", () => {
    expect(displayAllocationDays(2.5, true)).toBe("+2.5 d");
    expect(displayAllocationDays(-1, true)).toBe("-1.0 d");
  });
});
