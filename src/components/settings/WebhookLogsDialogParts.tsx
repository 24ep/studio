import { Download, History, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type LogsFilter = "all" | "success" | "failed";

export interface WebhookLog {
  id: string;
  createdAt: string;
  event_type: string;
  success: boolean;
  response_status?: string | number | null;
  duration_ms?: string | number | null;
}

interface WebhookLogsToolbarProps {
  filter: LogsFilter;
  search: string;
  onFilterChange: (filter: LogsFilter) => void;
  onSearchChange: (search: string) => void;
  onExport: () => void;
}

export function WebhookLogsToolbar({
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onExport,
}: WebhookLogsToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-64 pl-10"
          />
        </div>
      </div>
      <Button onClick={onExport} variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export Logs
      </Button>
    </div>
  );
}

interface WebhookLogsTableProps {
  isLoading: boolean;
  logs: WebhookLog[];
}

export function WebhookLogsTable({ isLoading, logs }: WebhookLogsTableProps) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <WebhookLogsLoadingRow />
          ) : logs.length === 0 ? (
            <WebhookLogsEmptyRow />
          ) : (
            logs.map((log) => <WebhookLogsDataRow key={log.id} log={log} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function WebhookLogsLoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
          <span>Loading logs...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function WebhookLogsEmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <History className="h-8 w-8 opacity-50" />
          <p>No logs found for this webhook.</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

function WebhookLogsDataRow({ log }: { log: WebhookLog }) {
  return (
    <TableRow>
      <TableCell className="text-xs">
        {new Date(log.createdAt).toLocaleString()}
      </TableCell>
      <TableCell className="text-xs">
        <Badge variant="outline">{log.event_type}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={log.success ? "default" : "destructive"}>
          {log.success ? "Success" : "Failed"}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">
        {log.response_status ? (
          <span className="font-mono">{log.response_status}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {log.duration_ms}ms
      </TableCell>
    </TableRow>
  );
}

interface WebhookLogsPaginationProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function WebhookLogsPagination({
  page,
  total,
  onPageChange,
}: WebhookLogsPaginationProps) {
  if (total <= 0) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} logs
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="text-sm">Page {page}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= Math.ceil(total / 20)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
