import { History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { Webhook } from './webhook-management-data';
import {
  type LogsFilter,
  type WebhookLog,
  WebhookLogsPagination,
  WebhookLogsTable,
  WebhookLogsToolbar,
} from './WebhookLogsDialogParts';

interface WebhookLogsDialogProps {
  webhook: Webhook | null;
  logs: WebhookLog[];
  isLoading: boolean;
  filter: LogsFilter;
  search: string;
  page: number;
  total: number;
  onClose: () => void;
  onFilterChange: (filter: LogsFilter) => void;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onExport: () => void;
}

export function WebhookLogsDialog({
  webhook,
  logs,
  isLoading,
  filter,
  search,
  page,
  total,
  onClose,
  onFilterChange,
  onSearchChange,
  onPageChange,
  onExport,
}: WebhookLogsDialogProps) {
  if (!webhook) {
    return null;
  }

  return (
    <Dialog open={!!webhook} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Webhook Logs - {webhook.name}
          </DialogTitle>
          <DialogDescription>
            View delivery logs and response details for this webhook.
          </DialogDescription>
        </DialogHeader>

        <WebhookLogsToolbar
          filter={filter}
          search={search}
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
          onExport={onExport}
        />
        <WebhookLogsTable isLoading={isLoading} logs={logs} />
        <WebhookLogsPagination
          page={page}
          total={total}
          onPageChange={onPageChange}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
