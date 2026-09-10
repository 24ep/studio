"use client";

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { getApplicantTablePaginationState } from './applicant-page-utils';
import { ApplicantsPageTableAreaFooters } from './ApplicantsPageTableAreaFooters';
import { ApplicantsPageTableAreaSurfaceBridge } from './ApplicantsPageTableAreaSurfaceBridge';
import type { ApplicantsPageTableAreaProps } from './ApplicantsPageTableAreaTypes';

export function ApplicantsPageTableArea(props: ApplicantsPageTableAreaProps) {
  const {
    aiMatchedApplicantIds,
    aiRecordCount,
    fetchTableData,
    filters,
    isAiSearchActive,
    page,
    pageSize,
    total,
    totalPages,
    displayedApplicants,
  } = props;
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    await fetchTableData(filters, page, pageSize);
  };

  const {
    elementRef: pullToRefreshRef,
    isRefreshing,
    pullProgress,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: isMobile,
  });
  // A successful page payload can arrive before the separate count query.
  // Never announce an empty result while visible rows are already rendered.
  const visibleRecordFloor = displayedApplicants.length > 0
    ? ((Math.max(1, page) - 1) * Math.max(1, pageSize)) + displayedApplicants.length
    : 0;
  const effectiveTotal = Math.max(total, visibleRecordFloor);
  const effectiveTotalPages = Math.max(totalPages, Math.ceil(effectiveTotal / Math.max(1, pageSize)), 1);
  const paginationState = getApplicantTablePaginationState({
    isAiSearchActive,
    aiMatchedApplicantIds,
    aiRecordCount,
    total: effectiveTotal,
    page,
    pageSize,
    totalPages: effectiveTotalPages,
  });

  return (
    <>
      <ApplicantsPageTableAreaSurfaceBridge
        {...props}
        isMobile={isMobile}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
        pullToRefreshRef={pullToRefreshRef as React.RefObject<HTMLDivElement>}
      />
      <ApplicantsPageTableAreaFooters
        {...props}
        isMobile={isMobile}
        paginationState={paginationState}
      />
    </>
  );
}
