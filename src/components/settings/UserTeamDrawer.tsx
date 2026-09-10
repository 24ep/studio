"use client";

import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Save, Settings2, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { UserTeam } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

import { TeamFormFields, type TeamFormValues } from './UserTeamsForm';
import { TeamMembersPanel, type TeamMember } from './UserTeamsMemberParts';
import { getUserTeamDrawerMembersTabLabel } from './user-teams-utils';

export type TeamDrawerTab = 'details' | 'members';

export function UserTeamDrawer({
  team,
  open,
  activeTab,
  members,
  isLoadingMembers,
  isRemovingUser,
  form,
  onOpenChange,
  onActiveTabChange,
  onSubmit,
  onDeleteTeam,
  onAddMember,
  onRemoveMember,
}: {
  team: UserTeam;
  open: boolean;
  activeTab: TeamDrawerTab;
  members: TeamMember[];
  isLoadingMembers: boolean;
  isRemovingUser: string | null;
  form: UseFormReturn<TeamFormValues>;
  onOpenChange: (open: boolean) => void;
  onActiveTabChange: (tab: TeamDrawerTab) => void;
  onSubmit: (data: TeamFormValues) => void | Promise<void>;
  onDeleteTeam: () => void;
  onAddMember: () => void;
  onRemoveMember: (userId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:w-[700px]" sheetId="user-teams-tab-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: team.color || '#3B82F6' }}
            />
            {team.name}
          </SheetTitle>
          <SheetDescription>Manage team details and members</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex h-full flex-col">
          <UserTeamDrawerTabs
            activeTab={activeTab}
            memberCount={members.length}
            onActiveTabChange={onActiveTabChange}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            {activeTab === 'details' && (
              <UserTeamDetailsPanel
                form={form}
                onDeleteTeam={onDeleteTeam}
                onSubmit={onSubmit}
              />
            )}

            {activeTab === 'members' && (
              <TeamMembersPanel
                members={members}
                isLoadingMembers={isLoadingMembers}
                isRemovingUser={isRemovingUser}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserTeamDrawerTabs({
  activeTab,
  memberCount,
  onActiveTabChange,
}: {
  activeTab: TeamDrawerTab;
  memberCount: number;
  onActiveTabChange: (tab: TeamDrawerTab) => void;
}) {
  return (
    <div className="mb-6 flex border-b border-border/50">
      <TeamDrawerTabButton
        active={activeTab === 'details'}
        icon={<Settings2 className="h-4 w-4" />}
        label="Details"
        onClick={() => onActiveTabChange('details')}
      />
      <TeamDrawerTabButton
        active={activeTab === 'members'}
        icon={<Users className="h-4 w-4" />}
        label={getUserTeamDrawerMembersTabLabel(memberCount)}
        onClick={() => onActiveTabChange('members')}
      />
    </div>
  );
}

function UserTeamDetailsPanel({
  form,
  onDeleteTeam,
  onSubmit,
}: {
  form: UseFormReturn<TeamFormValues>;
  onDeleteTeam: () => void;
  onSubmit: (data: TeamFormValues) => void | Promise<void>;
}) {
  return (
    <ScrollArea className="flex-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TeamFormFields form={form} showActiveStatus />

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteTeam}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Team
            </Button>
            <Button type="submit" className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </ScrollArea>
  );
}

function TeamDrawerTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        getUnderlineNavTriggerClassName(active),
        'px-6 py-3',
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      {icon}
      {label}
    </div>
  );
}
