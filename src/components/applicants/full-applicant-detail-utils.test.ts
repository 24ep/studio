import { describe, expect, it } from "vitest";

import type { Applicant } from "@/lib/types";
import { buildFullApplicantDetailDerivedState } from "./full-applicant-detail-derived-state";
import { resolveFooterStages } from "./full-applicant-detail-footer-utils";
import {
  buildApplicantEditFormValues,
  buildApplicantJobMatchModalData,
  calculateApplicantAverageExperienceDuration,
  calculateApplicantTotalExperienceDuration,
  canCloseApplicantHeadcountWarning,
  canOpenApplicantTransitionsModal,
  composeApplicantName,
  createApplicantDetailsUpdatePayload,
  formatApplicantExperienceDuration,
  getAppliedJobGradeBadgeData,
  getDefaultApplicantEditFormValues,
  getApplicantParsedEntries,
  isApplicantHiringStage,
  normalizeApplicantEditParsedData,
  normalizeApplicantFitScore,
  normalizeApplicantJustification,
  resolveApplicantStageId,
  resolveApplicantTransitionStageId,
} from "./full-applicant-detail-utils";

const stages = [
  { id: "screening", name: "Screening" },
  { id: "hired", name: "Hired" },
  { id: "rejected", name: "Rejected" },
];

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? "applicant-id",
    name: overrides.name ?? "Applicant",
    email: overrides.email ?? "applicant@example.com",
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? "screening",
    status: overrides.status ?? "Screening",
    applicationDate: overrides.applicationDate ?? "2026-01-01T00:00:00.000Z",
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

describe("full applicant detail utilities", () => {
  it("normalizes assignment justification from arrays and newline strings", () => {
    expect(normalizeApplicantJustification(["A", "", "B", null])).toEqual(["A", "B"]);
    expect(normalizeApplicantJustification("A\n\n B \n")).toEqual(["A", "B"]);
    expect(normalizeApplicantJustification(undefined)).toEqual([]);
  });

  it("normalizes edit form defaults and fit score values", () => {
    expect(getDefaultApplicantEditFormValues()).toMatchObject({
      email: "",
      phone: "",
      fitScore: null,
      parsedData: {
        education: [],
        experience: [],
      },
    });
    expect(normalizeApplicantFitScore(85)).toBe(0.85);
    expect(normalizeApplicantFitScore(1.5)).toBe(0.015);
    expect(normalizeApplicantFitScore(-0.5)).toBe(0);
    expect(normalizeApplicantFitScore(null)).toBeNull();
  });

  it("normalizes applicant parsed data for edit forms", () => {
    expect(normalizeApplicantEditParsedData(JSON.stringify({
      personal_info: { firstname: "Mila" },
      education: [{ school: "A" }],
      skills: "invalid",
    }))).toEqual({
      personal_info: { firstname: "Mila" },
      contact_info: {},
      education: [{ school: "A" }],
      experience: [],
      skills: [],
      job_suitable: [],
      job_matches: [],
    });

    expect(normalizeApplicantEditParsedData("not-json")).toMatchObject({
      personal_info: {},
      education: [],
    });
  });

  it("builds applicant edit form values from applicant records", () => {
    expect(buildApplicantEditFormValues(makeApplicant({
      email: "mila@example.com",
      phone: "123",
      positionId: "pos-1",
      recruiterId: "rec-1",
      fitScore: 72,
      statusId: "screening",
      status: "Screening",
      expectedSalary: 1000,
      assignmentJustification: "Good match\nStrong skills",
      parsedData: {
        personal_info: { firstname: "Mila" },
        experience: [{ company: "Acme" }],
      } as unknown as Applicant["parsedData"],
    }))).toMatchObject({
      email: "mila@example.com",
      phone: "123",
      positionId: "pos-1",
      recruiterId: "rec-1",
      fitScore: 0.72,
      status: "screening",
      expectedSalary: 1000,
      assignmentJustification: ["Good match", "Strong skills"],
      parsedData: {
        personal_info: { firstname: "Mila" },
        experience: [{ company: "Acme" }],
      },
    });
  });

  it("composes applicant name from parsed personal info with fallback", () => {
    expect(composeApplicantName({
      personal_info: {
        title_honorific: "Dr.",
        firstname: "Ana",
        lastname: "Rivera",
      },
    }, "Fallback")).toBe("Dr. Ana Rivera");

    expect(composeApplicantName({ personal_info: { firstname: "" } }, "Fallback")).toBe("Fallback");
  });

  it("resolves applicant status values to stage ids", () => {
    expect(resolveApplicantStageId("Hired", "screening", stages)).toBe("hired");
    expect(resolveApplicantStageId("unknown", "screening", stages)).toBe("screening");
    expect(resolveApplicantStageId("unknown", undefined, stages)).toBe("unknown");
  });

  it("resolves transition modal stage ids from explicit, current, or first stage values", () => {
    expect(resolveApplicantTransitionStageId("Rejected", { status: "Screening", statusId: "screening" }, stages)).toBe("rejected");
    expect(resolveApplicantTransitionStageId(undefined, { status: "Screening", statusId: "screening" }, stages)).toBe("screening");
    expect(resolveApplicantTransitionStageId(undefined, { status: "Missing", statusId: null as unknown as string }, stages)).toBe("screening");
  });

  it("resolves footer next and rejected stages", () => {
    expect(resolveFooterStages({ status: "Screening", statusId: "screening" }, stages)).toMatchObject({
      nextStage: stages[1],
      rejectedStage: stages[2],
      isRejected: false,
    });

    expect(resolveFooterStages({ status: "Rejected", statusId: "rejected" }, stages)).toMatchObject({
      nextStage: null,
      rejectedStage: stages[2],
      isRejected: true,
    });
  });

  it("guards modal timing for headcount warnings and transition reopen cooldowns", () => {
    expect(canCloseApplicantHeadcountWarning(null, 5000)).toBe(true);
    expect(canCloseApplicantHeadcountWarning(4000, 5500)).toBe(false);
    expect(canCloseApplicantHeadcountWarning(3000, 5500)).toBe(true);

    expect(canOpenApplicantTransitionsModal(null, 5000)).toBe(true);
    expect(canOpenApplicantTransitionsModal(3000, 5000)).toBe(false);
    expect(canOpenApplicantTransitionsModal(1000, 5000)).toBe(true);
  });

  it("builds job match modal data from matching positions or fallback job data", () => {
    expect(buildApplicantJobMatchModalData({
      jobId: "position-1",
      jobTitle: "Old title",
      fitScore: 82,
      matchReasons: ["React"],
    }, [{
      id: "position-1",
      title: "Frontend Engineer",
      description: "Build UI",
      department: "Product",
      requirements: ["React"],
      isOpen: true,
    }])).toEqual({
      jobId: "position-1",
      jobTitle: "Frontend Engineer",
      fitScore: 82,
      matchReasons: ["React"],
      position: {
        id: "position-1",
        title: "Frontend Engineer",
        description: "Build UI",
        department: "Product",
        requirements: ["React"],
        isOpen: true,
      },
    });

    expect(buildApplicantJobMatchModalData({
      jobId: "missing",
      jobTitle: "Fallback",
      fitScore: 55,
      matchReasons: "invalid",
    }, [])).toEqual({
      jobId: "missing",
      jobTitle: "Fallback",
      fitScore: 55,
      matchReasons: [],
      position: undefined,
    });
  });

  it("resolves applied job grade badge data", () => {
    expect(getAppliedJobGradeBadgeData("position-1", [{
      id: "position-1",
      title: "Engineer",
      gradeId: "grade-1",
      grade: { name: "G7", color: "#123456" },
    }])).toEqual({
      name: "G7",
      color: "#123456",
    });

    expect(getAppliedJobGradeBadgeData("position-1", [{
      id: "position-1",
      title: "Engineer",
      gradeId: "grade-1",
      grade: { name: "G7" },
    }])).toEqual({
      name: "G7",
      color: "#3B82F6",
    });

    expect(getAppliedJobGradeBadgeData("position-2", [])).toBeNull();
  });

  it("detects hiring-like stages", () => {
    expect(isApplicantHiringStage("Hired")).toBe(true);
    expect(isApplicantHiringStage("Hiring Manager")).toBe(true);
    expect(isApplicantHiringStage("Employed")).toBe(true);
    expect(isApplicantHiringStage("Interview")).toBe(false);
  });

  it("reads parsed education and experience arrays defensively", () => {
    expect(getApplicantParsedEntries({ education: [{ school: "A" }] }, "education")).toHaveLength(1);
    expect(getApplicantParsedEntries({ education: null }, "education")).toEqual([]);
    expect(getApplicantParsedEntries(undefined, "experience")).toEqual([]);
  });

  it("formats total parsed experience duration", () => {
    expect(formatApplicantExperienceDuration({
      experience: [
        { startYear: 2020, startMonth: 1, endYear: 2021, endMonth: 7 },
        { startYear: 2021, startMonth: 7, endYear: 2022, endMonth: 1 },
      ],
    })).toBe("2Y");

    expect(formatApplicantExperienceDuration({
      experience: [{ startYear: 2024, startMonth: 1, isCurrent: true }],
    }, new Date(2024, 6))).toBe("6M");

    expect(formatApplicantExperienceDuration({ experience: [{ company: "Unknown dates" }] })).toBe("");
  });

  it("calculates verbose total and average experience durations", () => {
    const experience = [
      { startYear: 2020, startMonth: 1, endYear: 2021, endMonth: 7 },
      { startYear: 2021, startMonth: 7, endYear: 2022, endMonth: 1 },
      { company: "Unknown dates" },
    ];

    expect(calculateApplicantTotalExperienceDuration(experience)).toBe("2 years");
    expect(calculateApplicantAverageExperienceDuration(experience)).toBe("1 year");
    expect(calculateApplicantTotalExperienceDuration([])).toBe("");
    expect(calculateApplicantAverageExperienceDuration([{ company: "Unknown dates" }])).toBe("");
  });

  it("creates applicant detail update payloads", () => {
    expect(createApplicantDetailsUpdatePayload({
      status: "Hired",
      parsedData: { personal_info: { firstname: "Mila", lastname: "Chen" } },
      phone: "123",
    }, {
      name: "Old Name",
      statusId: "screening",
      customFields: { portfolio: "yes" },
    }, stages)).toEqual({
      status: "hired",
      parsedData: { personal_info: { firstname: "Mila", lastname: "Chen" } },
      phone: "123",
      name: "Mila Chen",
      customFields: { portfolio: "yes" },
    });
  });

  it("builds controller derived state from applicant details", () => {
    expect(buildFullApplicantDetailDerivedState({
      applicant: makeApplicant({
        positionId: "position-1",
        fitScore: 88,
        assignmentJustification: "Strong match\nRelevant background",
        parsedData: {
          education: [{ school: "A" }],
          experience: [{ startYear: 2020, startMonth: 1, endYear: 2021, endMonth: 1 }],
        } as unknown as Applicant["parsedData"],
      }),
      applicantJobMatches: [{ jobId: "job-1" }, { jobId: "job-2" }],
      isJobMatchEnabled: true,
      positions: [{
        id: "position-1",
        title: "Engineer",
        gradeId: "grade-1",
        grade: { name: "G7", color: "#123456" },
      }],
    })).toEqual({
      appliedFitScore: 88,
      appliedJobGradeBadgeData: { name: "G7", color: "#123456" },
      appliedJobId: "position-1",
      appliedJustification: ["Strong match", "Relevant background"],
      educationCount: 1,
      experienceDuration: "1Y",
      jobMatchCount: 2,
    });

    expect(buildFullApplicantDetailDerivedState({
      applicant: null,
      applicantJobMatches: [{ jobId: "job-1" }],
      isJobMatchEnabled: false,
      positions: [],
    }).jobMatchCount).toBe(0);
  });
});
