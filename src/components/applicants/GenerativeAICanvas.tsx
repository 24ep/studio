"use client";

import { useEffect, useState } from 'react';
import { ChartBarIcon as BarChart3, PencilIcon as Type } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';
import { useChartSetup } from '@/hooks/use-chart-setup';
import { cn } from '@/lib/utils';

import { GenerativeAIChartDialog } from './GenerativeAIChartDialog';
import { GenerativeAIChartList } from './GenerativeAIChartList';
import type {
  CanvasChartData,
  CanvasChartType,
  GenerativeAICanvasProps,
} from './GenerativeAICanvasTypes';
import {
  createChartId,
  createDefaultChartData,
  parseChartsFromContent,
  updateContentWithCharts,
} from './generative-ai-canvas-utils';

export function GenerativeAICanvas({
  value,
  onChange,
  placeholder = 'Start writing or add charts...',
  className,
}: GenerativeAICanvasProps) {
  const [charts, setCharts] = useState<CanvasChartData[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [newChartType, setNewChartType] = useState<CanvasChartType>('bar');
  const [newChartTitle, setNewChartTitle] = useState('');
  const chartSetup = useChartSetup();

  useEffect(() => {
    try {
      setCharts(parseChartsFromContent(value));
    } catch (error) {
      console.error('Error parsing charts from content:', error);
    }
  }, [value]);

  const saveCharts = (updatedCharts: CanvasChartData[]) => {
    setCharts(updatedCharts);
    onChange(updateContentWithCharts(updatedCharts, value));
  };

  const handleAddChart = () => {
    if (!newChartTitle.trim()) return;

    saveCharts([
      ...charts,
      {
        id: createChartId(),
        type: newChartType,
        title: newChartTitle,
        data: createDefaultChartData(newChartType),
      },
    ]);

    setShowChartDialog(false);
    setNewChartTitle('');
    setNewChartType('bar');
  };

  const handleRemoveChart = (chartId: string) => {
    saveCharts(charts.filter((chart) => chart.id !== chartId));
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Canvas Mode</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChartDialog(true)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Add Chart
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="border rounded-lg">
          <TiptapEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="min-h-[200px]"
            readOnly={false}
          />
        </div>

        <GenerativeAIChartList
          chartSetupReady={chartSetup.chartReady}
          charts={charts}
          onRemoveChart={handleRemoveChart}
        />
      </div>

      <GenerativeAIChartDialog
        chartTitle={newChartTitle}
        chartType={newChartType}
        open={showChartDialog}
        onAddChart={handleAddChart}
        onChartTitleChange={setNewChartTitle}
        onChartTypeChange={setNewChartType}
        onOpenChange={setShowChartDialog}
      />
    </div>
  );
}
