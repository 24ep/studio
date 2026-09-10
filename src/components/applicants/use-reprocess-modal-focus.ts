"use client";

import { useEffect, useRef } from "react";

export function useReprocessModalSearchFocus() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchFocusTimeoutRef.current) {
        clearTimeout(searchFocusTimeoutRef.current);
      }
    };
  }, []);

  const refocusPositionSearch = () => {
    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    if (searchFocusTimeoutRef.current) {
      clearTimeout(searchFocusTimeoutRef.current);
    }
    searchFocusTimeoutRef.current = timeoutId;
  };

  return {
    refocusPositionSearch,
    searchInputRef,
  };
}
