import { describe, expect, it } from "vitest";
import type { Applicant } from "@/lib/types";

import {
  buildPositionStageNames,
  buildPositionApplicantsQuery,
  buildPositionApplicantTotalPages,
  buildPotentialPositionApplicantsQuery,
  createDefaultPositionApplicantFilters,
  fetchPositionApplicantsPage,
  fetchPotentialPositionApplicantsPage,
  filterApplicantsByMatchedIds,
  getInitialPositionApplicantFilters,
  getMissingJobDescriptionFields,
  getNextApplicantSortState,
  getPositionDrawerSheetOpenChangeAction,
  getPositionEditFormDefaults,
  groupPositionApplicantsByEmail,
  hasPositionApplicantFilterValues,
  normalizePositionApplicantsPageResponse,
  sortPositionDrawerApplicants,
  updateApplicantPinState,
} from "./position-detail-drawer-utils";

function makeApplicant(overrides: Partial<Applicant>): Applicant {
  return {
    id: overrides.id || "applicant-id",
    name: overrides.name || "",
    email: overrides.email || "",
    fitScore: overrides.fitScore ?? 0,
    status: overrides.status || "",
    applicationDate: overrides.applicationDate,
    expectedSalary: overrides.expectedSalary,
    ...overrides,
  } as Applicant;
}

describe("position detail drawer utilities", () => {
  it("toggles applicant sort direction for the same column", () => {
    expect(getNextApplicantSortState("name", "asc", "name")).toEqual({
      sortColumn: "name",
      sortDirection: "desc",
    });

    expect(getNextApplicantSortState("name", "desc", "name")).toEqual({
      sortColumn: "name",
      sortDirection: "asc",
    });
  });

  it("defaults fit score sorting to descending and clears to ascending", () => {
    expect(getNextApplicantSortState("name", "asc", "fitScore")).toEqual({
      sortColumn: "fitScore",
      sortDirection: "desc",
    });

    expect(getNextApplicantSortState("fitScore", "desc", null, null)).toEqual({
      sortColumn: null,
      sortDirection: "asc",
    });
  });

  it("allows only manual mobile drawer close requests", () => {
    expect(getPositionDrawerSheetOpenChangeAction({
      nextOpen: false,
      isMobile: true,
      manualCloseRequested: false,
    })).toEqual({
      shouldNotifyOpenChange: false,
      nextOpen: false,
      shouldResetManualCloseRequest: false,
    });

    expect(getPositionDrawerSheetOpenChangeAction({
      nextOpen: false,
      isMobile: true,
      manualCloseRequested: true,
    })).toEqual({
      shouldNotifyOpenChange: true,
      nextOpen: false,
      shouldResetManualCloseRequest: true,
    });
  });

  it("passes through desktop drawer changes and resets manual close requests", () => {
    expect(getPositionDrawerSheetOpenChangeAction({
      nextOpen: false,
      isMobile: false,
      manualCloseRequested: false,
    })).toEqual({
      shouldNotifyOpenChange: true,
      nextOpen: false,
      shouldResetManualCloseRequest: false,
    });

    expect(getPositionDrawerSheetOpenChangeAction({
      nextOpen: false,
      isMobile: false,
      manualCloseRequested: true,
    })).toEqual({
      shouldNotifyOpenChange: true,
      nextOpen: false,
      shouldResetManualCloseRequest: true,
    });
  });

  it("lists missing job description generation fields", () => {
    expect(getMissingJobDescriptionFields({
      title: "",
      department: "  ",
      positionLevel: null,
    })).toEqual(["Position Title", "Department", "Position Level"]);

    expect(getMissingJobDescriptionFields({
      title: "Designer",
      department: "Product",
      positionLevel: "Senior",
    })).toEqual([]);
  });

  it("normalizes position edit form defaults", () => {
    expect(getPositionEditFormDefaults()).toEqual({
      title: "",
      department: "",
      description: "",
      matchCriteria: "",
      isOpen: true,
      positionLevel: "",
      probationPeriodDays: 90,
      probationEvaluationFrequencyDays: 30,
      gradeId: null,
      recruiterId: null,
      onboardingClientId: null,
      onboardingAssetTypes: [],
      location: "",
      employmentType: "",
      workModel: "",
      salaryRange: "",
      targetStartDate: "",
      hiringManagerName: "",
      successOutcomes: [],
      coreResponsibilities: [],
      requiredSkills: [],
      preferredSkills: [],
      matchCriteriaPreview: [],
    });

    expect(getPositionEditFormDefaults({
      title: "Backend Engineer",
      department: "Engineering",
      description: null,
      matchCriteria: "TypeScript",
      isOpen: false,
      positionLevel: "Senior",
      probationPeriodDays: 120,
      probationEvaluationFrequencyDays: 45,
      gradeId: "grade-1",
      custom_attributes: {
        onboardingClientId: "98be663a-3e3d-4fc0-bf0d-e3c6215d93c2",
        onboardingAssetTypes: ["Laptop", "Monitor"],
        location: "Bangkok",
        employmentType: "Full-time",
        workModel: "Hybrid",
        salaryRange: "THB 90,000 – 130,000",
        targetStartDate: "Sep 28, 2026",
        hiringManagerName: "David Miller",
        successOutcomes: ["Ship impact: Deliver two features"],
        coreResponsibilities: ["Build accessible interfaces"],
        requiredSkills: ["React", "TypeScript"],
        preferredSkills: ["Next.js"],
        matchCriteriaPreview: ["React proficiency|30"],
      },
    })).toEqual({
      title: "Backend Engineer",
      department: "Engineering",
      description: "",
      matchCriteria: "TypeScript",
      isOpen: false,
      positionLevel: "Senior",
      probationPeriodDays: 120,
      probationEvaluationFrequencyDays: 45,
      gradeId: "grade-1",
      recruiterId: null,
      onboardingClientId: "98be663a-3e3d-4fc0-bf0d-e3c6215d93c2",
      onboardingAssetTypes: ["Laptop", "Monitor"],
      location: "Bangkok",
      employmentType: "Full-time",
      workModel: "Hybrid",
      salaryRange: "THB 90,000 – 130,000",
      targetStartDate: "Sep 28, 2026",
      hiringManagerName: "David Miller",
      successOutcomes: ["Ship impact: Deliver two features"],
      coreResponsibilities: ["Build accessible interfaces"],
      requiredSkills: ["React", "TypeScript"],
      preferredSkills: ["Next.js"],
      matchCriteriaPreview: ["React proficiency|30"],
    });
  });

  it("sorts applicants by visible drawer fields", () => {
    const applicants = [
      makeApplicant({ id: "2", name: "Zoe", expectedSalary: 90000 }),
      makeApplicant({ id: "1", name: "Ana", expectedSalary: 100000 }),
    ];

    expect(sortPositionDrawerApplicants(applicants, "name", "asc").map(applicant => applicant.id)).toEqual(["1", "2"]);
    expect(sortPositionDrawerApplicants(applicants, "expectedSalary", "desc").map(applicant => applicant.id)).toEqual(["1", "2"]);
  });

  it("leaves server-sorted columns in original order", () => {
    const applicants = [
      makeApplicant({ id: "2", fitScore: 10 }),
      makeApplicant({ id: "1", fitScore: 90 }),
    ];

    expect(sortPositionDrawerApplicants(applicants, "fitScore", "desc", ["fitScore"]).map(applicant => applicant.id)).toEqual(["2", "1"]);
  });

  it("builds stage names and default applicant filters from recruitment stages", () => {
    const stages = [
      { id: "new", name: "New" },
      { id: "hiring", name: "Hiring" },
      { id: "reject", name: "Rejected" },
      { id: "interview", name: "Interview" },
      { id: "", name: "Ignored" },
    ];

    expect(buildPositionStageNames(stages)).toEqual({
      new: "New",
      hiring: "Hiring",
      reject: "Rejected",
      interview: "Interview",
    });
    expect(createDefaultPositionApplicantFilters(stages)).toEqual({
      selectedStatuses: ["new", "interview"],
    });
  });

  it("detects and preserves custom applicant filters", () => {
    const stages = [{ id: "screening", name: "Screening" }];

    expect(hasPositionApplicantFilterValues({})).toBe(false);
    expect(hasPositionApplicantFilterValues({ selectedStatuses: [] })).toBe(false);
    expect(hasPositionApplicantFilterValues({ aiSearchQuery: "designer" })).toBe(true);

    expect(getInitialPositionApplicantFilters({}, stages)).toEqual({
      selectedStatuses: ["screening"],
    });
    expect(getInitialPositionApplicantFilters({ selectedRecruiterIds: ["recruiter-1"] }, stages)).toEqual({
      selectedRecruiterIds: ["recruiter-1"],
    });
  });

  it("filters AI search matches by applicant id", () => {
    const applicants = [
      makeApplicant({ id: "1", name: "Ana" }),
      makeApplicant({ id: "2", name: "Zoe" }),
      makeApplicant({ id: "3", name: "Mila" }),
    ];

    expect(filterApplicantsByMatchedIds(applicants, ["3", "1"]).map(applicant => applicant.id)).toEqual(["1", "3"]);
  });

  it("builds applicant total pages with safe defaults", () => {
    expect(buildPositionApplicantTotalPages(0, 100)).toBe(1);
    expect(buildPositionApplicantTotalPages(201, 100)).toBe(3);
    expect(buildPositionApplicantTotalPages(201, 0)).toBe(3);
    expect(buildPositionApplicantTotalPages(-5, 100)).toBe(1);
  });

  it("updates applicant pin state immutably by applicant id", () => {
    const applicants = [
      makeApplicant({ id: "1", isPinned: false }),
      makeApplicant({ id: "2", isPinned: true }),
    ];

    const updated = updateApplicantPinState(applicants, "1", true);

    expect(updated).toEqual([
      expect.objectContaining({ id: "1", isPinned: true }),
      expect.objectContaining({ id: "2", isPinned: true }),
    ]);
    expect(updated).not.toBe(applicants);
    expect(updated[0]).not.toBe(applicants[0]);
    expect(updated[1]).toBe(applicants[1]);
    expect(applicants[0].isPinned).toBe(false);
  });

  it("groups applicants by email and keeps first-seen email order", () => {
    const grouped = groupPositionApplicantsByEmail([
      makeApplicant({ id: "1", email: "ana@example.com" }),
      makeApplicant({ id: "2", email: "" }),
      makeApplicant({ id: "3", email: "zoe@example.com" }),
      makeApplicant({ id: "4", email: "ana@example.com" }),
    ]);

    expect(grouped.emailOrder).toEqual(["ana@example.com", "zoe@example.com"]);
    expect(grouped.applicantsByEmail["ana@example.com"].map(applicant => applicant.id)).toEqual(["1", "4"]);
    expect(grouped.applicantsByEmail["zoe@example.com"].map(applicant => applicant.id)).toEqual(["3"]);
  });

  it("builds applied and all applicant queries with shared filters", () => {
    const query = new URLSearchParams(buildPositionApplicantsQuery({
      page: 2,
      pageSize: 25,
      applicantType: "applied",
      searchTerm: "engineer",
      sortColumn: null,
      sortDirection: "desc",
      filters: {
        selectedStatuses: ["screening", "interview"],
        selectedRecruiterIds: ["recruiter-1"],
        selectedSourceIds: ["source-1", "source-2"],
      },
    }));

    expect(query.get("page")).toBe("2");
    expect(query.get("limit")).toBe("25");
    expect(query.get("type")).toBe("applied");
    expect(query.get("searchTerm")).toBe("engineer");
    expect(query.get("sortColumn")).toBe("fitScore");
    expect(query.get("sortDirection")).toBe("desc");
    expect(query.get("status")).toBe("screening,interview");
    expect(query.get("recruiterId")).toBe("recruiter-1");
    expect(query.get("sourceId")).toBe("source-1,source-2");
    expect(query.get("showPinSection")).toBe("true");
  });

  it("builds potential applicant queries with match flags and status filters only", () => {
    const query = new URLSearchParams(buildPotentialPositionApplicantsQuery({
      page: 3,
      pageSize: 10,
      searchTerm: "",
      sortColumn: null,
      sortDirection: "asc",
      filters: {
        selectedStatuses: ["qualified"],
        selectedRecruiterIds: ["ignored-recruiter"],
        selectedSourceIds: ["ignored-source"],
      },
    }));

    expect(query.get("page")).toBe("3");
    expect(query.get("limit")).toBe("10");
    expect(query.get("hasJobMatch")).toBe("true");
    expect(query.get("notApplied")).toBe("true");
    expect(query.get("searchTerm")).toBeNull();
    expect(query.get("sortColumn")).toBe("matchScore");
    expect(query.get("sortDirection")).toBe("asc");
    expect(query.get("status")).toBe("qualified");
    expect(query.get("recruiterId")).toBeNull();
    expect(query.get("sourceId")).toBeNull();
    expect(query.get("showPinSection")).toBe("true");
  });

  it("normalizes applicant page responses defensively", () => {
    const applicant = makeApplicant({ id: "1", name: "Ana" });

    expect(normalizePositionApplicantsPageResponse({
      data: [applicant],
      pagination: { total: 12 },
    })).toEqual({ applicants: [applicant], total: 12 });

    expect(normalizePositionApplicantsPageResponse({ data: [applicant] })).toEqual({
      applicants: [applicant],
      total: 1,
    });

    expect(normalizePositionApplicantsPageResponse(null)).toEqual({ applicants: [], total: 0 });
  });

  it("fetches applied/all applicant pages with shared query normalization", async () => {
    const applicant = makeApplicant({ id: "1", name: "Ana" });
    const fetchCalls: string[] = [];
    const fetcher = async (url: string) => {
      fetchCalls.push(url);
      return {
        ok: true,
        json: async () => ({ data: [applicant], pagination: { total: 5 } }),
      } as Response;
    };

    await expect(fetchPositionApplicantsPage({
      positionId: "position-1",
      page: 2,
      pageSize: 25,
      applicantType: "all",
      searchTerm: "ana",
      sortColumn: "fitScore",
      sortDirection: "desc",
    }, fetcher as typeof fetch)).resolves.toEqual({ applicants: [applicant], total: 5 });

    expect(fetchCalls[0]).toContain("/api/positions/position-1/applicants?");
    expect(fetchCalls[0]).toContain("type=all");
    expect(fetchCalls[0]).toContain("searchTerm=ana");
  });

  it("fetches potential applicant pages from the job matches endpoint", async () => {
    const fetchCalls: string[] = [];
    const fetcher = async (url: string) => {
      fetchCalls.push(url);
      return {
        ok: true,
        json: async () => ({ data: [], pagination: { total: 0 } }),
      } as Response;
    };

    await expect(fetchPotentialPositionApplicantsPage({
      positionId: "position-1",
      page: 1,
      pageSize: 10,
      searchTerm: "",
      sortColumn: null,
      sortDirection: "desc",
    }, fetcher as typeof fetch)).resolves.toEqual({ applicants: [], total: 0 });

    expect(fetchCalls[0]).toContain("/api/positions/position-1/job-matches?");
    expect(fetchCalls[0]).toContain("hasJobMatch=true");
    expect(fetchCalls[0]).toContain("notApplied=true");
  });
});
