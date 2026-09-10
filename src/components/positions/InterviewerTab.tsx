"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileInterviewerSelector } from './MobileInterviewerSelector';
import {
  InterviewerList,
  InterviewerSearchInput,
  InterviewerSummary,
  InterviewerTabHeader,
} from './InterviewerTabParts';
import { useInterviewerTab } from './use-interviewer-tab';

interface InterviewerTabProps {
  positionId: string;
  positionTitle: string;
}

export function InterviewerTab({ positionId }: InterviewerTabProps) {
  const isMobile = useIsMobile();
  const {
    interviewers,
    availableUsers,
    filteredInterviewers,
    filteredAvailableUsers,
    selectedUsers,
    isLoading,
    isAddingUser,
    isRemovingUser,
    selectedUserIds,
    setSelectedUserIds,
    dropdownOpen,
    setDropdownOpen,
    dropdownSearchTerm,
    setDropdownSearchTerm,
    searchTerm,
    setSearchTerm,
    handleAddInterviewers,
    handleToggleUser,
    handleRemoveFromSelection,
    handleRemoveInterviewer,
  } = useInterviewerTab({ positionId });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col px-4 py-6")}>
      <InterviewerTabHeader
        isMobile={isMobile}
        selectedUserIds={selectedUserIds}
        selectedUsers={selectedUsers}
        filteredAvailableUsers={filteredAvailableUsers}
        dropdownOpen={dropdownOpen}
        dropdownSearchTerm={dropdownSearchTerm}
        isAddingUser={isAddingUser}
        onDropdownOpenChange={setDropdownOpen}
        onDropdownSearchTermChange={setDropdownSearchTerm}
        onToggleUser={handleToggleUser}
        onRemoveFromSelection={handleRemoveFromSelection}
        onAddInterviewers={handleAddInterviewers}
      />

      <InterviewerSearchInput
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <InterviewerList
        isMobile={isMobile}
        interviewers={interviewers}
        filteredInterviewers={filteredInterviewers}
        searchTerm={searchTerm}
        isRemovingUser={isRemovingUser}
        onAddFirst={() => setDropdownOpen(true)}
        onRemoveInterviewer={handleRemoveInterviewer}
      />

      <InterviewerSummary
        isMobile={isMobile}
        interviewers={interviewers}
        filteredInterviewers={filteredInterviewers}
        searchTerm={searchTerm}
      />

      {isMobile && (
        <MobileInterviewerSelector
          isOpen={dropdownOpen}
          onOpenChange={setDropdownOpen}
          availableUsers={availableUsers}
          selectedUserIds={selectedUserIds}
          onSelectionChange={setSelectedUserIds}
          onConfirm={handleAddInterviewers}
          isLoading={isAddingUser}
        />
      )}
    </div>
  );
}
