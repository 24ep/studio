"use client";

import { useCallback, useRef, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import {
  getPositionSearchKeyAction,
  shouldStopPositionSearchAfterInputChange,
} from "../position-page-utils";

interface UsePositionsPageSearchControlsOptions {
  isSearching: boolean;
  resetPagination: () => void;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
}

export function usePositionsPageSearchControls({
  isSearching,
  resetPagination,
  setIsSearching,
  setSearchTerm,
}: UsePositionsPageSearchControlsOptions) {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchFocus = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [setSearchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    resetPagination();

    if (shouldStopPositionSearchAfterInputChange(isSearching, value)) {
      setIsSearching(false);
    }
  }, [isSearching, resetPagination, setIsSearching, setSearchTerm]);

  const handleSearchKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    const action = getPositionSearchKeyAction(event.key);

    if (action.shouldClearSearch) {
      setSearchTerm("");
    }
    if (action.shouldBlurInput) {
      searchInputRef.current?.blur();
    }
  }, [setSearchTerm]);

  return {
    searchInputRef,
    searchTimeoutRef,
    handleSearchFocus,
    handleClearSearch,
    handleSearchChange,
    handleSearchKeyDown,
  };
}
