"use client";

import {
  UploadQueueDetailsDialog,
  UploadQueueErrorAlert,
  UploadQueueFilters,
  UploadQueueHeader,
  UploadQueueItemsCard,
} from "./UploadQueueStatusParts";
import { useUploadQueueStatus } from "./use-upload-queue-status";

export function UploadQueueStatus() {
  const {
    queueData,
    loading,
    errorMessage,
    selectedItem,
    showDetails,
    searchTerm,
    statusFilter,
    page,
    pageSize,
    lastUpdate,
    realtimeConnected,
    actions,
  } = useUploadQueueStatus();

  return (
    <div className="space-y-4">
      <UploadQueueHeader
        realtimeConnected={realtimeConnected}
      />
      <UploadQueueFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        pageSize={pageSize}
        onSearchTermChange={actions.setSearchTerm}
        onSearch={actions.handleSearch}
        onStatusFilterChange={actions.handleStatusFilterChange}
        onPageSizeChange={actions.handlePageSizeChange}
      />
      <UploadQueueErrorAlert errorMessage={errorMessage} />
      <UploadQueueItemsCard
        queueData={queueData}
        loading={loading}
        page={page}
        pageSize={pageSize}
        lastUpdate={lastUpdate}
        onItemClick={actions.handleItemClick}
        onPreviousPage={actions.goToPreviousPage}
        onNextPage={actions.goToNextPage}
      />
      <UploadQueueDetailsDialog
        item={selectedItem}
        open={showDetails}
        onOpenChange={actions.setShowDetails}
      />
    </div>
  );
}
