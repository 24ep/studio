import { useCallback, useState } from "react";
import type { DateRange } from "react-day-picker";

import {
  createUploadQueueDatePresetRange,
  type UploadQueueDateFilterType,
  type UploadQueueDatePreset,
} from "./applicant-import-queue-utils";

export type SortDirection = "asc" | "desc" | null;

export function useApplicantImportUploadQueueFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateFilterType, setDateFilterType] = useState<UploadQueueDateFilterType>("create");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>("upload_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [positionSearchTerm, setPositionSearchTerm] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sourceSearchTerm, setSourceSearchTerm] = useState<string>("");

  const resetToFirstPage = useCallback(() => setPage(1), []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handlePositionFilterChange = useCallback((value: string) => {
    setPositionFilter(value);
    setPositionSearchTerm("");
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleSourceFilterChange = useCallback((value: string) => {
    setSourceFilter(value);
    setSourceSearchTerm("");
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleDateFilterTypeChange = useCallback((type: UploadQueueDateFilterType) => {
    setDateFilterType(type);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const clearDateRange = useCallback(() => {
    setDateRange(undefined);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setPositionFilter("all");
    setPositionSearchTerm("");
    setSourceFilter("all");
    setSourceSearchTerm("");
    setDateRange(undefined);
    setDateFilterType("create");
    resetToFirstPage();
  }, [resetToFirstPage]);

  const setDatePreset = useCallback((preset: UploadQueueDatePreset) => {
    setDateRange(createUploadQueueDatePresetRange(preset));
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleSort = useCallback((column: string | null, direction?: SortDirection) => {
    if (column === sortField && (direction === null || direction === undefined)) {
      setSortDirection((currentDirection) => {
        if (currentDirection === "asc") return "desc";
        if (currentDirection === "desc") return null;
        return "asc";
      });
    } else {
      setSortField(column || "upload_date");
      setSortDirection(direction || "desc");
    }

    resetToFirstPage();
  }, [resetToFirstPage, sortField]);

  return {
    clearAllFilters,
    clearDateRange,
    dateFilterType,
    dateRange,
    handleDateFilterTypeChange,
    handleDateRangeChange,
    handlePositionFilterChange,
    handleSort,
    handleSourceFilterChange,
    handleStatusFilterChange,
    page,
    pageSize,
    positionFilter,
    positionSearchTerm,
    resetToFirstPage,
    searchTerm,
    setDatePreset,
    setPage,
    setPageSize,
    setPositionSearchTerm,
    setSearchTerm,
    setSourceSearchTerm,
    sortDirection,
    sortField,
    sourceFilter,
    sourceSearchTerm,
    statusFilter,
  };
}
