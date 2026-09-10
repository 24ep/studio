"use client";

import type { UserTeam } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search, Users } from "lucide-react";

import {
  buildUserTeamsListViewState,
  getNextUserTeamsPage,
  getPreviousUserTeamsPage,
  getUserTeamMembersLabel,
  getUserTeamsEmptyStateCopy,
} from "./user-teams-utils";

export function TeamsListSection({
  teams,
  searchTerm,
  page,
  teamsPerPage,
  canCreateTeam,
  onSearchTermChange,
  onPageChange,
  onCreateTeam,
  onSelectTeam,
}: {
  teams: UserTeam[];
  searchTerm: string;
  page: number;
  teamsPerPage: number;
  canCreateTeam: boolean;
  onSearchTermChange: (value: string) => void;
  onPageChange: (page: number | ((current: number) => number)) => void;
  onCreateTeam: () => void;
  onSelectTeam: (team: UserTeam) => void;
}) {
  const {
    filteredTeams,
    paginatedTeams,
    totalFilteredTeams,
    totalPages,
    currentPage,
    showingStart,
    showingEnd,
    hasPagination,
  } = buildUserTeamsListViewState({
    teams,
    searchTerm,
    page,
    teamsPerPage,
  });
  const emptyState = getUserTeamsEmptyStateCopy(searchTerm);

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams by name or description..."
            value={searchTerm}
            onChange={(event) => {
              onSearchTermChange(event.target.value);
              onPageChange(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

    <div className="overflow-hidden rounded-lg border">
        {filteredTeams.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {emptyState.title}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {emptyState.description}
            </p>
            {emptyState.showCreateButton && canCreateTeam && (
              <Button onClick={onCreateTeam} className="btn-hover-primary-gradient">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Team
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeams.map((team) => (
                  <TableRow
                    key={team.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectTeam(team)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.color || "#3B82F6" }}
                        />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {team.description || "No description"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(team.assignmentMode || 'manual') === 'automatic' ? 'outline' : 'secondary'}>
                        {team.assignmentMode || 'manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? "default" : "secondary"}>
                        {team.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getUserTeamMembersLabel(team.member_count)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTeam(team);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasPagination && (
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {showingStart}-{showingEnd} of {totalFilteredTeams} teams
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(getPreviousUserTeamsPage)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange((current) => getNextUserTeamsPage(current, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
