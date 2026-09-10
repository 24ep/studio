import type { ChangeEvent, RefObject } from 'react';
import {
  CheckIcon as Check,
  MagnifyingGlassIcon as Search,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { useLocalization } from '@/contexts/LocalizationContext';

import type {
  ApplicantRecruiterCellApplicant,
  ApplicantRecruiterOption,
} from './applicant-recruiter-cell-types';
import { UnassignedRecruiterIcon } from './ApplicantRecruiterCellDisplay';

interface ApplicantRecruiterCellPopoverProps {
  applicant: ApplicantRecruiterCellApplicant;
  filteredRecruiter: ApplicantRecruiterOption[];
  onClearSearch: () => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelect: (recruiterId: string | null) => void;
  searchInputRef: RefObject<HTMLInputElement>;
  searchTerm: string;
}

export function ApplicantRecruiterCellPopover({
  applicant,
  filteredRecruiter,
  onClearSearch,
  onSearchChange,
  onSelect,
  searchInputRef,
  searchTerm,
}: ApplicantRecruiterCellPopoverProps) {
  const { t } = useLocalization();
  return (
    <div className="p-2">
      <div className="text-sm font-medium mb-2">{t("applicants.recruiterSelection.title", "Select Recruiter")}</div>

      <RecruiterSearchInput
        onClearSearch={onClearSearch}
        onSearchChange={onSearchChange}
        searchInputRef={searchInputRef}
        searchTerm={searchTerm}
        localize={t}
      />

      <div className="max-h-[300px] overflow-y-auto">
        <UnassignRecruiterOption
          isSelected={!applicant.recruiterId}
          onSelect={() => onSelect(null)}
          localize={t}
        />

        {filteredRecruiter.length > 0 && (
          <div className="border-t border-border my-2" />
        )}

        <RecruiterOptionList
          applicant={applicant}
          filteredRecruiter={filteredRecruiter}
          onSelect={onSelect}
          searchTerm={searchTerm}
          localize={t}
        />
      </div>
    </div>
  );
}

function RecruiterSearchInput({
  onClearSearch,
  onSearchChange,
  searchInputRef,
  searchTerm,
  localize,
}: Pick<ApplicantRecruiterCellPopoverProps, 'onClearSearch' | 'onSearchChange' | 'searchInputRef' | 'searchTerm'> & {
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={searchInputRef}
        placeholder={localize("applicants.recruiterSearch.placeholder", "Search recruiters...")}
        value={searchTerm}
        onChange={onSearchChange}
        className="pl-10 pr-10 h-8 text-sm focus:ring-2 focus:ring-primary/20"
        data-search-input
        autoComplete="off"
        spellCheck="false"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={localize("applicants.recruiterSearch.clear", "Clear recruiter search")}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-accent"
          onClick={onClearSearch}
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function UnassignRecruiterOption({
  isSelected,
  onSelect,
  localize,
}: {
  isSelected: boolean;
  onSelect: () => void;
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <UnassignedRecruiterIcon />
      <div className="flex flex-col flex-1">
        <span className="text-sm">{localize("common.unassigned", "Unassigned")}</span>
        <span className="text-xs text-muted-foreground">{localize("applicants.recruiterSearch.removeAssignment", "Remove recruiter assignment")}</span>
      </div>
      {isSelected && (
        <Check className="h-4 w-4 text-primary" />
      )}
    </button>
  );
}

function RecruiterOptionList({
  applicant,
  filteredRecruiter,
  onSelect,
  searchTerm,
  localize,
}: Pick<ApplicantRecruiterCellPopoverProps, "applicant" | "filteredRecruiter" | "onSelect" | "searchTerm"> & {
  localize: (key: string, fallback: string) => string;
}) {
  if (filteredRecruiter.length > 0) {
    return filteredRecruiter.map(recruiter => (
      <RecruiterOption
        key={recruiter.id}
        applicant={applicant}
        recruiter={recruiter}
        onSelect={onSelect}
        localize={localize}
      />
    ));
  }

  return (
    <div className="p-2 text-center">
      <p className="text-sm text-muted-foreground">
        {searchTerm.trim()
          ? localize("applicants.recruiterSearch.noMatch", `No recruiters found matching "{search}"`).replace(
            "{search}",
            `"${searchTerm}"`
          )
          : localize("applicants.recruiterSearch.noneAvailable", "No recruiters available")}
      </p>
    </div>
  );
}

function RecruiterOption({
  applicant,
  onSelect,
  recruiter,
  localize,
}: {
  applicant: ApplicantRecruiterCellApplicant;
  onSelect: (recruiterId: string | null) => void;
  recruiter: ApplicantRecruiterOption;
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(recruiter.id)}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <RecruiterAvatarCompact
        user={{
          id: recruiter.id,
          name: recruiter.name,
          avatarUrl: recruiter.avatarUrl,
          personalColor: recruiter.personalColor,
        }}
        size="xs"
        className="h-5 w-5"
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium">{recruiter.name}</span>
        <span className="text-xs text-muted-foreground">{localize("common.recruiter", "Recruiter")}</span>
      </div>
      {applicant.recruiterId === recruiter.id && (
        <Check className="h-4 w-4 text-primary" />
      )}
    </button>
  );
}
