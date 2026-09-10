'use client';

import { AlertTriangle, ExternalLink, Loader2, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApplicantAvatarCompact } from '@/components/ui/applicant-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApplicantNameWithLang } from '@/lib/applicantUtils';
import { cn } from '@/lib/utils';
import {
  getCalendarPositionValidationIssues,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';

interface ApplicantSummaryProps {
  applicant: SearchApplicant;
  label?: string;
  onClear?: () => void;
  showPosition?: boolean;
}

export function ApplicantSummary({ applicant, label, onClear, showPosition = true }: ApplicantSummaryProps) {
  return (
    <div className="rounded-md border bg-muted/50 p-3">
      {label && <p className="mb-2 text-xs text-muted-foreground">{label}</p>}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ApplicantAvatarCompact
            user={{
              id: applicant.id,
              name: applicant.name,
              avatarUrl: applicant.avatarUrl,
              email: applicant.email || undefined,
            }}
            size="sm"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{applicant.name}</div>
            {applicant.email && (
              <div className="truncate text-xs text-muted-foreground">{applicant.email}</div>
            )}
            {showPosition && applicant.position?.title && (
              <div className="truncate text-xs text-muted-foreground">Position: {applicant.position.title}</div>
            )}
          </div>
        </div>
        {onClear && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface ApplicantSearchSectionProps {
  isSearching: boolean;
  searchQuery: string;
  searchResults: SearchApplicant[];
  selectedApplicant: SearchApplicant | null;
  onSearchQueryChange: (query: string) => void;
  onSelectApplicant: (applicant: SearchApplicant) => void;
}

export function ApplicantSearchSection({
  isSearching,
  searchQuery,
  searchResults,
  selectedApplicant,
  onSearchQueryChange,
  onSelectApplicant,
}: ApplicantSearchSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Search Applicant</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {searchQuery && searchResults.length > 0 && !selectedApplicant && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {searchResults.map((applicant) => (
            <ApplicantSearchResultRow
              key={applicant.id}
              applicant={applicant}
              onSelectApplicant={onSelectApplicant}
            />
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && !selectedApplicant && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No Applicants found
        </div>
      )}
    </>
  );
}

function ApplicantSearchResultRow({
  applicant,
  onSelectApplicant,
}: {
  applicant: SearchApplicant;
  onSelectApplicant: (applicant: SearchApplicant) => void;
}) {
  const nameInfo = formatApplicantNameWithLang({ id: applicant.id, name: applicant.name });

  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted"
      onClick={() => onSelectApplicant(applicant)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectApplicant(applicant);
        }
      }}
    >
      <ApplicantAvatarCompact
        user={{
          id: applicant.id,
          name: applicant.name,
          avatarUrl: applicant.avatarUrl,
          email: applicant.email || undefined,
        }}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-sm font-medium', nameInfo.fontClass)} lang={nameInfo.lang}>
          {applicant.name}
        </div>
        {applicant.email && (
          <div className="truncate text-xs text-muted-foreground">
            {applicant.email}
          </div>
        )}
        {applicant.position?.title && (
          <div className="truncate text-xs text-muted-foreground">
            Position: {applicant.position.title}
          </div>
        )}
      </div>
    </div>
  );
}

export function PositionValidationWarning({
  positionValidation,
  onConfigurePosition,
}: {
  positionValidation: PositionValidation;
  onConfigurePosition: () => void;
}) {
  const issues = getCalendarPositionValidationIssues(positionValidation);

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Cannot create evaluation link</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          {positionValidation.positionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigurePosition}
              className="mt-2 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Configure Position
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
