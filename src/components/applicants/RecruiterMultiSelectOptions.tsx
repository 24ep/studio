"use client";

import type { ReactNode } from 'react';
import { CheckIcon as Check, MagnifyingGlassIcon as Search } from '@heroicons/react/24/outline';

import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { useLocalization } from '@/contexts/LocalizationContext';
import { cn } from '@/lib/utils';

import type { RecruiterMultiSelectOption } from './recruiter-multi-select-types';
import {
  SELECT_ALL_RECRUITER_ID,
  UNASSIGNED_RECRUITER_ID,
} from './recruiter-multi-select-utils';

interface RecruiterMultiSelectOptionsProps {
  disabled: boolean;
  filteredRecruiters: RecruiterMultiSelectOption[];
  hasSelectAll: boolean;
  hasUnassigned: boolean;
  searchTerm: string;
  selectedIds: Set<string>;
  onSearchTermChange: (value: string) => void;
  onToggleRecruiter: (recruiterId: string) => void;
}

export function RecruiterMultiSelectOptions({
  disabled,
  filteredRecruiters,
  hasSelectAll,
  hasUnassigned,
  searchTerm,
  selectedIds,
  onSearchTermChange,
  onToggleRecruiter,
}: RecruiterMultiSelectOptionsProps) {
  const { t } = useLocalization();
  return (
    <div className="p-2">
      <div className="text-sm font-medium mb-2">{t("applicants.recruiterSelection.title", "Select Recruiter")}</div>
      <RecruiterSearchInput
        disabled={disabled}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        localize={t}
      />
      {filteredRecruiters.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          {t("applicants.recruiterSearch.noneAvailable", "No recruiters available")}
        </div>
      ) : (
        <div className="space-y-0.5">
          <SpecialRecruiterOption
            active={hasSelectAll}
            description={t("applicants.recruiterFilter.allRecruitersDescription", "All recruiters")}
            label={t("applicants.recruiterFilter.selectAll", "Select All")}
            onClick={() => onToggleRecruiter(SELECT_ALL_RECRUITER_ID)}
          />
          <SpecialRecruiterOption
            active={hasUnassigned}
            description={t("applicants.recruiterFilter.unassignedDescription", "Applicants without assigned recruiters")}
            label={t("common.unassigned", "Unassigned")}
            onClick={() => onToggleRecruiter(UNASSIGNED_RECRUITER_ID)}
          />
          {filteredRecruiters.map((recruiter) => (
            <RecruiterOptionRow
              key={recruiter.id}
              recruiter={recruiter}
              selected={selectedIds.has(recruiter.id)}
              onClick={() => onToggleRecruiter(recruiter.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecruiterSearchInput({
  disabled,
  searchTerm,
  onSearchTermChange,
  localize,
}: {
  disabled: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      <input
        type="text"
        placeholder={localize("applicants.recruiterSearch.placeholder", "Search recruiters...")}
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        disabled={disabled}
      />
    </div>
  );
}

function SpecialRecruiterOption({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <RecruiterOptionButton active={active} onClick={onClick}>
      <Check className={cn('mr-2 h-3 w-3', active ? 'opacity-100' : 'opacity-0')} />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </RecruiterOptionButton>
  );
}

function RecruiterOptionRow({
  recruiter,
  selected,
  onClick,
}: {
  recruiter: RecruiterMultiSelectOption;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useLocalization();
  return (
    <RecruiterOptionButton active={selected} onClick={onClick}>
      <Check className={cn('mr-2 h-3 w-3', selected ? 'opacity-100' : 'opacity-0')} />
      <RecruiterAvatarCompact
        user={{
          id: recruiter.id,
          name: recruiter.name,
          avatarUrl: recruiter.avatarUrl,
          personalColor: recruiter.personalColor,
        }}
        size="xs"
        className="mr-2"
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{recruiter.name}</span>
        <span className="text-xs text-muted-foreground">{t("common.recruiter", "Recruiter")}</span>
      </div>
    </RecruiterOptionButton>
  );
}

function RecruiterOptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      <div className="flex items-center">
        {children}
      </div>
    </button>
  );
}
