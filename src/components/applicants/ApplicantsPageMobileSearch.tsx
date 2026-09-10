"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon as Search, XMarkIcon as X } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ApplicantFilterValues } from './ApplicantFilters';

interface ApplicantsPageMobileSearchProps {
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  isMobile: boolean;
}

export function ApplicantsPageMobileSearch({
  filters,
  onFilterChange,
  isMobile,
}: ApplicantsPageMobileSearchProps) {
  const [searchValue, setSearchValue] = useState(filters.name || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external filter changes
  useEffect(() => {
    setSearchValue(filters.name || '');
  }, [filters.name]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the filter update
    searchTimeoutRef.current = setTimeout(() => {
      onFilterChange({
        ...filters,
        name: value || undefined,
      });
    }, 300);
  }, [filters, onFilterChange]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    onFilterChange({
      ...filters,
      name: undefined,
    });
  }, [filters, onFilterChange]);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="p-4 pb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Applicants by name..."
          value={searchValue}
          onChange={handleSearchChange}
          className="pl-10 pr-12 h-12 text-base touch-manipulation"
          autoComplete="off"
          spellCheck="false"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground active:bg-muted/80 touch-manipulation"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

