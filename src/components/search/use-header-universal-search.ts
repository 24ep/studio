"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { globalTalentSearchService } from "@/services/globalTalentSearchService";
import {
  buildHeaderSearchResults,
  EMPTY_HEADER_SEARCH_RESULTS,
  filterHeaderPageResults,
  getCurrentPageSearchAction,
  type HeaderSearchResult,
  type HeaderSearchResultsSource,
} from "./search-utils";

function resetCurrentPageSearch(pathname: string | null) {
  if (pathname?.startsWith("/applicants") || pathname?.startsWith("/positions")) {
    window.dispatchEvent(new CustomEvent("global:search", { detail: "" }));
  }
}

export function useHeaderUniversalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<HeaderSearchResultsSource>(
    EMPTY_HEADER_SEARCH_RESULTS,
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setResults(EMPTY_HEADER_SEARCH_RESULTS);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await globalTalentSearchService.search(trimmed);
        setResults({
          applicants: response.results.applicants ?? [],
          positions: response.results.positions ?? [],
          users: response.results.users ?? [],
          hris: response.results.hris ?? [],
        });
      } catch (error) {
        console.error("[HeaderUniversalSearch] search failed", error);
        setResults(EMPTY_HEADER_SEARCH_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const pageResults = React.useMemo(
    () => filterHeaderPageResults(query, 6, session?.user),
    [query, session?.user],
  );

  const currentPageAction = React.useMemo<HeaderSearchResult | null>(() => (
    getCurrentPageSearchAction(pathname, query)
  ), [pathname, query]);

  const flatResults = React.useMemo<HeaderSearchResult[]>(() => (
    buildHeaderSearchResults({ currentPageAction, pageResults, results })
  ), [currentPageAction, pageResults, results]);

  const clearSearch = React.useCallback(() => {
    setQuery("");
    setResults(EMPTY_HEADER_SEARCH_RESULTS);
    setLoading(false);
    setOpen(false);
    resetCurrentPageSearch(pathname);
  }, [pathname]);

  const handleQueryChange = React.useCallback((nextValue: string) => {
    setQuery(nextValue);

    if (nextValue.trim().length === 0) {
      setResults(EMPTY_HEADER_SEARCH_RESULTS);
      setLoading(false);
      setOpen(false);
      resetCurrentPageSearch(pathname);
      return;
    }

    setOpen(true);
  }, [pathname]);

  const handleSelect = React.useCallback((result: HeaderSearchResult) => {
    if (result.target?.type === "route") {
      router.push(result.target.href);
    } else if (result.target?.type === "current-page-filter") {
      window.dispatchEvent(new CustomEvent("global:search", { detail: result.target.query }));
    } else if (result.target?.type === "tasks-focus") {
      window.dispatchEvent(new Event("mytasks:focus-search"));
    }

    setOpen(false);
  }, [router]);

  return {
    clearSearch,
    containerRef,
    flatResults,
    handleQueryChange,
    handleSelect,
    loading,
    open,
    query,
    setOpen,
  };
}
