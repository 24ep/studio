"use client";

import type { Dispatch, SetStateAction } from 'react';
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
import {
  type GroupMemberUser,
} from './group-members-drawer-utils';

interface GroupMembersAddUserDialogProps {
  groupName: string;
  members: GroupMemberUser[];
  availableUsers: GroupMemberUser[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId: string;
  setSelectedUserId: Dispatch<SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  isLoadingAvailable: boolean;
  isAddingUser: boolean;
  onAddUser: () => void;
  onCancel: () => void;
}

export function GroupMembersAddUserDialog({
  groupName,
  members,
  availableUsers,
  isOpen,
  onOpenChange,
  selectedUserId,
  setSelectedUserId,
  searchTerm,
  setSearchTerm,
  isLoadingAvailable,
  isAddingUser,
  onAddUser,
}: GroupMembersAddUserDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:w-full" dialogId="group-members-add-user-modal">
        <DialogHeader>
          <DialogTitle>Add User to {groupName}</DialogTitle>
          <DialogDescription>
            Select a user to add to this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to add" />
              </SelectTrigger>
              <SelectContent>
                <div className="relative p-2 border-b">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10 h-8 text-sm"
                  />
                </div>

                {isLoadingAvailable ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? 'No users found matching your search' : 'No users available'}
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {availableUsers.map((user) => {
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
                )}
              </SelectContent>
            </Select>
          </div>

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
