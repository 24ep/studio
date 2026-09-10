import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Loader2, Mail, UserMinus, UserPlus, Users } from "lucide-react";

import {
  formatUnifiedRoleMemberDate,
  getUnifiedRoleMemberInitials,
  type UnifiedRoleMember,
} from "./unified-role-members-utils";

interface UnifiedRoleMembersEmptyStateProps {
  onAddUserClick: () => void;
}

export function UnifiedRoleMembersLoadingState() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function UnifiedRoleMembersEmptyState({
  onAddUserClick,
}: UnifiedRoleMembersEmptyStateProps) {
  return (
    <div className="flex h-32 flex-col items-center justify-center text-center">
      <Users className="mb-4 h-12 w-12 text-muted-foreground" />
      <p className="mb-2 text-muted-foreground">No members in this role</p>
      <Button onClick={onAddUserClick} variant="outline" size="sm">
        <UserPlus className="mr-2 h-4 w-4" />
        Add First Member
      </Button>
    </div>
  );
}

interface UnifiedRoleMembersTableProps {
  isRemovingUser: string | null;
  members: UnifiedRoleMember[];
  onRemoveUser: (userId: string, userName: string) => void;
}

export function UnifiedRoleMembersTable({
  isRemovingUser,
  members,
  onRemoveUser,
}: UnifiedRoleMembersTableProps) {
  return (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] min-w-[200px]">User</TableHead>
            <TableHead className="hidden w-[20%] min-w-[100px] sm:table-cell">
              Role
            </TableHead>
            <TableHead className="hidden w-[25%] min-w-[120px] md:table-cell">
              Joined
            </TableHead>
            <TableHead className="w-[15%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <UnifiedRoleMembersTableRow
              key={member.id}
              isRemoving={isRemovingUser === member.id}
              member={member}
              onRemoveUser={onRemoveUser}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

interface UnifiedRoleMembersTableRowProps {
  isRemoving: boolean;
  member: UnifiedRoleMember;
  onRemoveUser: (userId: string, userName: string) => void;
}

function UnifiedRoleMembersTableRow({
  isRemoving,
  member,
  onRemoveUser,
}: UnifiedRoleMembersTableRowProps) {
  return (
    <TableRow>
      <TableCell className="w-[40%] min-w-[200px]">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 rounded-full">
            <AvatarFallback className="rounded-full text-xs">
              {getUnifiedRoleMemberInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{member.name}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden w-[20%] min-w-[100px] sm:table-cell">
        <Badge variant="secondary" className="text-xs">
          {member.role}
        </Badge>
      </TableCell>
      <TableCell className="hidden w-[25%] min-w-[120px] md:table-cell">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {formatUnifiedRoleMemberDate(member.createdAt)}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-[15%] text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveUser(member.id, member.name)}
          disabled={isRemoving}
          className="text-destructive hover:text-destructive"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface UnifiedRoleMembersPaginationProps {
  memberPage: number;
  membersPerPage: number;
  onPageChange: (page: number | ((page: number) => number)) => void;
  startIndex: number;
  totalFilteredMembers: number;
  totalPages: number;
}

export function UnifiedRoleMembersPagination({
  memberPage,
  membersPerPage,
  onPageChange,
  startIndex,
  totalFilteredMembers,
  totalPages,
}: UnifiedRoleMembersPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-
        {Math.min(startIndex + membersPerPage, totalFilteredMembers)} of{" "}
        {totalFilteredMembers} members
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((page) => Math.max(1, page - 1))}
          disabled={memberPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {memberPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((page) => Math.min(totalPages, page + 1))}
          disabled={memberPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
