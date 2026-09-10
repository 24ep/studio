"use client";

import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
} from 'lucide-react';
import type { UserGroup } from '@/lib/types';
import { GroupMembersAddUserDialog } from './GroupMembersAddUserDialog';
import { GroupMembersDrawerMembers } from './GroupMembersDrawerMembers';
import { useGroupMembersDrawerController } from './use-group-members-drawer-controller';

interface GroupMembersDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  group: UserGroup | null;
  onMembersChange?: () => void;
}

export function GroupMembersDrawer({ 
  isOpen, 
  onOpenChange, 
  group, 
  onMembersChange 
}: GroupMembersDrawerProps) {
  const controller = useGroupMembersDrawerController({
    isOpen,
    group,
    onMembersChange,
  });

  if (!group) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-[85vw] sm:max-w-[70vw] md:max-w-[65vw] lg:max-w-[60vw] xl:max-w-[800px] flex flex-col" sheetId="group-members-drawer">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {group.name} - Group Members
            </SheetTitle>
            <SheetDescription>
              Manage users in the {group.name} group. Currently {controller.members.length} member{controller.members.length !== 1 ? 's' : ''}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Current Members</h3>
              <Button 
                onClick={() => controller.setIsAddUserModalOpen(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </div>

            <div className="flex-1 min-h-0">
              <GroupMembersDrawerMembers
                members={controller.members}
                isLoadingMembers={controller.isLoadingMembers}
                isRemovingUser={controller.isRemovingUser}
                onAddUser={() => controller.setIsAddUserModalOpen(true)}
                onRemoveUser={controller.handleRemoveUser}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <GroupMembersAddUserDialog
        groupName={group.name}
        members={controller.members}
        availableUsers={controller.availableUsers}
        isOpen={controller.isAddUserModalOpen}
        onOpenChange={controller.setIsAddUserModalOpen}
        selectedUserId={controller.selectedUserId}
        setSelectedUserId={controller.setSelectedUserId}
        searchTerm={controller.searchTerm}
        setSearchTerm={controller.setSearchTerm}
        isLoadingAvailable={controller.isLoadingAvailable}
        isAddingUser={controller.isAddingUser}
        onAddUser={controller.handleAddUser}
        onCancel={controller.handleCancelAddUser}
      />
    </>
  );
}
