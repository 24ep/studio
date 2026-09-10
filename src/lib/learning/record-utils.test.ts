import { afterEach, describe, expect, it, vi } from "vitest";

import {
  displayLearningValue,
  formatLearningDate,
  isActiveLearningCourse,
  isTrustedLearningCertificate,
  learningBooleanValue,
  learningCourseColor,
  learningDaysUntil,
  learningNumberValue,
  learningRecordValue,
  learningRecordsFromResponse,
  learningStringArrayValue,
  normalizeLearningStatus,
  withoutEmptyLearningValues,
} from "./record-utils";

describe("learning record utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats primitive display values consistently", () => {
    expect(displayLearningValue(undefined)).toBe("—");
    expect(displayLearningValue(true)).toBe("Yes");
    expect(displayLearningValue(false)).toBe("No");
    expect(displayLearningValue("2026-08-23T10:00:00.000Z")).toBe("2026-08-23");
    expect(displayLearningValue("in_progress")).toBe("in progress");
  });

  it("normalizes numeric and boolean API values", () => {
    expect(learningNumberValue(5)).toBe(5);
    expect(learningNumberValue("5.5")).toBe(5.5);
    expect(learningNumberValue("invalid")).toBe(0);
    expect(learningBooleanValue("true")).toBe(true);
    expect(learningBooleanValue(1)).toBe(true);
    expect(learningBooleanValue(false)).toBe(false);
    expect(learningBooleanValue(undefined, "true")).toBe(true);
  });

  it("reads camelCase with snake_case fallback", () => {
    const record = { record_type: "trusted", is_active: false };
    expect(learningRecordValue(record, "recordType", "record_type")).toBe("trusted");
    expect(learningRecordValue(record, "isActive", "is_active")).toBe(false);
  });

  it("parses string arrays defensively", () => {
    expect(learningStringArrayValue(["a", 2, "b"])).toEqual(["a", "b"]);
    expect(learningStringArrayValue('["a","b"]')).toEqual(["a", "b"]);
    expect(learningStringArrayValue("invalid")).toEqual([]);
  });

  it("reads records from resource or root payload", () => {
    expect(
      learningRecordsFromResponse({ resource: { records: [{ id: "a" }] } }),
    ).toEqual([{ id: "a" }]);
    expect(learningRecordsFromResponse({ records: [{ id: "b" }] })).toEqual([
      { id: "b" },
    ]);
    expect(learningRecordsFromResponse({})).toEqual([]);
  });

  it("normalizes status and certificate/course flags", () => {
    expect(normalizeLearningStatus(undefined)).toBe("active");
    expect(normalizeLearningStatus("IN_PROGRESS")).toBe("in_progress");
    expect(isTrustedLearningCertificate({ record_type: "trusted" })).toBe(true);
    expect(isTrustedLearningCertificate({ recordType: "external" })).toBe(false);
    expect(isActiveLearningCourse({})).toBe(true);
    expect(isActiveLearningCourse({ is_active: false })).toBe(false);
  });

  it("formats dates and computes whole days until a date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T00:00:00.000Z"));
    expect(formatLearningDate("2026-08-25T00:00:00.000Z")).toContain("2026");
    expect(formatLearningDate(undefined)).toBe("No date");
    expect(learningDaysUntil("2026-08-25T00:00:00.000Z")).toBe(2);
    expect(learningDaysUntil("invalid")).toBeNull();
  });

  it("preserves existing course color classification", () => {
    expect(learningCourseColor("security")).toBe("bg-emerald-600");
    expect(learningCourseColor("leadership")).toBe("bg-amber-600");
    expect(learningCourseColor("customer service")).toBe("bg-rose-600");
    expect(learningCourseColor("data")).toBe("bg-sky-600");
    expect(learningCourseColor("other")).toBe("bg-indigo-600");
  });

  it("removes only empty-string form values", () => {
    expect(
      withoutEmptyLearningValues({ name: "Course", note: "", active: false, count: 0 }),
    ).toEqual({ name: "Course", active: false, count: 0 });
  });
});
