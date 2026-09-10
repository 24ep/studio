"use client";

import type { ReactElement, ReactNode } from 'react';
import { Fragment } from 'react';
import { Search, UserCheck, UserX, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { RecruiterFilterRecruiter } from './recruiter-filter-sidebar-types';
import { RecruiterFilterListItem, RecruiterFilterOption } from './RecruiterFilterRows';

interface RecruiterSearchInputProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  localize: (key: string, fallback: string) => string;
}

interface RecruiterFilterListProps {
  recruiterIds: string[];
  recruiters: RecruiterFilterRecruiter[];
  selectedRecruiterId: string | null;
  onRecruiterSelect: (recruiterId: string | null) => void;
}

export function RecruiterSearchInput({
  searchTerm,
  onSearchTermChange,
  localize
}: RecruiterSearchInputProps): ReactElement {
  return (
    <div className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={localize("positions.recruiterSearch.placeholder", "Search recruiters")}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchTermChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export { RecruiterFilterOption } from './RecruiterFilterRows';

export function AllRecruitersOption({
  active,
  onSelect,
  localize
}: {
  active: boolean;
  onSelect: () => void;
  localize: (key: string, fallback: string) => string;
}): ReactElement {
  return (
    <RecruiterFilterOption
      active={active}
      label={localize("positions.recruiterList.all", "All recruiters")}
      onSelect={onSelect}
      icon={<UserCheck className="h-5 w-5" />}
    />
  );
}

export function UnassignedRecruiterOption({
  active,
  onSelect,
  localize
}: {
  active: boolean;
  onSelect: () => void;
  localize: (key: string, fallback: string) => string;
}): ReactElement {
  return (
    <>
      <RecruiterSidebarDivider />
      <RecruiterFilterOption
        active={active}
        label={localize("positions.recruiterList.unassigned", "Unassigned")}
        onSelect={onSelect}
        icon={<UserX className="h-5 w-5" />}
        activeIconClassName="bg-orange-500/20 text-orange-600"
        inactiveIconClassName="bg-muted/50 text-muted-foreground group-hover:bg-orange-500/10 group-hover:text-orange-600"
      />
    </>
  );
}

export function RecruiterFilterList({
  recruiterIds,
  recruiters,
  selectedRecruiterId,
  onRecruiterSelect
}: RecruiterFilterListProps): ReactElement | null {
  if (recruiterIds.length === 0) {
    return null;
  }

  return (
    <>
      <RecruiterSidebarDivider />
      {recruiterIds.map((recruiterId, index) => {
        const recruiter = recruiters.find((item) => item.id === recruiterId);
        return (
          <Fragment key={recruiterId}>
            <RecruiterFilterListItem
              recruiterId={recruiterId}
              recruiter={recruiter}
              index={index}
              active={selectedRecruiterId === recruiterId}
              onSelect={() => onRecruiterSelect(recruiterId)}
            />
            {index < recruiterIds.length - 1 && <RecruiterSidebarDivider />}
          </Fragment>
        );
      })}
    </>
  );
}

export function RecruiterSidebarDivider(): ReactElement {
  return <div className="border-b border-border/50 mx-3 my-1" />;
}

export function RecruiterSidebarMessage({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="px-3 py-8 text-center">
      <p className="text-base text-muted-foreground font-medium">{children}</p>
    </div>
  );
}
