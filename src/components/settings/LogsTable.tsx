import React, { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { Eye, Edit } from "lucide-react";
import type { LogEntry, LogLevel } from '@/lib/types';

interface LogsTableProps {
  logs: LogEntry[];
  isLoading: boolean;
  onEdit: (log: LogEntry) => void;
}

const getLogLevelBadgeVariant = (level: LogLevel): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'ERROR': return 'destructive';
    case 'WARN': return 'secondary';
    case 'AUDIT': return 'default';
    case 'INFO': return 'outline';
    case 'DEBUG': return 'outline';
    default: return 'outline';
  }
};

const LogsTable: React.FC<LogsTableProps> = ({ logs, isLoading, onEdit }) => {
  const handleEdit = useCallback((log: LogEntry) => {
    onEdit(log);
  }, [onEdit]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No log entries found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[100px]">Level</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[200px]">Source</TableHead>
            <TableHead className="w-[150px]">User</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm">
                {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </TableCell>
              <TableCell>
                <Badge variant={getLogLevelBadgeVariant(log.level)}>
                  {log.level}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="truncate" title={log.message}>
                  {log.message}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.source || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {log.actingUserName || '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(log)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LogsTable; 