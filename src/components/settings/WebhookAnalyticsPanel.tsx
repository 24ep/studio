import { Activity } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WebhookAnalytics } from './webhook-analytics-utils';
import {
  WebhookAnalyticsContent,
  WebhookAnalyticsEmptyState,
  WebhookAnalyticsLoadingState,
} from './WebhookAnalyticsPanelParts';

interface WebhookAnalyticsPanelProps {
  analytics: WebhookAnalytics | null;
  isLoading: boolean;
  onViewLogs: (webhookId: string) => void;
}

export function WebhookAnalyticsPanel({
  analytics,
  isLoading,
  onViewLogs,
}: WebhookAnalyticsPanelProps) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Webhook Analytics
            </CardTitle>
            <CardDescription>
              Monitor webhook performance and delivery statistics (last 24 hours)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <WebhookAnalyticsLoadingState />
            ) : analytics ? (
              <WebhookAnalyticsContent analytics={analytics} onViewLogs={onViewLogs} />
            ) : (
              <WebhookAnalyticsEmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
