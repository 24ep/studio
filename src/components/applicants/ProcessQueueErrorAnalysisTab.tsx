"use client";

import { Button } from '@/components/ui/button';
import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/outline';

import {
  ErrorAnalysisEmptyState,
  ErrorAnalysisSummaryCards,
  ErrorAnalysisTable,
} from './ProcessQueueErrorAnalysisParts';
import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

interface ProcessQueueErrorAnalysisTabProps {
  errorsByReason: ProcessQueueAnalyticsData['stats']['errorsByReason'];
  totalJobs: number;
  onExportAll: () => void;
  onExportSingle: (reason: string) => void;
  onViewDetails: (reason: string) => void;
}

export function ProcessQueueErrorAnalysisTab({
  errorsByReason,
  totalJobs,
  onExportAll,
  onExportSingle,
  onViewDetails,
}: ProcessQueueErrorAnalysisTabProps) {
  const hasErrors = errorsByReason.length > 0;

  return (
    <section className="space-y-4 border-y border-border/70 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Error Analysis</h3>
          <p className="text-sm text-muted-foreground">Breakdown of errors by reason with detailed information</p>
        </div>
        {hasErrors && (
          <Button
            onClick={onExportAll}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </div>
      {hasErrors ? (
        <div className="space-y-4">
          <ErrorAnalysisSummaryCards errorsByReason={errorsByReason} totalJobs={totalJobs} />
          <ErrorAnalysisTable
            errorsByReason={errorsByReason}
            totalJobs={totalJobs}
            onExportSingle={onExportSingle}
            onViewDetails={onViewDetails}
          />
        </div>
      ) : (
        <ErrorAnalysisEmptyState />
      )}
    </section>
  );
}
