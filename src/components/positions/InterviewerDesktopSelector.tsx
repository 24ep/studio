"use client";

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  AvailableInterviewerOptions,
  InterviewerSelectorFooter,
  InterviewerSelectorSearch,
  InterviewerSelectorTriggerContent,
} from './InterviewerDesktopSelectorParts';
import type { InterviewerUser } from './interviewer-tab-types';

export interface InterviewerDesktopSelectorProps {
  selectedUserIds: Set<string>;
  selectedUsers: InterviewerUser[];
  filteredAvailableUsers: InterviewerUser[];
  dropdownOpen: boolean;
  dropdownSearchTerm: string;
  isAddingUser: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  onDropdownSearchTermChange: (term: string) => void;
  onToggleUser: (userId: string) => void;
  onRemoveFromSelection: (userId: string) => void;
  onAddInterviewers: () => void;
}

export function InterviewerDesktopSelector({
  selectedUserIds,
  selectedUsers,
  filteredAvailableUsers,
  dropdownOpen,
  dropdownSearchTerm,
  isAddingUser,
  onDropdownOpenChange,
  onDropdownSearchTermChange,
  onToggleUser,
  onRemoveFromSelection,
  onAddInterviewers,
}: InterviewerDesktopSelectorProps) {
  const selectedCount = selectedUserIds.size;

  return (
    <Popover open={dropdownOpen} onOpenChange={onDropdownOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-h-[40px] h-auto min-w-[300px] justify-between py-2">
          <InterviewerSelectorTriggerContent
            selectedUserIds={selectedUserIds}
            selectedUsers={selectedUsers}
            onRemoveFromSelection={onRemoveFromSelection}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] border-border bg-popover p-0 shadow-lg"
        align="start"
        zIndexType="dropdown"
      >
        <div
          className="flex max-h-[450px] flex-col"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <InterviewerSelectorSearch
            searchTerm={dropdownSearchTerm}
            onSearchTermChange={onDropdownSearchTermChange}
          />
          <AvailableInterviewerOptions
            users={filteredAvailableUsers}
            selectedUserIds={selectedUserIds}
            searchTerm={dropdownSearchTerm}
            onToggleUser={onToggleUser}
          />
          {selectedCount > 0 && (
            <InterviewerSelectorFooter
              selectedCount={selectedCount}
              isAddingUser={isAddingUser}
              onAddInterviewers={onAddInterviewers}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
