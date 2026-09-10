"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserPlus, Users } from 'lucide-react';
import { AvailableUserRow, TeamMemberRow } from './UserTeamsMemberRows';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function TeamMembersPanel({
  members,
  isLoadingMembers,
  isRemovingUser,
  onAddMember,
  onRemoveMember,
}: {
  members: TeamMember[];
  isLoadingMembers: boolean;
  isRemovingUser: string | null;
  onAddMember: () => void;
  onRemoveMember: (userId: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Button onClick={onAddMember} size="sm" className="btn-hover-primary-gradient">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoadingMembers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No members in this team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <TeamMemberRow
                key={member.id}
                isRemoving={isRemovingUser === member.id}
                member={member}
                onRemoveMember={onRemoveMember}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function AddTeamMemberDialog({
  open,
  teamName,
  searchTerm,
  availableUsers,
  selectedUserId,
  isLoadingAvailable,
  isAddingUser,
  onOpenChange,
  onSearchTermChange,
  onSearchUsers,
  onSelectUser,
  onAddUser,
}: {
  open: boolean;
  teamName?: string;
  searchTerm: string;
  availableUsers: AvailableUser[];
  selectedUserId: string;
  isLoadingAvailable: boolean;
  isAddingUser: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchTermChange: (value: string) => void;
  onSearchUsers: () => void;
  onSelectUser: (userId: string) => void;
  onAddUser: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Member to Team</DialogTitle>
          <DialogDescription>Select a user to add to {teamName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="user-search">Search Users</Label>
            <Input
              id="user-search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              onKeyUp={onSearchUsers}
            />
          </div>

          <ScrollArea className="h-64">
            {isLoadingAvailable ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No available users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <AvailableUserRow
                    key={user.id}
                    isSelected={selectedUserId === user.id}
                    user={user}
                    onSelectUser={onSelectUser}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddUser} disabled={!selectedUserId || isAddingUser}>
            {isAddingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Team'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
