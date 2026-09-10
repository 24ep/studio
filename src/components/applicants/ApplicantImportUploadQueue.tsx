"use client";

import { ExclamationCircleIcon as AlertCircle } from "@heroicons/react/24/outline";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { ApplicantImportQueueDetailsDialog } from "./ApplicantImportQueueDetailsDialog";
import { ApplicantImportQueueFilters } from "./ApplicantImportQueueFilters";
import { ApplicantImportQueuePagination } from "./ApplicantImportQueuePagination";
import { ApplicantImportQueueSummaryCards } from "./ApplicantImportQueueSummaryCards";
import { ApplicantImportUploadQueueTable } from "./ApplicantImportUploadQueueTable";
import { useApplicantImportUploadQueue } from "./use-applicant-import-upload-queue";

export default function ApplicantImportUploadQueue() {
  const queue = useApplicantImportUploadQueue();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto">
            <div className="space-y-5">
              <ApplicantImportQueueSummaryCards summary={queue.queueData?.summary} />

              <ApplicantImportQueueFilters
                availableSources={queue.availableSources}
                dateFilterType={queue.dateFilterType}
                dateRange={queue.dateRange}
                openSelect={queue.openSelect}
                positionFilter={queue.positionFilter}
                positionSearchTerm={queue.positionSearchTerm}
                positions={queue.positions}
                searchTerm={queue.searchTerm}
                sourceFilter={queue.sourceFilter}
                sourceSearchTerm={queue.sourceSearchTerm}
                statusFilter={queue.statusFilter}
                clearAllFilters={queue.clearAllFilters}
                clearDateRange={queue.clearDateRange}
                handleDateFilterTypeChange={queue.handleDateFilterTypeChange}
                handleDateRangeChange={queue.handleDateRangeChange}
                handlePositionFilterChange={queue.handlePositionFilterChange}
                handleSearch={queue.handleSearch}
                handleSourceFilterChange={queue.handleSourceFilterChange}
                handleStatusFilterChange={queue.handleStatusFilterChange}
                setDatePreset={queue.setDatePreset}
                setOpenSelect={queue.setOpenSelect}
                setPositionSearchTerm={queue.setPositionSearchTerm}
                setSearchTerm={queue.setSearchTerm}
                setSourceSearchTerm={queue.setSourceSearchTerm}
              />
            </div>

            {queue.errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{queue.errorMessage}</AlertDescription>
              </Alert>
            )}

            <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_1px_2px_hsl(var(--foreground)/.03)]">
              <ApplicantImportUploadQueueTable
                items={queue.queueData?.data}
                loading={queue.loading}
                selectedItems={queue.selectedItems}
                selectionMode={queue.selectionMode}
                sortControls={{
                  sortField: queue.sortField,
                  sortDirection: queue.sortDirection,
                  openMenu: queue.openMenu,
                  onSort: queue.handleSort,
                  onMenuClick: queue.handleMenuClick,
                  onMenuClose: () => queue.setOpenMenu(null),
                  onOpenChange: queue.handleOpenChange,
                }}
                onBulkDelete={queue.handleBulkDelete}
                onBulkRetry={queue.handleBulkRetry}
                onClearSelection={() => queue.setSelectedItems(new Set())}
                onDeleteItem={queue.handleDeleteItem}
                onPreviewFile={queue.handleFilePreview}
                onRetryItem={queue.handleRetryItem}
                onSelectAll={queue.handleSelectAll}
                onSelectItem={queue.handleSelectItem}
                onShowDetails={queue.handleShowDetails}
              />

              {queue.queueData && (
                <ApplicantImportQueuePagination
                  total={queue.queueData.total}
                  page={queue.page}
                  pageSize={queue.pageSize}
                  openSelect={queue.openSelect}
                  setPage={queue.setPage}
                  setPageSize={queue.setPageSize}
                  setOpenSelect={queue.setOpenSelect}
                  fetchQueue={queue.fetchQueue}
                />
              )}
            </section>

            <ApplicantImportQueueDetailsDialog
              item={queue.selectedItem}
              open={queue.showDetails}
              onOpenChange={queue.setShowDetails}
            />

            <FileViewerModal
              isOpen={queue.isFileViewerOpen}
              onOpenChange={queue.setIsFileViewerOpen}
              file={queue.selectedFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
