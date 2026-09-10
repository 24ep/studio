"use client";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { Webhook } from "./webhook-management-data";
import { formatWebhookDate } from "./webhook-management-utils";
import type { WebhookConfigurationsActions } from "./WebhookConfigurationsPanelTypes";
import { WebhookEventsSummary, WebhookRowActions, WebhookStatusBadge } from "./WebhookConfigurationsShared";

export function WebhookConfigurationsTable({
  webhooks,
  filteredWebhooks,
  loading,
  allWebhooksSelected,
  copiedId,
  actions,
}: {
  webhooks: Webhook[];
  filteredWebhooks: Webhook[];
  loading: boolean;
  allWebhooksSelected: boolean;
  copiedId: string | null;
  actions: WebhookConfigurationsActions;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox checked={allWebhooksSelected} onCheckedChange={actions.onSelectAll} />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Events</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Delivery</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <WebhookTableBody
          webhooks={webhooks}
          filteredWebhooks={filteredWebhooks}
          loading={loading}
          copiedId={copiedId}
          actions={actions}
        />
      </TableBody>
    </Table>
  );
}

function WebhookTableBody({
  webhooks,
  filteredWebhooks,
  loading,
  copiedId,
  actions,
}: {
  webhooks: Webhook[];
  filteredWebhooks: Webhook[];
  loading: boolean;
  copiedId: string | null;
  actions: WebhookConfigurationsActions;
}) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Loading webhooks...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (webhooks.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
          No webhooks configured. Create your first webhook to start receiving notifications.
        </TableCell>
      </TableRow>
    );
  }

  return filteredWebhooks.map((webhook) => (
    <WebhookConfigurationTableRow
      key={webhook.id}
      webhook={webhook}
      copiedId={copiedId}
      actions={actions}
    />
  ));
}

function WebhookConfigurationTableRow({
  webhook,
  copiedId,
  actions,
}: {
  webhook: Webhook;
  copiedId: string | null;
  actions: WebhookConfigurationsActions;
}) {
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={actions.isSelected(webhook.id)}
          onCheckedChange={(checked) => actions.onWebhookSelection(webhook.id, checked === true)}
        />
      </TableCell>
      <TableCell className="font-medium">{webhook.name}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <span className="truncate max-w-[200px]">{webhook.url}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onCopyToClipboard(webhook.url, `url-${webhook.id}`)}
          >
            {copiedId === `url-${webhook.id}` ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <WebhookEventsSummary events={webhook.events} maxVisible={2} variant="secondary" />
      </TableCell>
      <TableCell>
        <WebhookStatusBadge isActive={webhook.is_active} />
      </TableCell>
      <TableCell>{formatWebhookDate(webhook.createdAt)}</TableCell>
      <TableCell className="text-right">
        <WebhookRowActions webhook={webhook} actions={actions} />
      </TableCell>
    </TableRow>
  );
}
