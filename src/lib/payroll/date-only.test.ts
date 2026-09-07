import { describe, expect, it } from "vitest";

import { toSqlDate } from "./date-only";

describe("toSqlDate", () => {
  it("serializes Prisma Date values as PostgreSQL date text", () => {
    expect(toSqlDate(new Date("2026-08-12T00:00:00.000Z"))).toBe("2026-08-12");
  });

  it("preserves canonical date strings", () => {
    expect(toSqlDate("2026-08-12")).toBe("2026-08-12");
  });

  it("normalizes timestamp strings", () => {
    expect(toSqlDate("2026-08-12T08:30:00.000Z")).toBe("2026-08-12");
  });

  it("rejects invalid values instead of sending them to raw SQL", () => {
    expect(() => toSqlDate("not-a-date")).toThrow("invalid date");
    expect(() => toSqlDate(new Date(Number.NaN))).toThrow("invalid date");
  });
});
