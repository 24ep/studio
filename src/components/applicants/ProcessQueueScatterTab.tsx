"use client";

import {
  ArrowPathIcon as Loader2,
  CircleStackIcon as Database,
  ExclamationTriangleIcon as AlertTriangle,
} from '@heroicons/react/24/outline';
import type { ActiveElement, ChartEvent } from 'chart.js';

import {
  ChartState,
  ProcessQueueScatterChart,
} from './ProcessQueueScatterChartParts';
import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

interface ProcessQueueScatterTabProps {
  data: ProcessQueueAnalyticsData;
  chartLoading: boolean;
  chartError: string | null;
  chartReady: boolean;
  onPointClick: (event: ChartEvent, elements: ActiveElement[]) => void;
}

export function ProcessQueueScatterTab({
  data,
  chartLoading,
  chartError,
  chartReady,
  onPointClick,
}: ProcessQueueScatterTabProps) {
  return (
    <section className="space-y-4 border-y border-border/70 py-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Process Time vs Duration</h3>
        <p className="text-sm text-muted-foreground">
          Scatter plot showing the relationship between process date/time and processing duration. Each point represents a job, with x-axis showing when processing started and y-axis showing how long it took to complete.
        </p>
      </div>
      {chartLoading ? (
        <ChartState>
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading chart...</p>
        </ChartState>
      ) : chartError ? (
        <ChartState tone="danger">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p>Chart error: {chartError}</p>
        </ChartState>
      ) : !chartReady ? (
        <ChartState>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-muted-foreground">Initializing chart...</p>
        </ChartState>
      ) : data.scatterData.length === 0 ? (
        <ChartState>
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for scatter plot</p>
        </ChartState>
      ) : (
        <ProcessQueueScatterChart data={data} onPointClick={onPointClick} />
      )}
    </section>
  );
}
