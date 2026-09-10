import { WebhookAnalyticsPanel } from './WebhookAnalyticsPanel';
import { WebhookConfigurationsPanel } from './WebhookConfigurationsPanel';
import { WebhookGlobalLogsPanel } from './WebhookGlobalLogsPanel';
import { WebhookNavigationTabs } from './WebhookNavigationTabs';
import { WebhookOverviewPanel } from './WebhookOverviewPanel';
import type { WebhookManagementController } from './use-webhook-management-controller';

interface WebhookManagementPanelsProps {
  controller: WebhookManagementController;
}

export function WebhookManagementPanels({ controller }: WebhookManagementPanelsProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <WebhookNavigationTabs activeTab={controller.activeTab} onTabChange={controller.setActiveTab} />

        <div className="flex-1 overflow-hidden">
          {controller.activeTab === 'overview' && (
            <WebhookOverviewPanel
              webhooks={controller.webhooks}
              analytics={controller.webhookAnalytics}
              isLoadingAnalytics={controller.analyticsLoading}
            />
          )}

          {controller.activeTab === 'webhooks' && (
            <WebhookConfigurationsPanel
              webhooks={controller.webhooks}
              filteredWebhooks={controller.filteredWebhooks}
              loading={controller.loading}
              viewMode={controller.viewMode}
              searchTerm={controller.searchTerm}
              statusFilter={controller.statusFilter}
              bulkAction={controller.bulkAction}
              bulkLoading={controller.bulkLoading}
              selectedWebhookCount={controller.selectedWebhookCount}
              allWebhooksSelected={controller.allWebhooksSelected}
              copiedId={controller.copiedId}
              isSelected={controller.isSelected}
              onExport={controller.exportWebhooks}
              onCreate={controller.openCreateDialog}
              onSearchChange={controller.setSearchTerm}
              onStatusFilterChange={controller.setStatusFilter}
              onViewModeChange={controller.setViewMode}
              onBulkActionChange={controller.setBulkAction}
              onPerformBulkAction={controller.performBulkAction}
              onClearSelection={() => controller.setSelectedWebhooks(new Set())}
              onSelectAll={controller.handleSelectAll}
              onWebhookSelection={controller.handleWebhookSelection}
              onCopyToClipboard={controller.copyToClipboard}
              onViewLogs={controller.handleLogsDialogOpen}
              onTest={controller.handleTestDialogOpen}
              onCustomizeBody={controller.setCustomizingWebhook}
              onEdit={controller.handleEdit}
              onDelete={controller.handleDelete}
            />
          )}

          {controller.activeTab === 'analytics' && (
            <WebhookAnalyticsPanel
              analytics={controller.webhookAnalytics}
              isLoading={controller.analyticsLoading}
              onViewLogs={controller.handleAnalyticsViewLogs}
            />
          )}

          {controller.activeTab === 'logs' && (
            <WebhookGlobalLogsPanel
              logs={controller.globalWebhookLogs}
              isLoading={controller.globalLogsLoading}
              filter={controller.globalLogsFilter}
              search={controller.globalLogsSearch}
              page={controller.globalLogsPage}
              total={controller.globalLogsTotal}
              onFilterChange={controller.handleGlobalLogsFilterChange}
              onSearchChange={controller.handleGlobalLogsSearch}
              onPageChange={controller.handleGlobalLogsPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
