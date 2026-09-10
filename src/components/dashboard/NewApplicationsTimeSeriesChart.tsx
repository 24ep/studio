"use client";

import { useMemo, useRef, useState } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import type { DateRange } from 'react-day-picker';
import { TrendingUp } from "lucide-react";
import type { Applicant } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartSetup } from '@/hooks/use-chart-setup';
import { NewApplicationsLineChart } from './NewApplicationsLineChart';
import { NewApplicationsTimeSeriesControls } from './NewApplicationsTimeSeriesControls';
import {
  buildNewApplicationsChartData,
  createDefaultNewApplicationsDateRange,
  getNewApplicationsPeriodConfig,
  type NewApplicationsPeriodType,
  type NewApplicationsPeriodUnit,
} from './new-applications-time-series-utils';

interface NewApplicationsTimeSeriesChartProps {
  applicants: Applicant[];
  initialData?: { date: string; count: number }[];
  isLoading?: boolean;
  dynamicHeight?: number;
}

export function NewApplicationsTimeSeriesChart({
  applicants,
  initialData,
  isLoading = false,
  dynamicHeight,
}: NewApplicationsTimeSeriesChartProps) {
  const { chartReady, error: chartError } = useChartSetup();
  const chartRef = useRef<ChartJS<'line', number[], string> | null>(null);
  const [periodType, setPeriodType] = useState<NewApplicationsPeriodType>('lastN');
  const [periodUnit, setPeriodUnit] = useState<NewApplicationsPeriodUnit>('day');
  const [periodN, setPeriodN] = useState<number>(7);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => createDefaultNewApplicationsDateRange());

  const periodConfig = useMemo(() => getNewApplicationsPeriodConfig({
    periodType,
    periodUnit,
    periodN,
    dateRange,
  }), [periodType, periodUnit, periodN, dateRange]);

  const chartData = useMemo(() => {
    return buildNewApplicationsChartData({
      applicants,
      initialData,
      periodType,
      periodUnit,
      periodN,
      dateRange,
      periodConfig,
    });
  }, [applicants, initialData, dateRange, periodType, periodUnit, periodN, periodConfig]);

  const onChartReady = (chart: ChartJS<'line', number[], string> | null | undefined) => {
    if (chart) {
      chartRef.current = chart;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 md:z-auto z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              New Applications Over Time
            </CardTitle>
            <CardDescription className="text-muted-foreground/70 text-xs">
              Track application trends and patterns
            </CardDescription>
          </div>
          <NewApplicationsTimeSeriesControls
            periodType={periodType}
            periodUnit={periodUnit}
            periodN={periodN}
            dateRange={dateRange}
            onPeriodTypeChange={setPeriodType}
            onPeriodUnitChange={setPeriodUnit}
            onPeriodNChange={setPeriodN}
            onDateRangeChange={setDateRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <NewApplicationsLineChart
          chartData={chartData}
          chartReady={chartReady}
          chartError={chartError}
          isLoading={isLoading}
          dynamicHeight={dynamicHeight}
          onChartReady={onChartReady}
        />
      </CardContent>
    </Card>
  );
}
