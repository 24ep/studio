"use client";

import { CircleStackIcon as Database } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

interface ProcessQueueSourceAnalyticsTabProps {
  sources: ProcessQueueAnalyticsData['stats']['sourceAnalytics'];
}

function getRateClass(rate: number, goodThreshold: number, warningThreshold: number, lowerIsBetter = false) {
  if (lowerIsBetter) {
    if (rate <= goodThreshold) return 'text-green-600';
    if (rate <= warningThreshold) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (rate >= goodThreshold) return 'text-green-600';
  if (rate >= warningThreshold) return 'text-yellow-600';
  return 'text-red-600';
}

export function ProcessQueueSourceAnalyticsTab({ sources }: ProcessQueueSourceAnalyticsTabProps) {
  return (
    <section className="space-y-4 border-y border-border/70 py-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Source Analytics Table</h3>
        <p className="text-sm text-muted-foreground">Detailed metrics for each source</p>
      </div>
      {sources.length > 0 ? (
        <div className="overflow-x-auto border-y border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Total Jobs</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Failed Rate</TableHead>
                <TableHead>Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source, index) => (
                <TableRow key={source.sourceId || index}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {source.sourceLogo ? (
                        <img
                          src={source.sourceLogo}
                          alt={source.sourceName}
                          className="h-6 w-6 rounded object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                          <Database className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{source.sourceName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.totalJobs}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getRateClass(source.successRate, 80, 60)}`}>
                        {source.successRate.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({source.successJobs}/{source.totalJobs})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getRateClass(source.failedRate, 10, 20, true)}`}>
                        {source.failedRate.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({source.failedJobs}/{source.totalJobs})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{source.avgDuration.toFixed(1)}m</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center border-y border-border/70 text-muted-foreground">
          <Database className="mr-2 h-6 w-6" />
          No source data available
        </div>
      )}
    </section>
  );
}
