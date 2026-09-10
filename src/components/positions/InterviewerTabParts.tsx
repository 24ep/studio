"use client";

import { ChevronsUpDown, Search, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { InterviewerDesktopSelector } from './InterviewerDesktopSelector';
import { InterviewerCard, InterviewerEmptyState } from './InterviewerListParts';
import type { Interviewer, InterviewerUser } from './interviewer-tab-types';
import {
  getInterviewersSummaryLabel,
  getMobileSelectedInterviewersLabel,
} from './interviewer-tab-utils';

interface InterviewerTabHeaderProps {
  isMobile: boolean;
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

interface InterviewerSearchInputProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

interface InterviewerListProps {
  isMobile: boolean;
  interviewers: Interviewer[];
  filteredInterviewers: Interviewer[];
  searchTerm: string;
  isRemovingUser: string | null;
  onAddFirst: () => void;
  onRemoveInterviewer: (userId: string, userName: string) => void;
}

interface InterviewerSummaryProps {
  isMobile: boolean;
  interviewers: Interviewer[];
  filteredInterviewers: Interviewer[];
  searchTerm: string;
}

export function InterviewerTabHeader({
  isMobile,
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
}: InterviewerTabHeaderProps) {
  const selectedCount = selectedUserIds.size;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Users className="h-6 w-6" />
          Interviewers
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage users assigned to interview Applicants for this position
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isMobile ? (
          <Button
            variant="outline"
            onClick={() => onDropdownOpenChange(true)}
            className="min-w-[300px] justify-between min-h-[40px] h-auto py-2"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedCount === 0 ? (
                <span className="text-muted-foreground">
                  {getMobileSelectedInterviewersLabel(selectedCount)}
                </span>
              ) : (
                <span className="text-sm">{getMobileSelectedInterviewersLabel(selectedCount)}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        ) : (
          <InterviewerDesktopSelector
            selectedUserIds={selectedUserIds}
            selectedUsers={selectedUsers}
            filteredAvailableUsers={filteredAvailableUsers}
            dropdownOpen={dropdownOpen}
            dropdownSearchTerm={dropdownSearchTerm}
            isAddingUser={isAddingUser}
            onDropdownOpenChange={onDropdownOpenChange}
            onDropdownSearchTermChange={onDropdownSearchTermChange}
            onToggleUser={onToggleUser}
            onRemoveFromSelection={onRemoveFromSelection}
            onAddInterviewers={onAddInterviewers}
          />
        )}
      </div>
    </div>
  );
}

export function InterviewerSearchInput({
  searchTerm,
  onSearchTermChange,
}: InterviewerSearchInputProps) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search interviewers..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}

export function InterviewerList({
  isMobile,
  interviewers,
  filteredInterviewers,
  searchTerm,
  isRemovingUser,
  onAddFirst,
  onRemoveInterviewer,
}: InterviewerListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className={cn('space-y-3', isMobile && interviewers.length === 0 && 'pb-40')}>
        {filteredInterviewers.length === 0 ? (
          <InterviewerEmptyState searchTerm={searchTerm} onAddFirst={onAddFirst} />
        ) : (
          filteredInterviewers.map((interviewer) => (
            <InterviewerCard
              key={interviewer.id}
              interviewer={interviewer}
              isRemoving={isRemovingUser === interviewer.userId}
              onRemove={onRemoveInterviewer}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}

export function InterviewerSummary({
  isMobile,
  interviewers,
  filteredInterviewers,
  searchTerm,
}: InterviewerSummaryProps) {
  if (interviewers.length === 0) return null;

  return (
    <div className={cn('mt-4 pt-4 border-t', isMobile && 'pb-40')}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {getInterviewersSummaryLabel({
            filteredCount: filteredInterviewers.length,
            totalCount: interviewers.length,
            isFiltered: Boolean(searchTerm),
          })}
        </span>
      </div>
    </div>
  );
}
