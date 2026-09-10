"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { CanvasChartType } from './GenerativeAICanvasTypes';

interface GenerativeAIChartDialogProps {
  chartTitle: string;
  chartType: CanvasChartType;
  open: boolean;
  onAddChart: () => void;
  onChartTitleChange: (value: string) => void;
  onChartTypeChange: (value: CanvasChartType) => void;
  onOpenChange: (open: boolean) => void;
}

export function GenerativeAIChartDialog({
  chartTitle,
  chartType,
  open,
  onAddChart,
  onChartTitleChange,
  onChartTypeChange,
  onOpenChange,
}: GenerativeAIChartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dialogId="add-chart-dialog">
        <DialogHeader>
          <DialogTitle>Add Chart</DialogTitle>
          <DialogDescription>
            Create a new chart to visualize your data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              type="text"
              value={chartTitle}
              onChange={(event) => onChartTitleChange(event.target.value)}
              placeholder="Enter chart title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select
              value={chartType}
              onValueChange={(value) => onChartTypeChange(value as CanvasChartType)}
            >
              <SelectTrigger id="chart-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="doughnut">Doughnut Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddChart} disabled={!chartTitle.trim()}>
            Add Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
