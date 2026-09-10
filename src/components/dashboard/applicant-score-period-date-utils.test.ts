import { describe, expect, it } from "vitest";
import {
  buildApplicantScoreDayRange,
  buildCurrentApplicantScorePeriodRange,
  buildPastApplicantScorePeriodRange,
} from "./applicant-score-period-date-utils";

describe("applicant-score-period-date-utils", () => {
  const now = new Date(2024, 5, 15, 10, 30, 0);

  it("builds day ranges with optional offsets", () => {
    expect(buildApplicantScoreDayRange(now)).toEqual({
      startDate: new Date(2024, 5, 15),
      endDate: new Date(2024, 5, 15, 23, 59, 59, 999),
    });
    expect(buildApplicantScoreDayRange(now, -1).startDate).toEqual(new Date(2024, 5, 14));
  });

  it("builds past ranges with excluded current periods", () => {
    expect(buildPastApplicantScorePeriodRange({
      excludeCurrentPeriod: true,
      now,
      periodN: 2,
      periodUnit: "week",
    })).toEqual({
      startDate: new Date(2024, 5, 1),
      endDate: new Date(2024, 5, 14, 23, 59, 59, 999),
    });
  });

  it("builds current period ranges by unit", () => {
    expect(buildCurrentApplicantScorePeriodRange("month", now)).toEqual({
      startDate: new Date(2024, 5, 1),
      endDate: new Date(2024, 5, 30, 23, 59, 59, 999),
    });
  });
});
