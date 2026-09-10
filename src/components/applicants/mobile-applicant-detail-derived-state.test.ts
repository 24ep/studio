import { describe, expect, it } from "vitest";

import type { Applicant } from "@/lib/types";

import {
  buildMobileApplicantStageNames,
  getMobileApplicantAppliedSummary,
  getMobileApplicantProfileSections,
} from "./mobile-applicant-detail-derived-state";

function applicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: "applicant-1",
    name: "Mila Chen",
    email: "mila@example.com",
    parsedData: null,
    positionId: null,
    fitScore: 0,
    statusId: "stage-1",
    applicationDate: "2026-01-01",
    transitionHistory: [],
    ...overrides,
  };
}

describe("mobile applicant detail derived state", () => {
  it("builds stage names from valid stage id/name pairs", () => {
    expect(buildMobileApplicantStageNames([
      { id: "stage-1", name: "Applied" },
      { id: "stage-2", name: null },
      { id: null, name: "Ignored" },
      { id: "stage-3", name: "Interview" },
    ])).toEqual({
      "stage-1": "Applied",
      "stage-3": "Interview",
    });
  });

  it("normalizes applied summary fields", () => {
    expect(getMobileApplicantAppliedSummary(applicant({
      positionId: "position-1",
      fitScore: 87,
      assignmentJustification: "Strong background\nRelevant skills",
    }))).toEqual({
      appliedJobId: "position-1",
      appliedFitScore: 87,
      appliedJustification: ["Strong background", "Relevant skills"],
    });
  });

  it("reads profile sections from stringified parsed data", () => {
    expect(getMobileApplicantProfileSections(applicant({
      parsedData: JSON.stringify({
        personal_info: { firstname: "Mila" },
        education: [{ school: "State" }],
        experience: [{ company: "Acme" }],
      }) as unknown as Applicant["parsedData"],
    }))).toEqual({
      personalInfo: { firstname: "Mila" },
      education: [{ school: "State" }],
      experience: [{ company: "Acme" }],
    });
  });

  it("prefers structured education and experience rows when present", () => {
    expect(getMobileApplicantProfileSections(applicant({
      parsedData: {
        personal_info: { firstname: "Mila" },
        education: [{ school: "Parsed" }],
        experience: [{ company: "Parsed" }],
      } as unknown as Applicant["parsedData"],
      educationData: [{ school: "Structured" }] as unknown as Applicant["educationData"],
      experienceData: [{ company: "Structured" }] as unknown as Applicant["experienceData"],
    }))).toMatchObject({
      education: [{ school: "Structured" }],
      experience: [{ company: "Structured" }],
    });
  });
});
