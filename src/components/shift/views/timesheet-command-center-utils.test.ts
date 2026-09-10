import { describe, expect, it } from "vitest";

import type { ShiftRecord } from "../shift-types";
import {
  allocatedForDay,
  attendanceForDay,
  daysInWeek,
  decimalHours,
  entriesForDay,
  mondayFor,
  sheetBillableMinutes,
  sheetTotalMinutes,
} from "./timesheet-command-center-utils";

const sheet: ShiftRecord = {
  entries: [
    {
      workDate: "2026-08-10",
      project: "Alpha",
      durationMinutes: 120,
      billable: true,
    },
    {
      work_date: "2026-08-10",
      project: "Internal",
      duration_minutes: 60,
      billable: false,
    },
    {
      workDate: "2026-08-11",
      project: "Alpha",
      durationMinutes: 90,
      billable: true,
    },
  ],
  attendance: [{ workDate: "2026-08-10", workedMinutes: 480 }],
};

describe("timesheet command center calculations", () => {
  it("builds a stable Monday-to-Sunday week", () => {
    expect(mondayFor(new Date("2026-08-13T10:00:00Z"))).toBe("2026-08-10");
    expect(
      daysInWeek("2026-08-10").map((value) => value.toISOString().slice(0, 10)),
    ).toEqual([
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });

  it("uses one aggregation source for daily and project totals", () => {
    expect(entriesForDay(sheet, "2026-08-10")).toHaveLength(2);
    expect(allocatedForDay(sheet, "2026-08-10")).toBe(180);
    expect(allocatedForDay(sheet, "2026-08-10", "Alpha")).toBe(120);
    expect(attendanceForDay(sheet, "2026-08-10")).toBe(480);
  });

  it("calculates sheet totals and safe empty values", () => {
    expect(sheetTotalMinutes(sheet)).toBe(270);
    expect(sheetBillableMinutes(sheet)).toBe(210);
    expect(decimalHours(90)).toBe("1.50");
    expect(sheetTotalMinutes()).toBe(0);
    expect(attendanceForDay({}, "2026-08-10")).toBe(0);
  });
});
