"use client";

import { AdjustmentsHorizontalIcon as SlidersHorizontal } from '@heroicons/react/24/outline';

import {
  ClearQueueFiltersButton,
  QueueDateRangeFilter,
  QueueDateTypeFilter,
  QueuePositionFilter,
  QueueQuickDateButtons,
  QueueSearchFilter,
  QueueSourceFilter,
  QueueStatusFilter,
} from './ApplicantImportQueueFiltersParts';
import type { ApplicantImportQueueFiltersProps } from './ApplicantImportQueueFiltersTypes';

export function ApplicantImportQueueFilters({
  availableSources,
  dateFilterType,
  dateRange,
  openSelect,
  positionFilter,
  positionSearchTerm,
  positions,
  searchTerm,
  sourceFilter,
  sourceSearchTerm,
  statusFilter,
  clearAllFilters,
  clearDateRange,
  handleDateFilterTypeChange,
  handleDateRangeChange,
  handlePositionFilterChange,
  handleSearch,
  handleSourceFilterChange,
  handleStatusFilterChange,
  setDatePreset,
  setOpenSelect,
  setPositionSearchTerm,
  setSearchTerm,
  setSourceSearchTerm,
}: ApplicantImportQueueFiltersProps) {
  const hasActiveFilters = Boolean(
    searchTerm
    || statusFilter !== 'all'
    || positionFilter !== 'all'
    || positionSearchTerm
    || sourceFilter !== 'all'
    || sourceSearchTerm
    || dateRange
    || dateFilterType !== 'create'
  );

  return (
    <section className="rounded-2xl border border-border/70 bg-background p-4 shadow-[0_1px_2px_hsl(var(--foreground)/.03)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Find queue items</h2>
        </div>
        <ClearQueueFiltersButton
          clearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[1.5fr_1fr_1.2fr_1fr_1fr_1.35fr_1fr]">
        <QueueSearchFilter
          handleSearch={handleSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <QueueStatusFilter
          handleStatusFilterChange={handleStatusFilterChange}
          openSelect={openSelect}
          setOpenSelect={setOpenSelect}
          statusFilter={statusFilter}
        />
        <QueuePositionFilter
          handlePositionFilterChange={handlePositionFilterChange}
          openSelect={openSelect}
          positionFilter={positionFilter}
          positionSearchTerm={positionSearchTerm}
          positions={positions}
          setOpenSelect={setOpenSelect}
          setPositionSearchTerm={setPositionSearchTerm}
        />
        <QueueSourceFilter
          availableSources={availableSources}
          handleSourceFilterChange={handleSourceFilterChange}
          openSelect={openSelect}
          setOpenSelect={setOpenSelect}
          setSourceSearchTerm={setSourceSearchTerm}
          sourceFilter={sourceFilter}
          sourceSearchTerm={sourceSearchTerm}
        />
        <QueueDateTypeFilter
          dateFilterType={dateFilterType}
          handleDateFilterTypeChange={handleDateFilterTypeChange}
          openSelect={openSelect}
          setOpenSelect={setOpenSelect}
        />
        <QueueDateRangeFilter
          clearDateRange={clearDateRange}
          dateFilterType={dateFilterType}
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
        />
        <QueueQuickDateButtons setDatePreset={setDatePreset} />
      </div>
    </section>
  );
}
