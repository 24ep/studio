"use client";

import { UserAvatarCompact } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Loader2, Search, UserPlus } from 'lucide-react';
import type { UnifiedRoleMember } from './UnifiedRoleMembersTab';
import type { AvailableRoleUser } from './UnifiedRoleDrawerSchema';

export function AddRoleUserDialog({
  open,
  roleName,
  selectedUserId,
  searchTerm,
  availableUsers,
  members,
  isLoadingAvailable,
  isAddingUser,
  onOpenChange,
  onSelectedUserChange,
  onSearchChange,
  onAddUser,
}: {
  open: boolean;
  roleName: string;
  selectedUserId: string;
  searchTerm: string;
  availableUsers: AvailableRoleUser[];
  members: UnifiedRoleMember[];
  isLoadingAvailable: boolean;
  isAddingUser: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectedUserChange: (userId: string) => void;
  onSearchChange: (value: string) => void;
  onCancel: () => void;
  onAddUser: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:w-full" dialogId="unified-role-add-user-modal">
        <DialogHeader>
          <DialogTitle>Add User to {roleName}</DialogTitle>
          <DialogDescription>
            Select a user to add to this role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AddRoleUserSelect
            selectedUserId={selectedUserId}
            searchTerm={searchTerm}
            availableUsers={availableUsers}
            members={members}
            isLoadingAvailable={isLoadingAvailable}
            onSelectedUserChange={onSelectedUserChange}
            onSearchChange={onSearchChange}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={onAddUser}
              disabled={!selectedUserId || isAddingUser}
              className="flex items-center gap-2"
            >
              {isAddingUser ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function AddRoleUserSelect({
  selectedUserId,
  searchTerm,
  availableUsers,
  members,
  isLoadingAvailable,
  onSelectedUserChange,
  onSearchChange,
}: {
  selectedUserId: string;
  searchTerm: string;
  availableUsers: AvailableRoleUser[];
  members: UnifiedRoleMember[];
  isLoadingAvailable: boolean;
  onSelectedUserChange: (userId: string) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select User</label>
      <Select value={selectedUserId} onValueChange={onSelectedUserChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a user to add" />
        </SelectTrigger>
        <SelectContent selectId="unified-role-user-select">
          <div className="relative p-2 border-b">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>

          <AddRoleUserOptions
            availableUsers={availableUsers}
            members={members}
            isLoadingAvailable={isLoadingAvailable}
            searchTerm={searchTerm}
          />
        </SelectContent>
      </Select>
    </div>
  );
}
function AddRoleUserOptions({
  availableUsers,
  members,
  isLoadingAvailable,
  searchTerm,
}: {
  availableUsers: AvailableRoleUser[];
  members: UnifiedRoleMember[];
  isLoadingAvailable: boolean;
  searchTerm: string;
}) {
  if (isLoadingAvailable) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (availableUsers.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {searchTerm ? 'No users found matching your search' : 'No users available'}
      </div>
    );
  }

  return (
    <div className="max-h-[200px] overflow-y-auto">
      {availableUsers.filter(user => user && user.id && user.name).map((user) => {
        const isAlreadyMember = members.some(member => member.id === user.id);
        return (
          <SelectItem
            key={user.id}
            value={user.id}
            disabled={isAlreadyMember}
            className={isAlreadyMember ? 'opacity-60 cursor-not-allowed' : ''}
          >
            <div className="flex items-center gap-2 w-full">
              <UserAvatarCompact user={user} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              {isAlreadyMember && (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
              )}
            </div>
          </SelectItem>
        );
      })}
    </div>
  );
}

