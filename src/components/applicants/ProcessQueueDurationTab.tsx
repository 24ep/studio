"use client";

import { ArrowPathIcon as Loader2, ExclamationTriangleIcon as AlertTriangle, CircleStackIcon as Database } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

interface ProcessQueueDurationTabProps {
  data: ProcessQueueAnalyticsData;
  chartLoading: boolean;
  chartError: string | null;
  chartReady: boolean;
}

function DurationLoadingState({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className={`flex h-96 items-center justify-center ${tone === 'danger' ? 'text-red-600' : ''}`}>
      <div className="space-y-3 text-center">{children}</div>
    </div>
  );
}

export function ProcessQueueDurationTab({
  data,
  chartLoading,
  chartError,
  chartReady,
}: ProcessQueueDurationTabProps) {
  return (
    <section className="space-y-4 border-y border-border/70 py-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Jobs and Duration Analysis by Type</h3>
        <p className="text-sm text-muted-foreground">Combined view showing job count and average processing duration for each job type</p>
      </div>
      {chartLoading ? (
        <DurationLoadingState>
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading chart...</p>
        </DurationLoadingState>
      ) : chartError ? (
        <DurationLoadingState tone="danger">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p>Chart error: {chartError}</p>
        </DurationLoadingState>
      ) : !chartReady ? (
        <DurationLoadingState>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-muted-foreground">Initializing chart...</p>
        </DurationLoadingState>
      ) : data.stats.jobsByType.length === 0 ? (
        <DurationLoadingState>
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for duration analysis</p>
        </DurationLoadingState>
      ) : (
        <div className="overflow-hidden border-y border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Type</TableHead>
                <TableHead className="text-center">Count</TableHead>
                <TableHead className="text-center">Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stats.jobsByType.map((item) => {
                const durationData = data.stats.avgDurationByType.find(duration => duration.type === item.type);
                const avgDuration = durationData ? durationData.avgDuration : 0;

                return (
                  <TableRow key={item.type} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{item.count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{avgDuration.toFixed(1)}m</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
