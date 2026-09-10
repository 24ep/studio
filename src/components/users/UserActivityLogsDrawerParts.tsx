"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { LogEntry, UserProfile } from '@/lib/types';
import { Calendar, ListOrdered, Server } from 'lucide-react';
import {
  canGoToNextActivityPage,
  getLogLevelBadgeVariant,
  getUserActivityLogTimestamp,
  hasUserActivityLogDetails,
} from './user-activity-logs-utils';

interface UserActivityLogsHeaderProps {
  user: UserProfile | null;
}

export function UserActivityLogsHeader({
  user,
}: UserActivityLogsHeaderProps) {
  return (
    <SheetHeader className="p-6 border-b">
      <div className="flex items-center justify-between">
        <div>
          <SheetTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Activity Logs
          </SheetTitle>
          <SheetDescription className="mt-1">
            {user ? `Activity logs for ${user.name}` : 'Loading...'}
          </SheetDescription>
        </div>
      </div>
    </SheetHeader>
  );
}

interface UserActivityLogsBodyProps {
  logs: LogEntry[];
  isLoading: boolean;
}

export function UserActivityLogsBody({ logs, isLoading }: UserActivityLogsBodyProps) {
  if (isLoading && logs.length === 0) {
    return <UserActivityLogsSkeleton />;
  }

  if (logs.length === 0) {
    return <UserActivityLogsEmptyState />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        {logs.map((log) => (
          <UserActivityLogItem key={log.id} log={log} />
        ))}
      </div>
    </ScrollArea>
  );
}

function UserActivityLogsSkeleton() {
  return (
    <div className="space-y-4 px-6 py-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-5 w-[60px]" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UserActivityLogsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <ListOrdered className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No activity logs found for this user.</p>
    </div>
  );
}

function UserActivityLogItem({ log }: { log: LogEntry }) {
  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={getLogLevelBadgeVariant(log.level)}>
            {log.level}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{getUserActivityLogTimestamp(log)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{log.message}</p>
        {log.source && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Server className="h-3 w-3" />
            <span>{log.source}</span>
          </div>
        )}
        {hasUserActivityLogDetails(log.details) && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value={`details-${log.id}`} className="border-none">
              <AccordionTrigger className="text-xs py-2 hover:no-underline">
                <span className="text-muted-foreground">View JSON Details</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}

interface UserActivityLogsPaginationProps {
  currentPage: number;
  totalLogs: number;
  totalPages: number;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function UserActivityLogsPagination({
  currentPage,
  totalLogs,
  totalPages,
  isLoading,
  onPreviousPage,
  onNextPage,
}: UserActivityLogsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="p-4 border-t flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} ({totalLogs} total logs)
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={currentPage === 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoToNextActivityPage(currentPage, totalLogs) || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
