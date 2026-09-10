"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";

import {
  UnifiedRoleMembersEmptyState,
  UnifiedRoleMembersLoadingState,
  UnifiedRoleMembersPagination,
  UnifiedRoleMembersTable,
} from "./UnifiedRoleMembersTabParts";
import {
  getUnifiedRoleMembersPage,
  type UnifiedRoleMember,
} from "./unified-role-members-utils";

export type { UnifiedRoleMember } from "./unified-role-members-utils";

interface UnifiedRoleMembersTabProps {
  roleName: string;
  members: UnifiedRoleMember[];
  isLoadingMembers: boolean;
  memberSearchTerm: string;
  memberPage: number;
  membersPerPage: number;
  isRemovingUser: string | null;
  onAddUserClick: () => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number | ((page: number) => number)) => void;
  onRemoveUser: (userId: string, userName: string) => void;
}

export function UnifiedRoleMembersTab({
  roleName,
  members,
  isLoadingMembers,
  memberSearchTerm,
  memberPage,
  membersPerPage,
  isRemovingUser,
  onAddUserClick,
  onSearchChange,
  onPageChange,
  onRemoveUser,
}: UnifiedRoleMembersTabProps) {
  const {
    paginatedMembers,
    startIndex,
    totalFilteredMembers,
    totalPages,
  } = getUnifiedRoleMembersPage({
    members,
    page: memberPage,
    perPage: membersPerPage,
    searchTerm: memberSearchTerm,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold">Group Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage users in the {roleName} role. Currently {members.length}{" "}
            member{members.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Button onClick={onAddUserClick} size="sm" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={memberSearchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-6">
        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoadingMembers ? (
            <UnifiedRoleMembersLoadingState />
          ) : members.length === 0 ? (
            <UnifiedRoleMembersEmptyState onAddUserClick={onAddUserClick} />
          ) : (
            <>
              <UnifiedRoleMembersTable
                isRemovingUser={isRemovingUser}
                members={paginatedMembers}
                onRemoveUser={onRemoveUser}
              />
              <UnifiedRoleMembersPagination
                memberPage={memberPage}
                membersPerPage={membersPerPage}
                onPageChange={onPageChange}
                startIndex={startIndex}
                totalFilteredMembers={totalFilteredMembers}
                totalPages={totalPages}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
