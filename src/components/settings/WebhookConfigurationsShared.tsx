"use client";

import { Badge } from "@/components/ui/badge";

import { WebhookActionsMenu } from "./WebhookActionsMenu";
import type { Webhook } from "./webhook-management-data";
import type { WebhookConfigurationsActions } from "./WebhookConfigurationsPanelTypes";

export function WebhookEventsSummary({
  events,
  maxVisible,
  variant,
  showLabel,
}: {
  events: string[];
  maxVisible: number;
  variant: "outline" | "secondary";
  showLabel?: boolean;
}) {
  return (
    <div>
      {showLabel && (
        <p className="text-xs font-medium text-muted-foreground mb-2">Events ({events.length})</p>
      )}
      <div className="flex flex-wrap gap-1">
        {events.slice(0, maxVisible).map((event) => (
          <Badge key={event} variant={variant} className="text-xs">
            {event}
          </Badge>
        ))}
        {events.length > maxVisible && (
          <Badge variant="outline" className="text-xs">
            +{events.length - maxVisible} more
          </Badge>
        )}
      </div>
    </div>
  );
}

export function WebhookStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function WebhookRowActions({
  webhook,
  actions,
}: {
  webhook: Webhook;
  actions: WebhookConfigurationsActions;
}) {
  return (
    <WebhookActionsMenu
      webhook={webhook}
      onCopyId={(webhookId) => actions.onCopyToClipboard(webhookId, webhookId)}
      onViewLogs={actions.onViewLogs}
      onTest={actions.onTest}
      onCustomizeBody={actions.onCustomizeBody}
      onEdit={actions.onEdit}
      onDelete={actions.onDelete}
    />
  );
}
