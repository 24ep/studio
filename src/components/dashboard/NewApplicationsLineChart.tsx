"use client";

import type { Chart as ChartJS } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Loader2, TrendingUp, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { buildNewApplicationsChartData } from './new-applications-time-series-utils';
import { buildNewApplicationsLineChartOptions } from './new-applications-line-chart-options';

type NewApplicationsChartData = ReturnType<typeof buildNewApplicationsChartData>;

interface NewApplicationsLineChartProps {
  chartData: NewApplicationsChartData;
  chartReady: boolean;
  chartError: string | null;
  isLoading: boolean;
  dynamicHeight?: number;
  onChartReady: (chart: ChartJS<'line', number[], string> | null | undefined) => void;
}

export function NewApplicationsLineChart({
  chartData,
  chartReady,
  chartError,
  isLoading,
  dynamicHeight,
  onChartReady,
}: NewApplicationsLineChartProps) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: dynamicHeight && dynamicHeight > 0 ? `${dynamicHeight}px` : '256px',
        minHeight: '256px',
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : chartData.labels.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No application data available</p>
        </div>
      ) : chartError ? (
        <div className="flex items-center justify-center">
          <div className="text-center space-y-3">
            <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-red-500 text-sm">Chart error: {chartError}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      ) : !chartReady ? (
        <div className="flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      ) : (
        <Line
          data={chartData}
          ref={onChartReady}
          options={buildNewApplicationsLineChartOptions(chartData)}
        />
      )}
    </div>
  );
}
