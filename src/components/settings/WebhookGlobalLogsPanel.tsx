import { History } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  WebhookGlobalLogsPagination,
  WebhookGlobalLogsTable,
  WebhookGlobalLogsToolbar,
  type GlobalWebhookLog,
  type LogsFilter,
} from './WebhookGlobalLogsPanelParts';

interface WebhookGlobalLogsPanelProps {
  logs: GlobalWebhookLog[];
  isLoading: boolean;
  filter: LogsFilter;
  search: string;
  page: number;
  total: number;
  onFilterChange: (filter: LogsFilter) => void;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
}

export function WebhookGlobalLogsPanel({
  logs,
  isLoading,
  filter,
  search,
  page,
  total,
  onFilterChange,
  onSearchChange,
  onPageChange,
}: WebhookGlobalLogsPanelProps) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Webhook Logs
            </CardTitle>
            <CardDescription>
              View recent webhook delivery attempts and responses across all webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookGlobalLogsToolbar
              filter={filter}
              search={search}
              onFilterChange={onFilterChange}
              onSearchChange={onSearchChange}
            />
            <WebhookGlobalLogsTable isLoading={isLoading} logs={logs} />
            <WebhookGlobalLogsPagination
              page={page}
              total={total}
              onPageChange={onPageChange}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
