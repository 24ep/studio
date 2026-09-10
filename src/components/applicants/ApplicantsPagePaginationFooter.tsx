"use client";

import { ChevronDownIcon as ChevronDown, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApplicantFilterValues } from '@/lib/types';
import { getApplicantTablePaginationState } from './applicant-page-utils';

type ApplicantTablePaginationState = ReturnType<typeof getApplicantTablePaginationState>;

interface ApplicantsPagePaginationFooterProps {
  isMobile: boolean;
  paginationState: ApplicantTablePaginationState;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: ApplicantFilterValues;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => Promise<void>;
  handlePageSizeChange: (newPageSize: number) => Promise<void>;
}

export function ApplicantsPagePaginationFooter({
  isMobile,
  paginationState,
  page,
  pageSize,
  totalPages,
  filters,
  setPage,
  fetchTableData,
  handlePageSizeChange,
}: ApplicantsPagePaginationFooterProps) {
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (filters) {
      fetchTableData(filters, newPage, pageSize);
    }
  };

  const handlePageSizeSelect = (value: string) => {
    const newPageSize = parseInt(value);
    handlePageSizeChange(newPageSize);
    if (filters) {
      fetchTableData(filters, 1, newPageSize);
    }
  };

  return isMobile ? (
    <MobileApplicantsPaginationFooter
      paginationState={paginationState}
      onSeeMore={() => handlePageChange(page + 1)}
    />
  ) : (
    <DesktopApplicantsPaginationFooter
      paginationState={paginationState}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      onPageSizeSelect={handlePageSizeSelect}
    />
  );
}

function MobileApplicantsPaginationFooter({
  paginationState,
  onSeeMore,
}: {
  paginationState: ApplicantTablePaginationState;
  onSeeMore: () => void;
}) {
  return (
    <div className="p-4 border-t pb-[calc(4.5rem+env(safe-area-inset-bottom,0))]">
      {paginationState.currentTotal === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-2">
          {paginationState.emptyLabel}
        </div>
      ) : !paginationState.hasMore ? (
        <div className="text-center text-sm text-muted-foreground py-2">
          {paginationState.allItemsLabel}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm text-muted-foreground text-center">
            {paginationState.rangeLabel}
          </div>
          <Button
            onClick={onSeeMore}
            variant="outline"
            className="w-full max-w-xs h-12 text-base font-medium active:scale-95 touch-manipulation"
          >
            See More
            <ChevronDown className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

function DesktopApplicantsPaginationFooter({
  paginationState,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeSelect,
}: {
  paginationState: ApplicantTablePaginationState;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeSelect: (value: string) => void;
}) {
  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {paginationState.currentTotal === 0
              ? paginationState.emptyLabel
              : paginationState.rangeLabel}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Select value={pageSize.toString()} onValueChange={onPageSizeSelect}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={paginationState.isPreviousPageDisabled}
            variant="ghost"
            size="sm"
            className="h-8 px-3 hover:bg-muted/50 transition-colors duration-200"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {paginationState.pageLabel}
          </span>

          <Button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={paginationState.isNextPageDisabled}
            variant="ghost"
            size="sm"
            className="h-8 px-3 hover:bg-muted/50 transition-colors duration-200"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
