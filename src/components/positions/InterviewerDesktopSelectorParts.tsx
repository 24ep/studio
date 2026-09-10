"use client";

import { Check, ChevronsUpDown, Loader2, Plus, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserAvatarCompact } from '@/components/ui/user-avatar';

import type { InterviewerUser } from './interviewer-tab-types';
import {
  getAddInterviewersButtonLabel,
  getAvailableUsersEmptyMessage,
} from './interviewer-tab-utils';

export function InterviewerSelectorTriggerContent({
  selectedUserIds,
  selectedUsers,
  onRemoveFromSelection,
}: {
  selectedUserIds: Set<string>;
  selectedUsers: InterviewerUser[];
  onRemoveFromSelection: (userId: string) => void;
}) {
  return (
    <>
      <div className="flex flex-1 flex-wrap gap-1">
        {selectedUserIds.size === 0 ? (
          <span className="text-muted-foreground">Select interviewers...</span>
        ) : (
          selectedUsers.map((user) => (
            <SelectedInterviewerBadge
              key={user.id}
              user={user}
              onRemoveFromSelection={onRemoveFromSelection}
            />
          ))
        )}
      </div>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </>
  );
}

export function InterviewerSelectorSearch({
  searchTerm,
  onSearchTermChange,
}: {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}) {
  return (
    <div className="flex-shrink-0 p-2">
      <div className="mb-2 text-sm font-medium">Select Interviewers</div>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full rounded-md border bg-background py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}

export function AvailableInterviewerOptions({
  users,
  selectedUserIds,
  searchTerm,
  onToggleUser,
}: {
  users: InterviewerUser[];
  selectedUserIds: Set<string>;
  searchTerm: string;
  onToggleUser: (userId: string) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="p-2">
          <div className="py-2 text-sm text-muted-foreground">
            {getAvailableUsersEmptyMessage(searchTerm)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <ScrollArea className="h-[300px]" type="always">
        <div className="p-2 pt-0">
          <div className="space-y-0.5">
            {users.map((user) => (
              <InterviewerUserOption
                key={user.id}
                user={user}
                isSelected={selectedUserIds.has(user.id)}
                onToggle={onToggleUser}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function InterviewerSelectorFooter({
  selectedCount,
  isAddingUser,
  onAddInterviewers,
}: {
  selectedCount: number;
  isAddingUser: boolean;
  onAddInterviewers: () => void;
}) {
  return (
    <div className="flex-shrink-0 border-t bg-popover p-2 pt-2">
      <Button
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAddInterviewers();
        }}
        disabled={isAddingUser}
        className="w-full"
        size="sm"
        type="button"
      >
        {isAddingUser ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {getAddInterviewersButtonLabel(selectedCount)}
          </>
        )}
      </Button>
    </div>
  );
}

function SelectedInterviewerBadge({
  user,
  onRemoveFromSelection,
}: {
  user: InterviewerUser;
  onRemoveFromSelection: (userId: string) => void;
}) {
  return (
    <Badge variant="secondary" className="text-xs">
      {user.name}
      <button
        type="button"
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onRemoveFromSelection(user.id);
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={() => onRemoveFromSelection(user.id)}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}

function InterviewerUserOption({
  user,
  isSelected,
  onToggle,
}: {
  user: InterviewerUser;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(user.id);
      }}
      className={cn(
        'w-full cursor-pointer rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
      )}
    >
      <div className="flex items-center">
        <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
        <UserAvatarCompact user={user} size="sm" className="mr-2" />
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-sm font-medium">{user.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{user.email}</span>
            {user.positionTitle && (
              <>
                <span className="text-[10px] text-muted-foreground/50">-</span>
                <span className="text-xs font-medium italic text-muted-foreground">
                  {user.positionTitle}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
