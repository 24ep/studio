'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookLogsFilters } from './WebhookLogsFilters';
import { WebhookLogsHeader } from './WebhookLogsHeader';
import { WebhookLogsTable } from './WebhookLogsTable';
import type { WebhookLogsProps } from './webhook-delivery-logs-types';
import { useWebhookDeliveryLogs } from './use-webhook-delivery-logs';

export default function WebhookLogs({ webhookId, webhookName }: WebhookLogsProps) {
  const logs = useWebhookDeliveryLogs({ webhookId, webhookName });

  return (
    <div className="space-y-6">
      <WebhookLogsHeader
        webhookName={webhookName}
      />

      <WebhookLogsFilters
        filters={logs.filters}
        onFilterChange={logs.handleFilterChange}
        onClearFilters={logs.clearFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>
            Showing {logs.logs.length} of {logs.pagination.total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookLogsTable
            logs={logs.logs}
            loading={logs.loading}
            error={logs.error}
            pagination={logs.pagination}
            onPageChange={logs.handlePageChange}
            onReplay={logs.replayLog}
            replayingLogId={logs.replayingLogId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
