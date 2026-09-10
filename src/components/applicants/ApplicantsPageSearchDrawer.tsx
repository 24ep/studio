"use client";

import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Applicant, ApplicantFilterValues, Position } from '@/lib/types';
import {
  ArrowPathIcon as RefreshCw,
  MagnifyingGlassIcon as Search,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { ApplicantsMobileListView } from './ApplicantsMobileListView';

interface ApplicantsPageSearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  applicants: Applicant[];
  tableLoading: boolean;
  stageNames: Record<string, string>;
  stageColors: Record<string, string>;
  allDbPositions: Position[];
  onApplicantClick: (applicant: Applicant) => void;
}

export function ApplicantsPageSearchDrawer({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  applicants,
  tableLoading,
  stageNames,
  stageColors,
  allDbPositions,
  onApplicantClick,
}: ApplicantsPageSearchDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92vh] flex flex-col">
        <DrawerHeader className="sticky top-0 z-10 border-b bg-background px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <DrawerTitle className="text-xl font-black">Search Applicants</DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close applicant search"
                className="mr-1 h-9 w-9 shrink-0 rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={filters.name || ''}
                onChange={(event) => onFilterChange({ ...filters, name: event.target.value || undefined })}
                className="pl-10 h-10 text-base"
                autoFocus
              />
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden relative">
          {tableLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          <ScrollArea className="h-full">
            <div className="p-1">
              {applicants.length > 0 ? (
                <ApplicantsMobileListView
                  applicants={applicants}
                  selectedApplicantIds={new Set()}
                  onToggleSelectApplicant={() => {}}
                  onApplicantClick={onApplicantClick}
                  stageNames={stageNames}
                  stageColors={stageColors}
                  allDbPositions={allDbPositions}
                />
              ) : !tableLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Search className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No results found for "{filters.name || ''}"</p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
