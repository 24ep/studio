"use client";

import type { ReactNode } from 'react';
import type { ActiveElement, ChartEvent, TooltipItem } from 'chart.js';
import { Scatter } from 'react-chartjs-2';

import { isDataLabelsAvailable } from '@/lib/chartjs-setup';

import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';
import { buildProcessQueueScatterDataset } from './process-queue-scatter-utils';

interface ProcessQueueScatterChartProps {
  data: ProcessQueueAnalyticsData;
  onPointClick: (event: ChartEvent, elements: ActiveElement[]) => void;
}

export function ChartState({
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

export function ProcessQueueScatterChart({ data, onPointClick }: ProcessQueueScatterChartProps) {
  return (
    <div className="h-96">
      <Scatter
        data={buildProcessQueueScatterDataset(data)}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          onClick: onPointClick,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title(context: Array<TooltipItem<'scatter'>>) {
                  if (!context || !context[0] || typeof context[0].dataIndex === 'undefined') {
                    return '';
                  }
                  const item = data.scatterData[context[0].dataIndex];
                  if (!item) return '';
                  const date = new Date(item.x);
                  return `Date & Time: ${date.toLocaleString()}`;
                },
                label(context: TooltipItem<'scatter'>) {
                  if (!context || typeof context.dataIndex === 'undefined') {
                    return '';
                  }
                  const item = data.scatterData[context.dataIndex];
                  if (!item) return '';
                  return [
                    `Duration: ${Number(context.parsed.y).toFixed(2)} minutes`,
                    `Status: ${item.status}`,
                    `File: ${item.fileName}`,
                  ];
                },
              },
            },
            ...(isDataLabelsAvailable() ? {
              datalabels: {
                display: false,
              },
            } : {}),
          },
          scales: {
            x: {
              type: 'time',
              time: {
                displayFormats: {
                  millisecond: 'HH:mm:ss.SSS',
                  second: 'HH:mm:ss',
                  minute: 'MMM dd, HH:mm',
                  hour: 'MMM dd, HH:mm',
                  day: 'MMM dd, yyyy',
                  week: 'MMM dd, yyyy',
                  month: 'MMM yyyy',
                  quarter: 'MMM yyyy',
                  year: 'yyyy',
                },
                tooltipFormat: 'MMM dd, yyyy HH:mm',
              },
              title: {
                display: true,
                text: 'Process Date & Time',
              },
              grid: { color: 'rgba(100,116,139,0.1)' },
              ticks: {
                color: 'rgb(100, 116, 139)',
                font: { size: 12 },
                maxRotation: 45,
              },
            },
            y: {
              title: {
                display: true,
                text: 'Duration (minutes)',
              },
              beginAtZero: true,
              grid: { color: 'rgba(100,116,139,0.1)' },
              ticks: {
                color: 'rgb(100, 116, 139)',
                font: { size: 12 },
                callback(value) {
                  return Number(value).toFixed(2);
                },
              },
            },
          },
        }}
      />

      <ProcessQueueScatterLegend />
    </div>
  );
}

function ProcessQueueScatterLegend() {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4">
      <ScatterLegendItem colorClassName="bg-green-500" label="Success" />
      <ScatterLegendItem colorClassName="bg-red-500" label="Failed/Error" />
      <ScatterLegendItem colorClassName="bg-yellow-500" label="In Process" />
      <ScatterLegendItem colorClassName="bg-primary" label="Queued" />
    </div>
  );
}

function ScatterLegendItem({
  colorClassName,
  label,
}: {
  colorClassName: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${colorClassName}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
