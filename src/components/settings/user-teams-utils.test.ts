import { describe, expect, it } from "vitest";
import type { UserTeam } from "@/lib/types";

import {
  buildAvailableTeamUsersUrl,
  buildTeamFormValues,
  buildUserTeamsListViewState,
  getNextUserTeamsPage,
  getPreviousUserTeamsPage,
  getUserTeamDrawerMembersTabLabel,
  getUserTeamMembersLabel,
  getUserTeamsEmptyStateCopy,
  getTeamSaveRequest,
} from "./user-teams-utils";

describe("user teams utilities", () => {
  it("builds filtered and paginated user team list view state", () => {
    const teams: Array<Pick<UserTeam, "id" | "name" | "description">> = [
      { id: "team-1", name: "Hiring", description: "Recruiting team" },
      { id: "team-2", name: "Engineering", description: "Product builders" },
      { id: "team-3", name: "Operations", description: "Hiring ops" },
    ];

    const viewState = buildUserTeamsListViewState({
      teams,
      searchTerm: " hiring ",
      page: 1,
      teamsPerPage: 1,
    });

    expect(viewState.filteredTeams.map((team) => team.id)).toEqual([
      "team-1",
      "team-3",
    ]);
    expect(viewState.paginatedTeams.map((team) => team.id)).toEqual(["team-1"]);
    expect(viewState).toMatchObject({
      totalFilteredTeams: 2,
      totalPages: 2,
      currentPage: 1,
      showingStart: 1,
      showingEnd: 1,
      hasSearch: true,
      hasPagination: true,
    });
  });

  it("clamps team list pagination and handles empty results", () => {
    expect(
      buildUserTeamsListViewState({
        teams: [
          { name: "A", description: "" },
          { name: "B", description: "" },
        ],
        searchTerm: "",
        page: 99,
        teamsPerPage: 1,
      }),
    ).toMatchObject({
      totalPages: 2,
      currentPage: 2,
      showingStart: 2,
      showingEnd: 2,
    });

    expect(
      buildUserTeamsListViewState({
        teams: [{ name: "A", description: "" }],
        searchTerm: "missing",
        page: 1,
        teamsPerPage: 0,
      }),
    ).toMatchObject({
      totalFilteredTeams: 0,
      totalPages: 1,
      currentPage: 1,
      showingStart: 0,
      showingEnd: 0,
      hasPagination: false,
    });
  });

  it("builds team form values from existing teams or defaults", () => {
    expect(
      buildTeamFormValues({
        name: "Hiring",
        description: null,
        color: null,
        isActive: undefined,
        assignmentMode: "automatic",
        assignmentConditions: {
          positionTitle: [],
          department: ["ops"],
          officeLocation: [],
          companyName: [],
          employeeType: [],
          manager: [],
        },
      }),
    ).toEqual({
      name: "Hiring",
      description: "",
      color: "#3B82F6",
      isActive: true,
      assignmentMode: "automatic",
      assignmentConditions: {
        positionTitle: [],
        department: ["ops"],
        officeLocation: [],
        companyName: [],
        employeeType: [],
        manager: [],
      },
    });

    expect(
      buildTeamFormValues({
        name: "Inactive team",
        description: "Paused",
        color: "#111827",
        isActive: false,
        assignmentMode: "automatic",
        assignmentConditions: {
          positionTitle: ["Manager"],
          department: [],
          officeLocation: [],
          companyName: [],
          employeeType: [],
          manager: [],
        },
      }),
    ).toEqual({
      name: "Inactive team",
      description: "Paused",
      color: "#111827",
      isActive: false,
      assignmentMode: "automatic",
      assignmentConditions: {
        positionTitle: ["Manager"],
        department: [],
        officeLocation: [],
        companyName: [],
        employeeType: [],
        manager: [],
      },
    });

    expect(buildTeamFormValues()).toEqual({
      name: "",
      description: "",
      color: "#3B82F6",
      isActive: true,
      assignmentMode: "manual",
      assignmentConditions: {
        positionTitle: [],
        department: [],
        officeLocation: [],
        companyName: [],
        employeeType: [],
        manager: [],
      },
    });
  });

  it("builds user team list labels and empty-state copy", () => {
    expect(getUserTeamsEmptyStateCopy("")).toEqual({
      title: "No Teams Yet",
      description: "Create your first team to get started",
      showCreateButton: true,
    });

    expect(getUserTeamsEmptyStateCopy(" hiring ")).toEqual({
      title: "No Teams Found",
      description: "No teams match your search criteria",
      showCreateButton: false,
    });

    expect(getUserTeamMembersLabel(0)).toBe("0 members");
    expect(getUserTeamMembersLabel(1)).toBe("1 member");
    expect(getUserTeamMembersLabel(null)).toBe("0 members");
    expect(getUserTeamDrawerMembersTabLabel(3)).toBe("Members (3)");
    expect(getUserTeamDrawerMembersTabLabel(-1)).toBe("Members (0)");
  });

  it("clamps previous and next user team pages", () => {
    expect(getPreviousUserTeamsPage(1)).toBe(1);
    expect(getPreviousUserTeamsPage(4)).toBe(3);
    expect(getNextUserTeamsPage(1, 3)).toBe(2);
    expect(getNextUserTeamsPage(3, 3)).toBe(3);
    expect(getNextUserTeamsPage(1, 0)).toBe(1);
  });

  it("builds create and update request metadata for team saves", () => {
    expect(
      getTeamSaveRequest({
        editingTeam: null,
        selectedTeam: null,
      }),
    ).toEqual({
      isEditing: false,
      teamId: null,
      url: "/api/settings/user-teams",
      method: "POST",
    });

    expect(
      getTeamSaveRequest({
        editingTeam: { id: "edit-team" },
        selectedTeam: { id: "selected-team" },
      }),
    ).toEqual({
      isEditing: true,
      teamId: "edit-team",
      url: "/api/settings/user-teams/edit-team",
      method: "PUT",
    });

    expect(
      getTeamSaveRequest({
        selectedTeam: { id: "selected-team" },
      }),
    ).toMatchObject({
      isEditing: true,
      url: "/api/settings/user-teams/selected-team",
      method: "PUT",
    });
  });

  it("builds available team users URLs with trimmed optional search", () => {
    expect(
      buildAvailableTeamUsersUrl({
        teamId: "team-1",
        searchTerm: "  Ada Lovelace  ",
        origin: "https://example.test",
      }),
    ).toBe(
      "https://example.test/api/settings/user-teams/team-1/available-users?search=Ada+Lovelace",
    );

    expect(
      buildAvailableTeamUsersUrl({
        teamId: "team-1",
        searchTerm: "   ",
        origin: "https://example.test",
      }),
    ).toBe(
      "https://example.test/api/settings/user-teams/team-1/available-users",
    );
  });
});
