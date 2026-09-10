"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowDownTrayIcon as Download,
  DocumentTextIcon as FileText,
} from '@heroicons/react/24/outline';

import {
  getProcessQueueErrorCategory,
  getProcessQueueErrorSeverity,
  type ProcessQueueAnalyticsData,
} from './process-queue-analytics-utils';
import { formatProcessQueueErrorReasonPreview } from './process-queue-error-analysis-utils';

type ErrorReasonItem = ProcessQueueAnalyticsData['stats']['errorsByReason'][number];

interface ErrorAnalysisTableProps {
  errorsByReason: ProcessQueueAnalyticsData['stats']['errorsByReason'];
  totalJobs: number;
  onExportSingle: (reason: string) => void;
  onViewDetails: (reason: string) => void;
}

export function ErrorAnalysisTable({
  errorsByReason,
  totalJobs,
  onExportSingle,
  onViewDetails,
}: ErrorAnalysisTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Error Reason</TableHead>
            <TableHead className="text-center">Count</TableHead>
            <TableHead className="text-center">Percentage</TableHead>
            <TableHead className="text-center">Severity</TableHead>
            <TableHead className="text-center">Category</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errorsByReason.map((item, index) => (
            <ErrorAnalysisTableRow
              key={item.reason}
              item={item}
              index={index}
              totalJobs={totalJobs}
              onExportSingle={onExportSingle}
              onViewDetails={onViewDetails}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ErrorAnalysisTableRow({
  item,
  index,
  totalJobs,
  onExportSingle,
  onViewDetails,
}: {
  item: ErrorReasonItem;
  index: number;
  totalJobs: number;
  onExportSingle: (reason: string) => void;
  onViewDetails: (reason: string) => void;
}) {
  const percentage = totalJobs > 0 ? ((item.count / totalJobs) * 100).toFixed(1) : '0.0';
  const severity = getProcessQueueErrorSeverity(item.count, totalJobs);
  const category = getProcessQueueErrorCategory(item.reason);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{index + 1}</TableCell>
      <TableCell>
        <div className="max-w-md">
          <p className="truncate font-medium" title={item.reason}>
            {item.reason}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatProcessQueueErrorReasonPreview(item.reason)}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="destructive" className="text-sm">
          {item.count}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium">{percentage}%</span>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {severity}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="text-xs">
          {category}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(item.reason)}
            className="h-8 w-8 p-0"
            title="View Details"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExportSingle(item.reason)}
            className="h-8 w-8 p-0"
            title="Export This Error"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
