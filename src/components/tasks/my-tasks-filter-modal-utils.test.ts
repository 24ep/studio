import { describe, expect, it } from "vitest";

import {
  buildTaskFilterBadges,
  getStageOptionLabel,
  getStageOptionValue,
  getTaskFilterActiveCount,
  hasActiveTaskFilters,
  parseTaskFilterRecruiterIds,
  updateTaskFilter,
  updateTaskFilterRecruiters,
} from "./my-tasks-filter-modal-utils";

describe("my tasks filter modal utilities", () => {
  it("parses and updates recruiter filters", () => {
    expect(parseTaskFilterRecruiterIds({ recruiterId: "r1,r2" })).toEqual(["r1", "r2"]);
    expect(parseTaskFilterRecruiterIds({})).toEqual([]);
    expect(updateTaskFilter({ name: "Ada" }, "name", "")).toEqual({ name: undefined });
    expect(updateTaskFilterRecruiters({}, new Set(["r1", "r2"]))).toEqual({ recruiterId: "r1,r2" });
    expect(updateTaskFilterRecruiters({ recruiterId: "r1" }, new Set())).toEqual({ recruiterId: undefined });
  });

  it("counts active filters including selected recruiter state", () => {
    expect(getTaskFilterActiveCount({ name: "Ada" }, new Set())).toBe(1);
    expect(getTaskFilterActiveCount({}, new Set(["r1"]))).toBe(1);
    expect(getTaskFilterActiveCount({ recruiterId: "r1" }, new Set(["r1"]))).toBe(1);
    expect(hasActiveTaskFilters({}, new Set())).toBe(false);
    expect(hasActiveTaskFilters({}, new Set(["r1"]))).toBe(true);
  });

  it("builds readable active filter badges", () => {
    expect(buildTaskFilterBadges({
      positionId: "p1",
      recruiterId: "r1,unassigned",
      assignmentStatus: "assigned",
      positionStatus: "with-position",
      scoreStatus: "unscored",
      applicationDateStart: "2026-01-02",
    }, [
      { id: "p1", title: "Engineer" },
    ], [
      { id: "r1", name: "Grace" },
    ])).toEqual(expect.arrayContaining([
      { key: "positionId", label: "Position", displayValue: "Engineer" },
      { key: "recruiterId", label: "Recruiter", displayValue: "Grace, Unassigned" },
      { key: "assignmentStatus", label: "Assignment", displayValue: "Assigned" },
      { key: "positionStatus", label: "Position", displayValue: "Has position" },
      { key: "scoreStatus", label: "Score", displayValue: "No fit score" },
      expect.objectContaining({ key: "applicationDateStart", label: "From Date" }),
    ]));
  });

  it("reads stage option value and label from strings or objects", () => {
    expect(getStageOptionValue("screening")).toBe("screening");
    expect(getStageOptionLabel({ id: "stage-1", name: "Screening" })).toBe("Screening");
    expect(getStageOptionValue({ id: "stage-1" })).toBe("stage-1");
  });
});
