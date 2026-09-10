import { Activity, CheckCircle, Database, Zap } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Webhook } from './webhook-management-data';
import { getWebhookOverviewStats } from './webhook-management-utils';

interface WebhookOverviewPanelProps {
  webhooks: Webhook[];
  analytics: { successRate?: number | null } | null;
  isLoadingAnalytics: boolean;
}

export function WebhookOverviewPanel({
  webhooks,
  analytics,
  isLoadingAnalytics,
}: WebhookOverviewPanelProps) {
  const stats = getWebhookOverviewStats(webhooks, analytics?.successRate, isLoadingAnalytics);

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
                  <p className="text-2xl font-bold">{stats.totalWebhooks}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Webhooks</p>
                  <p className="text-2xl font-bold">{stats.activeWebhooks}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRateLabel}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
