import { Activity, AlertTriangle, CheckCircle, Clock, Send, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildWebhookAnalyticsMetrics,
  type WebhookAnalytics,
  type WebhookAnalyticsMetric,
  type WebhookAnalyticsMetricIcon,
} from './webhook-analytics-utils';

const WEBHOOK_ANALYTICS_METRIC_ICONS: Record<WebhookAnalyticsMetricIcon, {
  Icon: typeof Activity;
  className: string;
}> = {
  avgResponse: {
    Icon: Clock,
    className: 'text-orange-500',
  },
  successRate: {
    Icon: CheckCircle,
    className: 'text-green-500',
  },
  totalDeliveries: {
    Icon: Send,
    className: 'text-green-500',
  },
  totalWebhooks: {
    Icon: Zap,
    className: 'text-blue-500',
  },
};

export function WebhookAnalyticsLoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading analytics...</p>
    </div>
  );
}

export function WebhookAnalyticsEmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No analytics data available</p>
    </div>
  );
}

export function WebhookAnalyticsContent({
  analytics,
  onViewLogs,
}: {
  analytics: WebhookAnalytics;
  onViewLogs: (webhookId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <WebhookAnalyticsMetricsGrid analytics={analytics} />
      <WebhookRecentActivityCard analytics={analytics} />
      <WebhookTopFailingCard analytics={analytics} onViewLogs={onViewLogs} />
    </div>
  );
}

function WebhookAnalyticsMetricsGrid({ analytics }: { analytics: WebhookAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {buildWebhookAnalyticsMetrics(analytics).map((metric) => (
        <WebhookAnalyticsMetricCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}

function WebhookAnalyticsMetricCard({ metric }: { metric: WebhookAnalyticsMetric }) {
  const { Icon, className } = WEBHOOK_ANALYTICS_METRIC_ICONS[metric.icon];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${className}`} />
          <span className="text-sm text-muted-foreground">{metric.label}</span>
        </div>
        <p className="text-2xl font-bold">{metric.value}</p>
        <p className="text-xs text-muted-foreground">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}

function WebhookRecentActivityCard({ analytics }: { analytics: WebhookAnalytics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest webhook delivery attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={item.success ? 'default' : 'destructive'} className="text-xs">
                    {item.success ? 'Success' : 'Failed'}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">{item.webhook?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{item.event_type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString()}</div>
                  {item.response_status && (
                    <div className="text-xs font-mono">{item.response_status}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">No recent activity</div>
        )}
      </CardContent>
    </Card>
  );
}

function WebhookTopFailingCard({
  analytics,
  onViewLogs,
}: {
  analytics: WebhookAnalytics;
  onViewLogs: (webhookId: string) => void;
}) {
  if (analytics.topFailingWebhooks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Failing Webhooks</CardTitle>
        <CardDescription>Most failures in the last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.topFailingWebhooks.map((webhook) => (
            <div key={webhook.webhook_id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-sm font-medium">{webhook.name}</div>
                  <div className="text-xs text-muted-foreground">{webhook.failure_count} failures</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onViewLogs(webhook.webhook_id)}>
                View Logs
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
