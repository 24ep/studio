"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  filterInterviewers,
  InterviewerList,
  InterviewerSearchField,
  MobileInterviewerSelectorFooter,
  toggleInterviewerSelection,
  type InterviewerUser,
} from './MobileInterviewerSelectorParts';

interface MobileInterviewerSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: InterviewerUser[];
  selectedUserIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function MobileInterviewerSelector({
  isOpen,
  onOpenChange,
  availableUsers,
  selectedUserIds,
  onSelectionChange,
  onConfirm,
  isLoading = false
}: MobileInterviewerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = filterInterviewers(availableUsers, searchTerm);

  const handleToggleUser = (userId: string) => {
    onSelectionChange(toggleInterviewerSelection(selectedUserIds, userId));
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 rounded-t-3xl"
        sheetId="mobile-interviewer-selector"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
            <SheetTitle>Select Interviewers</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {selectedUserIds.size} selected
            </p>
          </SheetHeader>

          <InterviewerSearchField
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />
          <InterviewerList
            users={filteredUsers}
            selectedUserIds={selectedUserIds}
            onToggleUser={handleToggleUser}
          />
          <MobileInterviewerSelectorFooter
            selectedCount={selectedUserIds.size}
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
            onConfirm={handleConfirm}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
