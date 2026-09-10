"use client";

import {
  ArrowTrendingUpIcon as TrendingUp,
  DocumentTextIcon as FileText,
  ExclamationTriangleIcon as AlertTriangle,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';
import { buildProcessQueueErrorAnalysisSummary } from './process-queue-error-analysis-utils';

interface ErrorAnalysisSummaryCardsProps {
  errorsByReason: ProcessQueueAnalyticsData['stats']['errorsByReason'];
  totalJobs: number;
}

export function ErrorAnalysisSummaryCards({ errorsByReason, totalJobs }: ErrorAnalysisSummaryCardsProps) {
  const summary = buildProcessQueueErrorAnalysisSummary(errorsByReason, totalJobs);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <ErrorAnalysisStatCard
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        label="Total Errors"
        value={summary.totalErrors}
        labelClassName="text-red-700 dark:text-red-300"
        valueClassName="text-red-600 dark:text-red-400"
      />
      <ErrorAnalysisStatCard
        icon={<FileText className="h-5 w-5 text-orange-600" />}
        label="Error Types"
        value={summary.errorTypes}
        labelClassName="text-orange-700 dark:text-orange-300"
        valueClassName="text-orange-600 dark:text-orange-400"
      />
      <ErrorAnalysisStatCard
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        label="Error Rate"
        value={summary.errorRate}
        labelClassName="text-primary"
        valueClassName="text-primary"
      />
    </div>
  );
}

function ErrorAnalysisStatCard({
  icon,
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  labelClassName: string;
  valueClassName: string;
}) {
  return (
    <div className="border-y border-border/70 py-4 md:border-x-0 md:border-y md:px-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className={cn('font-semibold', labelClassName)}>{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', valueClassName)}>{value}</p>
    </div>
  );
}
