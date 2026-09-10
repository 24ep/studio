"use client";

import { CheckCircle, LayoutGrid, List, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { WebhookStatusFilter } from "./webhook-management-utils";
import type { WebhookViewMode } from "./WebhookConfigurationsPanelTypes";

export function WebhookConfigurationsToolbar({
  searchTerm,
  statusFilter,
  viewMode,
  onSearchChange,
  onStatusFilterChange,
  onViewModeChange,
}: {
  searchTerm: string;
  statusFilter: WebhookStatusFilter;
  viewMode: WebhookViewMode;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: WebhookStatusFilter) => void;
  onViewModeChange: (mode: WebhookViewMode) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search webhooks..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as WebhookStatusFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WebhookBulkSelectionBar({
  selectedWebhookCount,
  bulkAction,
  bulkLoading,
  onBulkActionChange,
  onPerformBulkAction,
  onClearSelection,
}: {
  selectedWebhookCount: number;
  bulkAction: string;
  bulkLoading: boolean;
  onBulkActionChange: (value: string) => void;
  onPerformBulkAction: () => void;
  onClearSelection: () => void;
}) {
  if (selectedWebhookCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-2 bg-muted/30 rounded border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {selectedWebhookCount} webhook{selectedWebhookCount !== 1 ? "s" : ""} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={bulkAction} onValueChange={onBulkActionChange}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enable">Enable Selected</SelectItem>
              <SelectItem value="disable">Disable Selected</SelectItem>
              <SelectItem value="delete">Delete Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={onPerformBulkAction}
            disabled={!bulkAction || bulkLoading}
            className="h-7 px-2"
          >
            {bulkLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : (
              "Apply"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
