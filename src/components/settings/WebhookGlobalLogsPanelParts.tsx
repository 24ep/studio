import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type LogsFilter = 'all' | 'success' | 'failed';

export interface GlobalWebhookLog {
  id: string;
  webhook_name?: string;
  webhook_url?: string;
  event_type: string;
  success: boolean;
  response_status?: string | number | null;
  response_message?: string | null;
  duration_ms?: string | number | null;
  created_at?: string;
  createdAt?: string;
}

interface WebhookGlobalLogsToolbarProps {
  filter: LogsFilter;
  search: string;
  onFilterChange: (filter: LogsFilter) => void;
  onSearchChange: (search: string) => void;
}

interface WebhookGlobalLogsTableProps {
  isLoading: boolean;
  logs: GlobalWebhookLog[];
}

interface WebhookGlobalLogsPaginationProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function WebhookGlobalLogsToolbar({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: WebhookGlobalLogsToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(value) => onFilterChange(value as LogsFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Logs</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>
    </div>
  );
}

export function WebhookGlobalLogsTable({
  isLoading,
  logs,
}: WebhookGlobalLogsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Webhook</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <WebhookGlobalLogsLoadingRow />
          ) : logs.length === 0 ? (
            <WebhookGlobalLogsEmptyRow />
          ) : (
            logs.map((log) => <WebhookGlobalLogRow key={log.id} log={log} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function WebhookGlobalLogsPagination({
  page,
  total,
  onPageChange,
}: WebhookGlobalLogsPaginationProps) {
  if (total <= 20) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} logs
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= Math.ceil(total / 20)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function WebhookGlobalLogRow({ log }: { log: GlobalWebhookLog }) {
  return (
    <TableRow>
      <TableCell>
        <div className="text-sm font-medium">{log.webhook_name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[240px]">{log.webhook_url}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{log.event_type}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={log.success ? 'default' : 'destructive'}>{log.success ? 'Success' : 'Failed'}</Badge>
      </TableCell>
      <TableCell>
        <div className="text-xs">
          {log.response_status && <span className="font-mono mr-2">{log.response_status}</span>}
          {log.response_message && <span className="text-muted-foreground truncate inline-block max-w-[200px] align-bottom">{log.response_message}</span>}
        </div>
      </TableCell>
      <TableCell className="text-sm">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</TableCell>
      <TableCell className="text-sm">{new Date(log.created_at || log.createdAt || '').toLocaleString()}</TableCell>
    </TableRow>
  );
}

function WebhookGlobalLogsLoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          <span className="text-muted-foreground">Loading logs...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function WebhookGlobalLogsEmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
        No webhook logs found
      </TableCell>
    </TableRow>
  );
}
