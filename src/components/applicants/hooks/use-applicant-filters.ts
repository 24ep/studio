import { useState, useCallback, useRef, useEffect } from 'react';
import { ApplicantFilterValues } from '@/components/applicants/ApplicantFilters';
import { toggleApplicantGradeSelection } from '../applicant-page-utils';
import {
  applyHorizontalApplicantFitScoreFilters,
  areApplicantHookFiltersEqual,
  buildInitialApplicantHookFilters,
  DEFAULT_APPLICANT_HOOK_FILTERS,
  isApplicantFitScoreFilterChange,
  mergeApplicantHookFilters,
} from './applicant-filter-hook-utils';

export function useApplicantFilters(initialFilters?: ApplicantFilterValues) {
  const [filters, setFilters] = useState<ApplicantFilterValues>(() =>
    buildInitialApplicantHookFilters(initialFilters)
  );

  // Use a ref to access current filters value without causing re-renders
  const filtersRef = useRef<ApplicantFilterValues>(filters);
  
  // Update ref whenever filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Horizontal fit score filter state
  const [horizontalSelectedFitScoreGrades, setHorizontalSelectedFitScoreGrades] = useState<Set<string>>(new Set());
  const [horizontalSelectedMatchingFitScoreGrades, setHorizontalSelectedMatchingFitScoreGrades] = useState<Set<string>>(new Set());

  // Add a ref to track the debounce timeout
  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAppliedFiltersRef = useRef<string>('');
  const optimisticUpdateRef = useRef<boolean>(false);

  // Horizontal fit score filter handlers
  const handleHorizontalFitScoreGradeToggle = useCallback((grade: string) => {
    setHorizontalSelectedFitScoreGrades(prev => toggleApplicantGradeSelection(prev, grade));
  }, []);

  const handleHorizontalMatchingFitScoreGradeToggle = useCallback((grade: string) => {
    setHorizontalSelectedMatchingFitScoreGrades(prev => toggleApplicantGradeSelection(prev, grade));
  }, []);

  // Clear all horizontal fit score filters
  const clearAllHorizontalFitScoreFilters = useCallback(() => {
    setHorizontalSelectedFitScoreGrades(new Set());
    setHorizontalSelectedMatchingFitScoreGrades(new Set());
  }, []);

  // Apply horizontal fit score filters
  const applyHorizontalFitScoreFilters = useCallback(() => {
    return applyHorizontalApplicantFitScoreFilters({
      filters: filtersRef.current,
      selectedAppliedGrades: horizontalSelectedFitScoreGrades,
      selectedMatchingGrades: horizontalSelectedMatchingFitScoreGrades,
    });
  }, [horizontalSelectedFitScoreGrades, horizontalSelectedMatchingFitScoreGrades]);

  const handleFilterChange = useCallback((
    newFilters: ApplicantFilterValues,
    onFilterChange?: (filters: ApplicantFilterValues) => void
  ) => {
    // Clear any existing timeout
    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
      filterChangeTimeoutRef.current = null;
    }
    
    // Use ref to get current filters value without causing re-renders
    const currentFilters = filtersRef.current;
    const combinedFilters = mergeApplicantHookFilters(currentFilters, newFilters);
    
    // Check if filters have actually changed to prevent unnecessary updates
    if (areApplicantHookFiltersEqual(currentFilters, combinedFilters)) {
      return;
    }

    // Only clear horizontal fit score filters when other filters change (not fit score filters)
    if (!isApplicantFitScoreFilterChange(newFilters)) {
      setHorizontalSelectedFitScoreGrades(new Set());
      setHorizontalSelectedMatchingFitScoreGrades(new Set());
    }
    
    // Immediate UI update for better responsiveness
    setFilters(combinedFilters);
    
    // Increased debounce to prevent infinite loops
    filterChangeTimeoutRef.current = setTimeout(() => {
      onFilterChange?.(combinedFilters);
    }, 150); // Increased from 50ms to 150ms to prevent infinite loops
  }, []); // Removed filters from dependency array to prevent infinite loop

  const clearAllFilters = useCallback(() => {
    // Clear horizontal fit score filters
    setHorizontalSelectedFitScoreGrades(new Set());
    setHorizontalSelectedMatchingFitScoreGrades(new Set());
    
    setFilters(DEFAULT_APPLICANT_HOOK_FILTERS);
    return DEFAULT_APPLICANT_HOOK_FILTERS;
  }, []);



  return {
    filters,
    setFilters,
    horizontalSelectedFitScoreGrades,
    setHorizontalSelectedFitScoreGrades,
    horizontalSelectedMatchingFitScoreGrades,
    setHorizontalSelectedMatchingFitScoreGrades,
    handleHorizontalFitScoreGradeToggle,
    handleHorizontalMatchingFitScoreGradeToggle,
    applyHorizontalFitScoreFilters,
    handleFilterChange,
    clearAllFilters,
    filterChangeTimeoutRef,
    lastAppliedFiltersRef,
    optimisticUpdateRef,
    clearAllHorizontalFitScoreFilters
  };
}
