"use client";

import { Download, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Webhook } from "./webhook-management-data";
import type { WebhookStatusFilter } from "./webhook-management-utils";
import { WebhookConfigurationsGrid } from "./WebhookConfigurationsGrid";
import { WebhookConfigurationsTable } from "./WebhookConfigurationsTable";
import type { WebhookConfigurationsActions, WebhookViewMode } from "./WebhookConfigurationsPanelTypes";
import { WebhookBulkSelectionBar, WebhookConfigurationsToolbar } from "./WebhookConfigurationsToolbar";

interface WebhookConfigurationsPanelProps {
  webhooks: Webhook[];
  filteredWebhooks: Webhook[];
  loading: boolean;
  viewMode: WebhookViewMode;
  searchTerm: string;
  statusFilter: WebhookStatusFilter;
  bulkAction: string;
  bulkLoading: boolean;
  selectedWebhookCount: number;
  allWebhooksSelected: boolean;
  copiedId: string | null;
  isSelected: (webhookId: string) => boolean;
  onExport: () => void;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: WebhookStatusFilter) => void;
  onViewModeChange: (mode: WebhookViewMode) => void;
  onBulkActionChange: (value: string) => void;
  onPerformBulkAction: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onWebhookSelection: (webhookId: string, selected: boolean) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  onViewLogs: (webhook: Webhook | null) => void;
  onTest: (webhook: Webhook | null) => void;
  onCustomizeBody: (webhook: Webhook | null) => void;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
}

export function WebhookConfigurationsPanel({
  webhooks,
  filteredWebhooks,
  loading,
  viewMode,
  searchTerm,
  statusFilter,
  bulkAction,
  bulkLoading,
  selectedWebhookCount,
  allWebhooksSelected,
  copiedId,
  isSelected,
  onExport,
  onCreate,
  onSearchChange,
  onStatusFilterChange,
  onViewModeChange,
  onBulkActionChange,
  onPerformBulkAction,
  onClearSelection,
  onSelectAll,
  onWebhookSelection,
  onCopyToClipboard,
  onViewLogs,
  onTest,
  onCustomizeBody,
  onEdit,
  onDelete,
}: WebhookConfigurationsPanelProps) {
  const actions: WebhookConfigurationsActions = {
    isSelected,
    onCreate,
    onSelectAll,
    onWebhookSelection,
    onCopyToClipboard,
    onViewLogs,
    onTest,
    onCustomizeBody,
    onEdit,
    onDelete,
  };

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Webhook Configurations
                </CardTitle>
                <CardDescription>
                  Manage your webhook endpoints and configurations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={onExport} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WebhookConfigurationsToolbar
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              viewMode={viewMode}
              onSearchChange={onSearchChange}
              onStatusFilterChange={onStatusFilterChange}
              onViewModeChange={onViewModeChange}
            />
            <WebhookBulkSelectionBar
              selectedWebhookCount={selectedWebhookCount}
              bulkAction={bulkAction}
              bulkLoading={bulkLoading}
              onBulkActionChange={onBulkActionChange}
              onPerformBulkAction={onPerformBulkAction}
              onClearSelection={onClearSelection}
            />
            {viewMode === "grid" ? (
              <WebhookConfigurationsGrid
                webhooks={webhooks}
                filteredWebhooks={filteredWebhooks}
                loading={loading}
                actions={actions}
              />
            ) : (
              <WebhookConfigurationsTable
                webhooks={webhooks}
                filteredWebhooks={filteredWebhooks}
                loading={loading}
                allWebhooksSelected={allWebhooksSelected}
                copiedId={copiedId}
                actions={actions}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
