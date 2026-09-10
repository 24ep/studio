"use client";

import { useRouter } from 'next/navigation';
import { ListOrdered, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LogsForm from '@/components/settings/LogsForm';
import LogsTable from '@/components/settings/LogsTable';
import { ApplicationLogsFiltersPanel } from './ApplicationLogsPageParts';
import { ApplicationLogsPagination } from './ApplicationLogsPagination';
import { useApplicationLogsPage } from './use-application-logs-page';

export default function ApplicationLogsPage() {
  const router = useRouter();
  const logsPage = useApplicationLogsPage();

  if (
    logsPage.sessionStatus === 'loading' ||
    (logsPage.isLoading && !logsPage.fetchError && !logsPage.isClient && logsPage.logs.length === 0)
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (logsPage.fetchError && !logsPage.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Logs</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{logsPage.fetchError}</p>
        {logsPage.fetchError === 'You do not have permission to view logs.' ? (
          <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">
            Go to Dashboard
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <ApplicationLogsFiltersPanel
        isLoading={logsPage.isLoading}
        levelFilter={logsPage.levelFilter}
        searchQuery={logsPage.searchQuery}
        actingUserIdFilter={logsPage.actingUserIdFilter}
        startDate={logsPage.startDate}
        endDate={logsPage.endDate}
        allUsers={logsPage.allUsers}
        filteredUsersForDropdown={logsPage.filteredUsersForDropdown}
        userSearch={logsPage.userSearch}
        userPopoverOpen={logsPage.userPopoverOpen}
        onSearchQueryChange={logsPage.setSearchQuery}
        onLevelFilterChange={logsPage.setLevelFilter}
        onActingUserIdFilterChange={logsPage.setActingUserIdFilter}
        onStartDateChange={logsPage.setStartDate}
        onEndDateChange={logsPage.setEndDate}
        onUserSearchChange={logsPage.setUserSearch}
        onUserPopoverOpenChange={logsPage.setUserPopoverOpen}
        onApplyFilters={logsPage.handleApplyFilters}
        onResetFilters={logsPage.handleResetFilters}
      />

      <ApplicationLogsContent
        logs={logsPage.logs}
        isLoading={logsPage.isLoading}
        currentPage={logsPage.currentPage}
        totalPages={logsPage.totalPages}
        onEditLog={logsPage.handleModalOpen}
        onPageChange={logsPage.setCurrentPage}
      />

      <LogsForm
        open={logsPage.isModalOpen}
        log={logsPage.editingLog}
        onClose={logsPage.handleModalClose}
      />
    </div>
  );
}

function ApplicationLogsContent({
  logs,
  isLoading,
  currentPage,
  totalPages,
  onEditLog,
  onPageChange,
}: {
  logs: Parameters<typeof LogsTable>[0]['logs'];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onEditLog: Parameters<typeof LogsTable>[0]['onEdit'];
  onPageChange: (page: number | ((previous: number) => number)) => void;
}) {
  if (isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-10">
        <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">
          No log entries found for the selected filter or search query.
        </p>
      </div>
    );
  }

  return (
    <>
      <LogsTable logs={logs} isLoading={isLoading} onEdit={onEditLog} />
      <ApplicationLogsPagination
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}
