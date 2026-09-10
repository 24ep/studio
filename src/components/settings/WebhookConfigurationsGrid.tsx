"use client";

import { Clock, Edit, Plus, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import type { Webhook } from "./webhook-management-data";
import { formatWebhookDate } from "./webhook-management-utils";
import type { WebhookConfigurationsActions } from "./WebhookConfigurationsPanelTypes";
import { WebhookEventsSummary, WebhookRowActions, WebhookStatusBadge } from "./WebhookConfigurationsShared";

export function WebhookConfigurationsGrid({
  webhooks,
  filteredWebhooks,
  loading,
  actions,
}: {
  webhooks: Webhook[];
  filteredWebhooks: Webhook[];
  loading: boolean;
  actions: WebhookConfigurationsActions;
}) {
  if (loading) {
    return <WebhookGridLoading />;
  }

  if (webhooks.length === 0) {
    return <WebhookGridEmptyState onCreate={actions.onCreate} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredWebhooks.map((webhook) => (
        <WebhookConfigurationCard key={webhook.id} webhook={webhook} actions={actions} />
      ))}
    </div>
  );
}

function WebhookGridLoading() {
  return (
    <div className="grid grid-cols-1">
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-muted-foreground">Loading webhooks...</span>
        </div>
      </div>
    </div>
  );
}

function WebhookGridEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <Zap className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
      <p className="text-muted-foreground mb-4">
        Create your first webhook to start receiving real-time notifications.
      </p>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Create Webhook
      </Button>
    </div>
  );
}

function WebhookConfigurationCard({
  webhook,
  actions,
}: {
  webhook: Webhook;
  actions: WebhookConfigurationsActions;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{webhook.name}</CardTitle>
            <CardDescription className="truncate font-mono text-xs">
              {webhook.url}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={actions.isSelected(webhook.id)}
              onCheckedChange={(checked) => actions.onWebhookSelection(webhook.id, checked === true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <WebhookRowActions webhook={webhook} actions={actions} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <WebhookCardMetadata webhook={webhook} />
        <WebhookEventsSummary events={webhook.events} maxVisible={3} variant="outline" showLabel />
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{webhook.method}</span>
            <span>{webhook.timeout}s timeout</span>
            <span>{webhook.retry_count} retries</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => actions.onEdit(webhook)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookCardMetadata({ webhook }: { webhook: Webhook }) {
  return (
    <div className="flex items-center justify-between">
      <WebhookStatusBadge isActive={webhook.is_active} />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatWebhookDate(webhook.createdAt)}
      </div>
    </div>
  );
}
