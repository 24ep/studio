'use client';

import { ChevronLeft, ChevronRight, Eye, RefreshCw, RotateCcw } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  WebhookLog,
  WebhookLogsPagination,
} from './webhook-delivery-logs-types';
import {
  formatWebhookLogDate,
  formatWebhookLogDuration,
  getWebhookLogStatusColor,
  getWebhookLogStatusText,
} from './webhook-delivery-logs-utils';
import { WebhookLogDetailsDialogContent } from './WebhookLogDetailsDialog';

interface WebhookLogsTableProps {
  logs: WebhookLog[];
  loading: boolean;
  error: string | null;
  pagination: WebhookLogsPagination;
  onPageChange: (newPage: number) => void;
  onReplay: (logId: string) => Promise<void>;
  replayingLogId: string | null;
}

export function WebhookLogsTable({
  logs,
  loading,
  error,
  pagination,
  onPageChange,
  onReplay,
  replayingLogId,
}: WebhookLogsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
        Loading logs...
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No logs found for the selected filters.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => {
            const isReplaying = replayingLogId === log.id;

            return (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {log.event_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${getWebhookLogStatusColor(log.success, log.response_status)}`}>
                    {getWebhookLogStatusText(log.success, log.response_status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatWebhookLogDuration(log.duration_ms)}
                </TableCell>
                <TableCell>
                  {log.response_status ? (
                    <span className="font-mono text-sm">{log.response_status}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatWebhookLogDate(log.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    {!log.success && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={Boolean(replayingLogId)}
                            aria-label={`Replay ${log.event_type} delivery`}
                            title="Replay failed delivery"
                          >
                            <RotateCcw className={`h-4 w-4 ${isReplaying ? 'animate-spin' : ''}`} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Replay failed delivery?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This sends the original event to the configured endpoint again. If the downstream system processed the first request before returning an error, replaying may create a duplicate action.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void onReplay(log.id)}>
                              Replay delivery
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label={`View ${log.event_type} delivery details`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <WebhookLogDetailsDialogContent log={log} />
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <WebhookLogsPaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </>
  );
}

function WebhookLogsPaginationControls({
  pagination,
  onPageChange,
}: Pick<WebhookLogsTableProps, 'pagination' | 'onPageChange'>) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
