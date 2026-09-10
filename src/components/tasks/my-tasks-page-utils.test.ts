import { describe, expect, it } from "vitest";

import {
  buildTaskStageNames,
  buildTaskboardFitScoreCounts,
  buildTaskboardApplicantParams,
  convertApplicantsToTasks,
  convertStagesToTaskStages,
  filterTaskStagesBySelection,
  filterTaskboardApplicants,
  getTaskApplicantDisplayName,
  getTaskMoveUpdatedCount,
  getTaskboardApplicantsEndpoint,
  hasTaskboardFilterValues,
  haveTaskboardApplicantSnapshotsChanged,
  normalizeTaskboardStagesResponse,
  toggleTaskStageSelection,
} from "./my-tasks-page-utils";

describe("my tasks page utilities", () => {
  it("builds taskboard applicant params and unfiltered endpoints", () => {
    const params = new URLSearchParams(buildTaskboardApplicantParams({
      name: "ana",
      positionId: "position-1",
      stage: "screening,interview",
      recruiterId: "recruiter-1",
      minFitScore: 0.5,
      maxFitScore: 0.9,
      assignmentStatus: "assigned",
    }));

    expect(params.get("name")).toBe("ana");
    expect(params.get("positionId")).toBe("position-1");
    expect(params.get("status")).toBe("screening,interview");
    expect(params.get("recruiterId")).toBe("recruiter-1");
    expect(params.get("minFitScore")).toBe("0.5");
    expect(params.get("maxFitScore")).toBe("0.9");
    expect(params.get("assignmentStatus")).toBe("assigned");
    expect(params.get("limit")).toBe("50000");
    expect(params.get("page")).toBe("1");

    expect(hasTaskboardFilterValues({ name: "", stage: [] })).toBe(false);
    expect(hasTaskboardFilterValues({ recruiterId: "recruiter-1" })).toBe(true);
    expect(getTaskboardApplicantsEndpoint({})).toBe("/api/taskboard/applicants?limit=50000&page=1");
    expect(getTaskboardApplicantsEndpoint({ name: "ana" })).toContain("/api/taskboard/applicants?name=ana");
  });

  it("filters applicants by client-side taskboard filters", () => {
    const applicants = [
      { id: "1", fitScore: 0.7, applicationDate: "2026-01-02", recruiterId: "r1", positionId: "p1" },
      { id: "2", fitScore: 0.2, applicationDate: "2026-01-03", recruiterId: null, positionId: null },
      { id: "3", fitScore: 0, applicationDate: "2026-01-05", recruiterId: "r2", positionId: "p2" },
    ];

    expect(filterTaskboardApplicants(applicants, { minFitScore: 0.5 }).map(applicant => applicant.id)).toEqual(["1"]);
    expect(filterTaskboardApplicants(applicants, { assignmentStatus: "unassigned" }).map(applicant => applicant.id)).toEqual(["2"]);
    expect(filterTaskboardApplicants(applicants, { positionStatus: "with-position" }).map(applicant => applicant.id)).toEqual(["1", "3"]);
    expect(filterTaskboardApplicants(applicants, { scoreStatus: "unscored" }).map(applicant => applicant.id)).toEqual(["3"]);
    expect(filterTaskboardApplicants(applicants, { fitScoreGrades: ["B"] }).map(applicant => applicant.id)).toEqual(["1"]);
    expect(filterTaskboardApplicants(applicants, { fitScoreGrades: ["no-score"] }).map(applicant => applicant.id)).toEqual(["3"]);
    expect(filterTaskboardApplicants(applicants, { applicationDateEnd: "2026-01-03" }).map(applicant => applicant.id)).toEqual(["1", "2"]);

    expect(buildTaskboardFitScoreCounts(applicants)).toEqual([
      { letter: "A", count: 0 },
      { letter: "B", count: 1 },
      { letter: "C", count: 0 },
      { letter: "D", count: 0 },
      { letter: "E", count: 1 },
      { letter: "no-score", count: 1 },
    ]);
  });

  it("converts applicants and stages to taskboard data", () => {
    const applicant = {
      id: "applicant-1",
      name: "Ana Rivera",
      email: "ana@example.com",
      statusId: "screening",
      fitScore: 0.81,
      parsedData: { summary: "Senior engineer", skills: [{ skill_string: "TypeScript" }] },
      recruiter: { id: "recruiter-1", name: "Recruiter", avatarUrl: "avatar.png" },
      position: { title: "Backend Engineer" },
      applicationDate: "2026-01-02",
    };

    expect(convertApplicantsToTasks([applicant])[0]).toMatchObject({
      id: "applicant-1",
      title: "Ana Rivera",
      description: "Senior engineer",
      email: "ana@example.com",
      status: "screening",
      priority: "high",
      assignee: { id: "recruiter-1", name: "Recruiter", avatarUrl: "avatar.png" },
      tags: ["Backend Engineer"],
      skills: [{ skill_string: "TypeScript" }],
      originalapplicant: applicant,
    });

    expect(convertStagesToTaskStages([{ id: "screening", name: "Screening", colorBadge: "#111" }])[0]).toMatchObject({
      id: "screening",
      name: "Screening",
      color: "#111",
      description: "Applicants in Screening stage",
    });
  });

  it("handles stage selection and stage names", () => {
    const stages = [
      { id: "new", name: "New" },
      { id: "screening", name: "Screening" },
    ];

    expect(toggleTaskStageSelection(["new"], "new")).toEqual([]);
    expect(toggleTaskStageSelection(["new"], "screening")).toEqual(["new", "screening"]);
    expect(filterTaskStagesBySelection(stages, [])).toEqual(stages);
    expect(filterTaskStagesBySelection(stages, ["screening"])).toEqual([{ id: "screening", name: "Screening" }]);
    expect(buildTaskStageNames(stages)).toEqual({ new: "New", screening: "Screening" });
  });

  it("normalizes API stage fields", () => {
    expect(normalizeTaskboardStagesResponse([{
      id: "new",
      name: "New",
      sort_order: 2,
      color_complete: "#0f0",
      color_badge: "#00f",
      is_system: true,
    }])).toEqual([{
      id: "new",
      name: "New",
      description: undefined,
      sortOrder: 2,
      colorComplete: "#0f0",
      colorBadge: "#00f",
      isSystem: true,
    }]);
    expect(normalizeTaskboardStagesResponse(null)).toEqual([]);
  });

  it("compares applicant snapshots", () => {
    const applicants = [{ id: "1", name: "Ana", status: "New", updatedAt: "1" }];

    expect(haveTaskboardApplicantSnapshotsChanged(applicants, [{ id: "1", status: "New", updatedAt: "1" }])).toBe(false);
    expect(haveTaskboardApplicantSnapshotsChanged(applicants, [{ id: "1", status: "New", updatedAt: "2" }])).toBe(true);
  });

  it("normalizes task move counts and applicant display names", () => {
    expect(getTaskMoveUpdatedCount({ updatedCount: 2 })).toBe(2);
    expect(getTaskMoveUpdatedCount({ updatedCount: "2" })).toBe(0);
    expect(getTaskMoveUpdatedCount(null)).toBe(0);

    expect(getTaskApplicantDisplayName({ id: "1", name: " Ana " })).toBe(" Ana ");
    expect(getTaskApplicantDisplayName({ id: "2", title: "Task title", status: "new" })).toBe("Task title");
    expect(getTaskApplicantDisplayName({ id: "3", title: "", status: "new" })).toBe("Applicant");
  });
});
