"use client";

import {
  ExclamationTriangleIcon as AlertTriangle,
} from '@heroicons/react/24/outline';

export { ErrorAnalysisSummaryCards } from './ProcessQueueErrorAnalysisSummaryCards';
export { ErrorAnalysisTable } from './ProcessQueueErrorAnalysisTable';

export function ErrorAnalysisEmptyState() {
  return (
    <div className="py-12 text-center">
      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">No errors found in the data</p>
    </div>
  );
}
