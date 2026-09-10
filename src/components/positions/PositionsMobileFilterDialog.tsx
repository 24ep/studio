"use client";

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { PositionStatusFilter } from './position-page-utils';
import {
  PositionsMobileDepartmentFilter,
  PositionsMobileSearchFilter,
  PositionsMobileStatusFilter,
} from './PositionsMobileFilterSections';

interface PositionsMobileFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: PositionStatusFilter;
  onStatusChange: (status: PositionStatusFilter) => void;
  departmentFilter: string;
  onDepartmentChange: (department: string) => void;
  allDepartments: string[];
  isLoadingDepartments: boolean;
  onRetryDepartments: () => void;
}

export function PositionsMobileFilterDialog({
  isOpen,
  onOpenChange,
  searchTerm,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  allDepartments,
  isLoadingDepartments,
  onRetryDepartments,
}: PositionsMobileFilterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-[90vh] p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl bg-background"
        dialogId="position-filter-modal"
        hideCloseButton
      >
        <DialogHeader className="px-4 pt-6 pb-6 flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Filter Positions</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 p-4 space-y-4">
          <PositionsMobileSearchFilter
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
          />

          <PositionsMobileStatusFilter
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
          />

          <PositionsMobileDepartmentFilter
            allDepartments={allDepartments}
            departmentFilter={departmentFilter}
            isLoadingDepartments={isLoadingDepartments}
            onDepartmentChange={onDepartmentChange}
            onRetryDepartments={onRetryDepartments}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
