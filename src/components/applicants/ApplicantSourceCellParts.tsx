"use client";

import {
  ArrowPathIcon as Loader2,
  ChevronDownIcon as ChevronDown,
  GlobeAltIcon as Globe,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';
import { forwardRef, type RefObject, type ChangeEvent, type ComponentPropsWithoutRef } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ApplicantSource } from '@/lib/types';
import {
  SourceLogo,
  SourceOptionList,
  SourceSearchBox,
} from './ApplicantSourceCellPopover';
import type { ApplicantSourceCellApplicant } from './ApplicantSourceCellTypes';

export function ApplicantSourceReadOnlyView({
  applicant,
}: {
  applicant: ApplicantSourceCellApplicant;
}) {
  return (
    <div className="flex items-center gap-2">
      {applicant.source ? (
        <>
          <SourceLogo source={applicant.source} />
          <span className="text-sm font-medium text-foreground truncate">
            {applicant.source.name}
          </span>
          {applicant.subSource && (
            <span className="text-xs text-muted-foreground">
              ({applicant.subSource})
            </span>
          )}
        </>
      ) : (
        <NoSourceLabel />
      )}
    </div>
  );
}

interface ApplicantSourceEditableViewProps {
  applicant: ApplicantSourceCellApplicant;
  currentSource?: ApplicantSource | null;
  filteredSources: ApplicantSource[];
  isAssigning: boolean;
  open: boolean;
  searchInputRef: RefObject<HTMLInputElement>;
  searchTerm: string;
  subSource: string;
  clearSearch: () => void;
  handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSelect: (sourceId: string | null) => void;
  handleSubSourceBlur: () => void;
  handleSubSourceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  setOpen: (open: boolean) => void;
}

export function ApplicantSourceEditableView({
  applicant,
  currentSource,
  filteredSources,
  isAssigning,
  open,
  searchInputRef,
  searchTerm,
  subSource,
  clearSearch,
  handleSearchChange,
  handleSelect,
  handleSubSourceBlur,
  handleSubSourceChange,
  setOpen,
}: ApplicantSourceEditableViewProps) {
  return (
    <div className="flex items-center gap-2">
      <Popover open={open && !isAssigning} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <SourceTriggerButton
            applicant={applicant}
            isAssigning={isAssigning}
            open={open}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-[280px] p-0"
          align="start"
          popoverId="applicant-detail-source-dropdown"
          zIndexType="dropdown"
        >
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Select Source</div>
            <SourceSearchBox
              clearSearch={clearSearch}
              handleSearchChange={handleSearchChange}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
            />
            <SourceOptionList
              applicant={applicant}
              filteredSources={filteredSources}
              handleSelect={handleSelect}
              searchTerm={searchTerm}
            />
          </div>

          {currentSource?.allowSubSource && (
            <div className="p-2 border-t">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Sub-source (optional)
              </label>
              <input
                type="text"
                value={subSource}
                onChange={handleSubSourceChange}
                onBlur={handleSubSourceBlur}
                placeholder="Enter sub-source..."
                className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface SourceTriggerButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  applicant: ApplicantSourceCellApplicant;
  isAssigning: boolean;
  open: boolean;
}

const SourceTriggerButton = forwardRef<HTMLButtonElement, SourceTriggerButtonProps>(function SourceTriggerButton({
  applicant,
  className,
  isAssigning,
  open,
  ...buttonProps
}, ref) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      role="combobox"
      aria-expanded={open && !isAssigning}
      className={cn(
        "h-auto p-2 justify-start text-left w-full max-w-[200px] border-0 shadow-none",
        "hover:bg-accent/50 transition-colors",
        isAssigning && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...buttonProps}
    >
      {isAssigning ? (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
          <span className="text-xs text-muted-foreground">Updating...</span>
        </div>
      ) : applicant.source ? (
        <div className="flex items-center gap-2 min-w-0">
          <SourceLogo source={applicant.source} className="flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {applicant.source.name}
          </span>
          {applicant.subSource && (
            <span className="text-xs text-muted-foreground">
              ({applicant.subSource})
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Globe className="h-3 w-3 text-gray-500" />
          </div>
          <span className="text-sm text-muted-foreground">Assign source</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
        </div>
      )}
    </Button>
  );
});

function NoSourceLabel() {
  return (
    <>
      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <X className="h-3 w-3 text-gray-500" />
      </div>
      <span className="text-sm text-muted-foreground">No source</span>
    </>
  );
}
