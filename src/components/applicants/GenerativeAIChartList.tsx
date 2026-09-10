"use client";

import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { CanvasChartData } from './GenerativeAICanvasTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface GenerativeAIChartListProps {
  chartSetupReady: boolean;
  charts: CanvasChartData[];
  onRemoveChart: (chartId: string) => void;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
};

export function GenerativeAIChartList({
  chartSetupReady,
  charts,
  onRemoveChart,
}: GenerativeAIChartListProps) {
  if (charts.length === 0) return null;

  return (
    <div className="space-y-4">
      {charts.map((chart) => (
        <Card key={chart.id}>
          <CardHeader>
            <CardTitle className="text-base">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerativeAIChart
              chart={chart}
              chartSetupReady={chartSetupReady}
              onRemoveChart={onRemoveChart}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GenerativeAIChart({
  chart,
  chartSetupReady,
  onRemoveChart,
}: {
  chart: CanvasChartData;
  chartSetupReady: boolean;
  onRemoveChart: (chartId: string) => void;
}) {
  if (!chartSetupReady) {
    return <div className="text-sm text-muted-foreground">Loading chart...</div>;
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-6 w-6"
          onClick={() => onRemoveChart(chart.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="h-64">
        {chart.type === 'bar' && <Bar data={chart.data} options={chartOptions} />}
        {chart.type === 'line' && <Line data={chart.data} options={chartOptions} />}
        {chart.type === 'pie' && <Pie data={chart.data} options={chartOptions} />}
        {chart.type === 'doughnut' && <Doughnut data={chart.data} options={chartOptions} />}
      </div>
    </div>
  );
}
