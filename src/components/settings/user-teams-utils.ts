import type { UserTeam } from "@/lib/types";
import type { TeamFormValues } from "./UserTeamsParts";

const DEFAULT_TEAM_PAGE_SIZE = 10;

type TeamFormSource = Pick<UserTeam, "name"> & {
  description?: string | null;
  color?: string | null;
  isActive?: boolean | null;
  assignmentMode?: "manual" | "automatic";
  assignmentConditions?: UserTeam["assignmentConditions"];
};

export function buildUserTeamsListViewState<
  T extends Pick<UserTeam, "name" | "description">,
>({
  teams,
  searchTerm,
  page,
  teamsPerPage,
}: {
  teams: T[];
  searchTerm: string;
  page: number;
  teamsPerPage: number;
}) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const safeTeamsPerPage =
    teamsPerPage > 0 ? teamsPerPage : DEFAULT_TEAM_PAGE_SIZE;
  const filteredTeams = teams.filter(
    (team) =>
      !normalizedSearchTerm ||
      team.name.toLowerCase().includes(normalizedSearchTerm) ||
      (team.description?.toLowerCase().includes(normalizedSearchTerm) ?? false),
  );
  const totalFilteredTeams = filteredTeams.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredTeams / safeTeamsPerPage),
  );
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * safeTeamsPerPage;
  const paginatedTeams = filteredTeams.slice(
    startIndex,
    startIndex + safeTeamsPerPage,
  );
  const showingStart = totalFilteredTeams === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(
    startIndex + safeTeamsPerPage,
    totalFilteredTeams,
  );

  return {
    filteredTeams,
    paginatedTeams,
    totalFilteredTeams,
    totalPages,
    currentPage,
    startIndex,
    showingStart,
    showingEnd,
    hasSearch: normalizedSearchTerm.length > 0,
    hasPagination: totalPages > 1,
  };
}

export function getUserTeamsEmptyStateCopy(searchTerm: string) {
  const hasSearch = searchTerm.trim().length > 0;

  return {
    title: hasSearch ? "No Teams Found" : "No Teams Yet",
    description: hasSearch
      ? "No teams match your search criteria"
      : "Create your first team to get started",
    showCreateButton: !hasSearch,
  };
}

export function getUserTeamMembersLabel(memberCount?: number | null) {
  const safeMemberCount = Math.max(0, memberCount || 0);
  return `${safeMemberCount} member${safeMemberCount === 1 ? "" : "s"}`;
}

export function getUserTeamDrawerMembersTabLabel(memberCount: number) {
  return `Members (${Math.max(0, memberCount)})`;
}

export function getPreviousUserTeamsPage(currentPage: number) {
  return Math.max(1, currentPage - 1);
}

export function getNextUserTeamsPage(currentPage: number, totalPages: number) {
  return Math.min(Math.max(1, totalPages), currentPage + 1);
}

export function buildTeamFormValues(
  team?: TeamFormSource | null,
): TeamFormValues {
  return {
    name: team?.name || "",
    description: team?.description || "",
    color: team?.color || "#3B82F6",
    isActive: team?.isActive ?? true,
    assignmentMode: team?.assignmentMode || "manual",
    assignmentConditions: {
      positionTitle: team?.assignmentConditions?.positionTitle || [],
      department: team?.assignmentConditions?.department || [],
      officeLocation: team?.assignmentConditions?.officeLocation || [],
      companyName: team?.assignmentConditions?.companyName || [],
      employeeType: team?.assignmentConditions?.employeeType || [],
      manager: team?.assignmentConditions?.manager || [],
    },
  };
}

export function getTeamSaveRequest({
  editingTeam,
  selectedTeam,
}: {
  editingTeam?: Pick<UserTeam, "id"> | null;
  selectedTeam?: Pick<UserTeam, "id"> | null;
}) {
  const teamId = editingTeam?.id || selectedTeam?.id || null;
  const isEditing = Boolean(teamId);

  return {
    isEditing,
    teamId,
    url: isEditing
      ? `/api/settings/user-teams/${teamId}`
      : "/api/settings/user-teams",
    method: isEditing ? "PUT" : "POST",
  };
}

export function buildAvailableTeamUsersUrl({
  teamId,
  searchTerm,
  origin,
}: {
  teamId: string;
  searchTerm?: string | null;
  origin: string;
}) {
  const url = new URL(
    `/api/settings/user-teams/${teamId}/available-users`,
    origin,
  );
  const trimmedSearchTerm = searchTerm?.trim();

  if (trimmedSearchTerm) {
    url.searchParams.set("search", trimmedSearchTerm);
  }

  return url.toString();
}
