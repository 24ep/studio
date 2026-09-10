"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Loader2, Mail, UserMinus, UserPlus, Users } from 'lucide-react';
import {
  formatGroupMemberJoinedDate,
  getGroupMemberInitials,
  type GroupMemberUser,
} from './group-members-drawer-utils';

interface GroupMembersDrawerMembersProps {
  members: GroupMemberUser[];
  isLoadingMembers: boolean;
  isRemovingUser: string | null;
  onAddUser: () => void;
  onRemoveUser: (userId: string, userName: string) => void;
}

export function GroupMembersDrawerMembers({
  members,
  isLoadingMembers,
  isRemovingUser,
  onAddUser,
  onRemoveUser,
}: GroupMembersDrawerMembersProps) {
  if (isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No members in this group</p>
        <Button onClick={onAddUser} variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add First Member
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] min-w-[200px]">User</TableHead>
            <TableHead className="w-[20%] min-w-[100px] hidden sm:table-cell">Role</TableHead>
            <TableHead className="w-[25%] min-w-[120px] hidden md:table-cell">Joined</TableHead>
            <TableHead className="w-[15%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="w-[40%] min-w-[200px]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0 rounded-full">
                    <AvatarFallback className="text-xs rounded-full">
                      {getGroupMemberInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-[20%] min-w-[100px] hidden sm:table-cell">
                <Badge variant="secondary" className="text-xs">{member.role}</Badge>
              </TableCell>
              <TableCell className="w-[25%] min-w-[120px] hidden md:table-cell">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{formatGroupMemberJoinedDate(member.createdAt)}</span>
                </div>
              </TableCell>
              <TableCell className="w-[15%] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveUser(member.id, member.name)}
                  disabled={isRemovingUser === member.id}
                  className="text-destructive hover:text-destructive"
                >
                  {isRemovingUser === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
