import { describe, expect, it } from "vitest";
import type { Applicant } from "../../lib/types";
import {
  buildApplicantScoreChartData,
  buildApplicantScoreQuery,
  buildApplicantScoreRanges,
  createDefaultApplicantScoreDateRange,
  formatApplicantScorePeriodDisplay,
  getApplicantScorePeriodRange,
} from "./applicant-score-distribution-utils";

function makeApplicant(overrides: Partial<Applicant>): Applicant {
  return {
    id: overrides.id || "applicant-1",
    name: "Ada",
    email: "ada@example.com",
    parsedData: null,
    positionId: null,
    fitScore: overrides.fitScore ?? 0,
    statusId: "",
    applicationDate: "2026-01-01",
    transitionHistory: [],
    ...overrides,
  };
}

describe("applicant-score-distribution-utils", () => {
  it("creates the default 7-day date range", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const range = createDefaultApplicantScoreDateRange(now);

    expect(range.to).toBe(now);
    expect(range.from?.toISOString()).toBe("2026-06-02T12:00:00.000Z");
  });

  it("builds period ranges and display labels", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const today = getApplicantScorePeriodRange({
      periodType: "today",
      periodUnit: "day",
      periodN: 1,
      now,
    });

    expect(today.startDate.getFullYear()).toBe(2026);
    expect(today.startDate.getMonth()).toBe(5);
    expect(today.startDate.getDate()).toBe(9);
    expect(today.startDate.getHours()).toBe(0);
    expect(formatApplicantScorePeriodDisplay({
      periodType: "lastN",
      periodUnit: "day",
      periodN: 7,
    })).toBe("Last 7 days");
  });

  it("uses initial data for the default range", () => {
    const ranges = buildApplicantScoreRanges({
      applicants: [],
      initialData: [{ label: "A (81-100)", count: 4 }],
      periodType: "lastN",
      periodUnit: "day",
      periodN: 7,
      periodRange: {
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-09"),
      },
    });

    expect(ranges.find((range) => range.letter === "A")?.count).toBe(4);
  });

  it("counts applicants in score ranges by created date", () => {
    const ranges = buildApplicantScoreRanges({
      applicants: [
        makeApplicant({ id: "a1", fitScore: 95, createdAt: "2026-06-05T00:00:00.000Z" }),
        makeApplicant({ id: "a2", fitScore: 40, createdAt: "2026-06-05T00:00:00.000Z" }),
        makeApplicant({ id: "a3", fitScore: 95, createdAt: "2026-05-01T00:00:00.000Z" }),
      ],
      periodType: "custom",
      periodUnit: "day",
      periodN: 1,
      periodRange: {
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date("2026-06-09T23:59:59.999Z"),
      },
    });

    expect(ranges.reduce((sum, range) => sum + range.count, 0)).toBe(2);
  });

  it("builds chart data and applicant query strings", () => {
    const chartData = buildApplicantScoreChartData([
      { label: "B", letter: "B", min: 70, max: 84, count: 2 },
      { label: "A", letter: "A", min: 85, max: 100, count: 3 },
    ]);

    expect(chartData.labels).toEqual(["A", "B"]);
    expect(chartData.datasets[0].data).toEqual([3, 2]);
    expect(buildApplicantScoreQuery({ label: "A", letter: "A", min: 85, max: 100, count: 3 }))
      .toBe("minAppliedJobFitScore:85 maxAppliedJobFitScore:100");
  });
});
