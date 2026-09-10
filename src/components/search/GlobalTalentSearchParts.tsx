"use client";

import { Briefcase, Search, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { GlobalTalentSearchResult } from "@/services/globalTalentSearchService";

import { formatSearchMeta } from "./search-utils";
import type {
  GlobalTalentSearchButtonProps,
  GlobalTalentSearchResultsProps,
} from "./GlobalTalentSearchTypes";

const APPLICANT_EXAMPLES = [
  "frontend designer in Bangkok",
  "react developer with 5 years experience",
];

const POSITION_EXAMPLES = [
  "product designer",
  "open engineering roles",
];

export function GlobalTalentSearchButton({
  buttonLabel,
  buttonClassName,
  compact,
  onOpen,
}: GlobalTalentSearchButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "group h-9 gap-2 border-border/60 bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground",
        compact ? "px-3" : "min-w-[240px] justify-between px-3",
        buttonClassName,
      )}
      onClick={onOpen}
    >
      <span className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <span className="text-sm">{compact ? "Search" : buttonLabel}</span>
      </span>
      {!compact && (
        <span className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Ctrl K
        </span>
      )}
    </Button>
  );
}

export function GlobalTalentSearchExamples({
  onExampleSelect,
}: {
  onExampleSelect: (example: string) => void;
}) {
  return (
    <div className="grid gap-3 p-4 text-sm text-muted-foreground md:grid-cols-2">
      <SearchExampleCard
        title="Applicants"
        examples={APPLICANT_EXAMPLES}
        icon={<Users className="h-4 w-4 text-primary" />}
        onExampleSelect={onExampleSelect}
      />
      <SearchExampleCard
        title="Positions"
        examples={POSITION_EXAMPLES}
        icon={<Briefcase className="h-4 w-4 text-primary" />}
        onExampleSelect={onExampleSelect}
      />
    </div>
  );
}

function SearchExampleCard({
  title,
  examples,
  icon,
  onExampleSelect,
}: {
  title: string;
  examples: string[];
  icon: ReactNode;
  onExampleSelect: (example: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            className="block text-left text-sm transition-colors hover:text-foreground"
            onClick={() => onExampleSelect(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GlobalTalentSearchResultsList({
  results,
  onApplicantSelect,
  onPositionSelect,
}: GlobalTalentSearchResultsProps) {
  return (
    <>
      {results.applicants.length > 0 && (
        <SearchResultGroup
          heading="Applicants"
          typeLabel="Applicant"
          icon={<Users className="h-4 w-4" />}
          iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-300"
          results={results.applicants}
          onSelect={onApplicantSelect}
        />
      )}

      {results.applicants.length > 0 && results.positions.length > 0 && <CommandSeparator />}

      {results.positions.length > 0 && (
        <SearchResultGroup
          heading="Positions"
          typeLabel="Position"
          icon={<Briefcase className="h-4 w-4" />}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
          results={results.positions}
          onSelect={onPositionSelect}
        />
      )}
    </>
  );
}

function SearchResultGroup({
  heading,
  typeLabel,
  icon,
  iconClassName,
  results,
  onSelect,
}: {
  heading: string;
  typeLabel: string;
  icon: ReactNode;
  iconClassName: string;
  results: GlobalTalentSearchResult[];
  onSelect: (result: GlobalTalentSearchResult) => void;
}) {
  return (
    <CommandGroup heading={heading}>
      {results.map((result) => (
        <CommandItem
          key={`${typeLabel.toLowerCase()}-${result.id}`}
          value={`${result.title} ${result.subtitle ?? ""} ${result.meta ?? ""}`}
          onSelect={() => onSelect(result)}
          className="flex items-center gap-3 rounded-xl px-3 py-3"
        >
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClassName)}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{result.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {formatSearchMeta([result.subtitle, result.meta])}
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {typeLabel}
          </Badge>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

export function GlobalTalentSearchFooter() {
  return (
    <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
      <span>
        <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px]">Up/Down</kbd> navigate
      </span>
      <span>
        <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px]">Enter</kbd> open
      </span>
      <span>
        <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px]">Esc</kbd> close
      </span>
    </div>
  );
}
