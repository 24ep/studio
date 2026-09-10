import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';
import type { ApplicantFilterTab } from '../ApplicantFilterTabs';
import {
  addApplicantQueryToHistory,
  createAdvancedApplicantFiltersPayload,
  parseAdvancedQuery,
} from '../applicant-filter-query-utils';

interface UseApplicantAdvancedQueryInput {
  advancedQuery?: string;
  onClearAllFilters: () => void;
  onFilterChangeRef: MutableRefObject<(filters: ApplicantFilterValues) => void>;
  syncAdvancedQueryFiltersToState: (parsedFilters: ApplicantFilterValues) => void;
}

export function useApplicantAdvancedQuery({
  advancedQuery,
  onClearAllFilters,
  onFilterChangeRef,
  syncAdvancedQueryFiltersToState,
}: UseApplicantAdvancedQueryInput) {
  const [advancedQueryInput, setAdvancedQueryInput] = useState('');
  const [activeTab, setActiveTab] = useState<ApplicantFilterTab>('filters');
  const [isAdvancedQuerySyntaxModalOpen, setIsAdvancedQuerySyntaxModalOpen] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [queryValidationError, setQueryValidationError] = useState<string | null>(null);
  const processedAdvancedQueryRef = useRef('');

  const handleApplyAdvancedQuery = (queryOverride?: string) => {
    const queryToApply = (queryOverride ?? advancedQueryInput).trim();
    if (!queryToApply) return;

    processedAdvancedQueryRef.current = queryToApply;
    if (queryOverride !== undefined) {
      setAdvancedQueryInput(queryOverride);
    }

    setQueryHistory((prev) => addApplicantQueryToHistory(prev, queryToApply));

    const parsedFilters = parseAdvancedQuery(queryToApply);
    syncAdvancedQueryFiltersToState(parsedFilters);
    onFilterChangeRef.current(createAdvancedApplicantFiltersPayload(parsedFilters));
  };

  const handleClearAdvancedQuery = () => {
    setAdvancedQueryInput('');
    setQueryValidationError(null);
    onClearAllFilters();
  };

  useEffect(() => {
    if (!advancedQuery?.trim()) {
      return;
    }

    try {
      processedAdvancedQueryRef.current = advancedQuery;
      setAdvancedQueryInput(advancedQuery);
      setActiveTab('advanced');

      const parsedFilters = parseAdvancedQuery(advancedQuery);

      if (Object.keys(parsedFilters).length > 0) {
        onFilterChangeRef.current(createAdvancedApplicantFiltersPayload(parsedFilters));
        syncAdvancedQueryFiltersToState(parsedFilters);
      }
    } catch (error) {
      console.error('Error parsing advanced query:', error);
      setAdvancedQueryInput(advancedQuery);
      setActiveTab('advanced');
    }
  }, [advancedQuery, onFilterChangeRef, syncAdvancedQueryFiltersToState]);

  return {
    activeTab,
    advancedQueryInput,
    handleApplyAdvancedQuery,
    handleClearAdvancedQuery,
    isAdvancedQuerySyntaxModalOpen,
    processedAdvancedQueryRef,
    queryHistory,
    queryValidationError,
    setActiveTab,
    setAdvancedQueryInput,
    setIsAdvancedQuerySyntaxModalOpen,
    setQueryHistory,
    setQueryValidationError,
    setShowQueryHistory,
    showQueryHistory,
  };
}
