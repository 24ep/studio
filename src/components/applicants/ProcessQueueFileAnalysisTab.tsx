"use client";

import { DocumentTextIcon as FileText } from '@heroicons/react/24/outline';
import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

interface ProcessQueueFileAnalysisTabProps {
  fileSizeRanges: ProcessQueueAnalyticsData['stats']['fileSizeRanges'];
}

export function ProcessQueueFileAnalysisTab({ fileSizeRanges }: ProcessQueueFileAnalysisTabProps) {
  return (
    <section className="space-y-4 border-y border-border/70 py-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">File Size Analysis</h3>
        <p className="text-sm text-muted-foreground">Performance metrics by file size range</p>
      </div>
      <div className="divide-y divide-border/70 border-y border-border/70">
        {fileSizeRanges.map((item) => (
          <div key={item.range} className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{item.range}</p>
                <p className="text-sm text-muted-foreground">
                  {item.count} files
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{item.avgDuration.toFixed(1)}m avg</p>
              <p className="text-sm text-muted-foreground">duration</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
