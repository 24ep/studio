"use client";

import type { ChangeEvent, RefObject } from 'react';
import { Check, Search, UserX, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';

import type { AvailableRecruiter, RecruiterCellPosition } from './RecruiterCellTypes';
import { RecruiterIconCircle } from './RecruiterCellDisplayParts';

interface RecruiterSearchBoxProps {
  searchInputRef: RefObject<HTMLInputElement>;
  searchTerm: string;
  onClearSearch: () => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface RecruiterOptionsListProps {
  filteredRecruiter: AvailableRecruiter[];
  position: RecruiterCellPosition;
  searchTerm: string;
  onSelectRecruiter: (recruiterId: string | null) => void;
}

export function RecruiterSearchBox({
  searchInputRef,
  searchTerm,
  onClearSearch,
  onSearchChange,
}: RecruiterSearchBoxProps) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        ref={searchInputRef}
        placeholder="Search recruiters..."
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
          aria-label="Clear recruiter search"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-accent"
          onClick={onClearSearch}
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function RecruiterOptionsList({
  filteredRecruiter,
  position,
  searchTerm,
  onSelectRecruiter,
}: RecruiterOptionsListProps) {
  return (
    <div className="max-h-[300px] overflow-y-auto">
      <UnassignRecruiterOption
        isSelected={!position.recruiterId}
        onSelect={() => onSelectRecruiter(null)}
      />

      {filteredRecruiter.length > 0 && (
        <div className="border-t border-border my-2" />
      )}

      {filteredRecruiter.length > 0 ? (
        filteredRecruiter.map((recruiter) => (
          <RecruiterOption
            key={recruiter.id}
            recruiter={recruiter}
            isSelected={position.recruiterId === recruiter.id}
            onSelect={() => onSelectRecruiter(recruiter.id)}
          />
        ))
      ) : (
        <EmptyRecruiterListMessage searchTerm={searchTerm} />
      )}
    </div>
  );
}

function UnassignRecruiterOption({
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <RecruiterIconCircle>
        <UserX className="h-3 w-3 text-gray-500" />
      </RecruiterIconCircle>
      <div className="flex flex-col flex-1">
        <span className="text-sm">Unassigned</span>
        <span className="text-xs text-muted-foreground">Remove recruiter assignment</span>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}

function RecruiterOption({
  recruiter,
  isSelected,
  onSelect,
}: {
  recruiter: AvailableRecruiter;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
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
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium">{recruiter.name}</span>
        <span className="text-xs text-muted-foreground">
          Recruiter - {recruiter.vacantHeadcount || 0} vacant
        </span>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}

function EmptyRecruiterListMessage({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="p-2 text-center">
      <p className="text-sm text-muted-foreground">
        {searchTerm.trim()
          ? `No recruiters found matching "${searchTerm}"`
          : 'No recruiters available'}
      </p>
    </div>
  );
}
