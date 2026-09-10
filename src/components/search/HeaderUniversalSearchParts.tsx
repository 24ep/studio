"use client";

import { Briefcase, FileText, Loader2, Search, Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatSearchMeta,
  getSearchResultBadge,
  getSearchResultIconClassName,
  type HeaderSearchResult,
  type HeaderSearchResultType,
} from "./search-utils";

interface HeaderSearchInputProps {
  autoFocus?: boolean;
  inputId?: string;
  placeholder: string;
  query: string;
  onClear: () => void;
  onFocus: () => void;
  onQueryChange: (query: string) => void;
}

interface HeaderSearchDropdownProps {
  flatResults: HeaderSearchResult[];
  loading: boolean;
  query: string;
  onSelect: (result: HeaderSearchResult) => void;
  presentation?: "dropdown" | "inline";
}

function HeaderSearchResultIcon({ type }: { type: HeaderSearchResultType }) {
  switch (type) {
    case "applicant":
    case "user":
    case "employee":
      return <Users className="h-4 w-4" />;
    case "position":
      return <Briefcase className="h-4 w-4" />;
    case "page":
    case "action":
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export function HeaderSearchInput({
  autoFocus,
  inputId = "header-search-input",
  placeholder,
  query,
  onClear,
  onFocus,
  onQueryChange,
}: HeaderSearchInputProps) {
  return (
    <>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
      <Input
        id={inputId}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-full border-transparent bg-muted/70 pl-10 pr-11 text-sm font-medium text-foreground shadow-none transition-colors duration-200 placeholder:text-muted-foreground hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        value={query}
        onFocus={onFocus}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">Clear search</span>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </>
  );
}

export function HeaderSearchDropdown({
  flatResults,
  loading,
  query,
  onSelect,
  presentation = "dropdown",
}: HeaderSearchDropdownProps) {
  return (
    <div className={cn(
      "overflow-hidden border border-border/70 bg-background",
      presentation === "dropdown"
        ? "absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[70] rounded-2xl shadow-2xl"
        : "min-h-0 flex-1 rounded-xl shadow-sm",
    )}>
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Universal Search</div>
            <div className="text-xs text-muted-foreground">
              Search people, requests, work, tasks, and settings from one place.
            </div>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>

      <div className={cn("overflow-y-auto p-2", presentation === "dropdown" ? "max-h-[420px]" : "max-h-[min(65dvh,560px)]")}>
        {query.trim().length < 2 ? (
          <div className="space-y-2 p-2">
            <div className="px-3 py-3 text-sm">
              <div className="font-medium text-foreground">Start typing to search everything</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Try employee names, requests, payroll runs, learning, tasks, or settings.
              </div>
            </div>
          </div>
        ) : flatResults.length === 0 && !loading ? (
          <div className="p-4 text-sm text-muted-foreground">No results found for "{query}".</div>
        ) : (
          <div className="space-y-1">
            {flatResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => onSelect(result)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    getSearchResultIconClassName(result.type),
                  )}
                >
                  <HeaderSearchResultIcon type={result.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{result.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatSearchMeta([result.subtitle, result.meta])}
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {getSearchResultBadge(result.type)}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
