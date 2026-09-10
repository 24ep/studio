"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  globalTalentSearchService,
  type GlobalTalentSearchResult,
} from "@/services/globalTalentSearchService";
import {
  GlobalTalentSearchButton,
  GlobalTalentSearchExamples,
  GlobalTalentSearchFooter,
  GlobalTalentSearchResultsList,
} from "./GlobalTalentSearchParts";
import type {
  GlobalTalentSearchProps,
  GlobalTalentSearchResults,
} from "./GlobalTalentSearchTypes";

export function GlobalTalentSearch({
  buttonLabel = "Search applicants & positions",
  buttonClassName,
  compact = false,
  onApplicantSelect,
  onPositionSelect,
}: GlobalTalentSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<GlobalTalentSearchResults>({
    applicants: [],
    positions: [],
  });

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ applicants: [], positions: [] });
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await globalTalentSearchService.search(trimmed);
        setResults(response.results);
      } catch (error) {
        console.error("[GlobalTalentSearch] search failed", error);
        setResults({ applicants: [], positions: [] });
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const closeAndReset = () => {
    setOpen(false);
    setQuery("");
  };

  const handleApplicantSelect = (result: GlobalTalentSearchResult) => {
    closeAndReset();
    if (onApplicantSelect) {
      onApplicantSelect(result);
      return;
    }
    router.push(`/applicants?query=${encodeURIComponent(result.title)}`);
  };

  const handlePositionSelect = (result: GlobalTalentSearchResult) => {
    closeAndReset();
    if (onPositionSelect) {
      onPositionSelect(result);
      return;
    }
    router.push(`/positions/${result.id}`);
  };

  return (
    <>
      <GlobalTalentSearchButton
        buttonLabel={buttonLabel}
        buttonClassName={buttonClassName}
        compact={compact}
        onOpen={() => setOpen(true)}
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="border-b border-border/60 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(16,185,129,0.06))] px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Talent Search
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Search applicants and positions from one command bar.
              </p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>

        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search applicants, positions, departments, recruiters..."
        />

        <CommandList className="max-h-[420px]">
          {query.trim().length < 2 ? (
            <GlobalTalentSearchExamples onExampleSelect={setQuery} />
          ) : (
            <>
              <CommandEmpty>No matches found.</CommandEmpty>
              <GlobalTalentSearchResultsList
                results={results}
                onApplicantSelect={handleApplicantSelect}
                onPositionSelect={handlePositionSelect}
              />
            </>
          )}
        </CommandList>

        <GlobalTalentSearchFooter />
      </CommandDialog>
    </>
  );
}
