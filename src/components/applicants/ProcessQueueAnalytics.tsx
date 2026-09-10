"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon as Loader2, ExclamationTriangleIcon as AlertTriangle, CircleStackIcon as Database, XMarkIcon as X } from '@heroicons/react/24/outline';
import { AlertCircle, Clock3, Files, Gauge, Route } from 'lucide-react';
import { useChartSetup } from '@/hooks/use-chart-setup';
import { ProcessQueueAnalyticsFilters } from './ProcessQueueAnalyticsFilters';
import { ProcessQueueErrorAnalysisTab } from './ProcessQueueErrorAnalysisTab';
import { ProcessQueueDurationTab } from './ProcessQueueDurationTab';
import { ProcessQueueFileAnalysisTab } from './ProcessQueueFileAnalysisTab';
import { ProcessQueueJobDetailsDialog } from './ProcessQueueJobDetailsDialog';
import { ProcessQueueOverviewCards } from './ProcessQueueOverviewCards';
import { ProcessQueueScatterTab } from './ProcessQueueScatterTab';
import { ProcessQueueSourceAnalyticsTab } from './ProcessQueueSourceAnalyticsTab';
import { useProcessQueueAnalytics } from './use-process-queue-analytics';

export default function ProcessQueueAnalytics() {
  const [activeView, setActiveView] = React.useState('throughput');
  const {
    data,
    loading,
    error,
    dateRange,
    statusFilter,
    selectedJob,
    isJobDetailsOpen,
    setDateRange,
    setStatusFilter,
    setIsJobDetailsOpen,
    setDatePreset,
    handlePointClick,
    handleExportErrors,
    handleViewErrorDetails,
    handleExportSingleError,
  } = useProcessQueueAnalytics();
  const { chartReady, isLoading: chartLoading, error: chartError } = useChartSetup();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground">No queue data available for analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Processing intelligence</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">How the queue is performing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Spot slowdowns, recurring failures, and sources that need attention.</p>
        </div>
      </div>

      {statusFilter !== 'all' && (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear status
          </Button>
        </div>
      )}
      <ProcessQueueAnalyticsFilters
        dateRange={dateRange}
        statusFilter={statusFilter}
        onDateRangeChange={setDateRange}
        onStatusFilterChange={setStatusFilter}
        onDatePresetChange={setDatePreset}
      />

      <ProcessQueueOverviewCards stats={data!.stats} />

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/30 p-1.5">
          <AnalyticsTab value="throughput" icon={Gauge} label="Throughput" />
          <AnalyticsTab value="duration" icon={Clock3} label="Speed" />
          <AnalyticsTab value="errors" icon={AlertCircle} label="Failures" />
          <AnalyticsTab value="files" icon={Files} label="File impact" />
          <AnalyticsTab value="sources" icon={Route} label="Sources" />
        </TabsList>

        <TabsContent value="throughput" className="mt-5">
          <ProcessQueueScatterTab
            data={data}
            chartLoading={chartLoading}
            chartError={chartError}
            chartReady={chartReady}
            onPointClick={handlePointClick}
          />
        </TabsContent>

        <TabsContent value="duration" className="mt-5">
          <ProcessQueueDurationTab
            data={data}
            chartLoading={chartLoading}
            chartError={chartError}
            chartReady={chartReady}
          />
        </TabsContent>

        <TabsContent value="errors" className="mt-5">
          <ProcessQueueErrorAnalysisTab
            errorsByReason={data!.stats.errorsByReason}
            totalJobs={data!.stats.totalJobs}
            onExportAll={handleExportErrors}
            onExportSingle={handleExportSingleError}
            onViewDetails={handleViewErrorDetails}
          />
        </TabsContent>

        <TabsContent value="files" className="mt-5">
          <ProcessQueueFileAnalysisTab fileSizeRanges={data.stats.fileSizeRanges} />
        </TabsContent>

        <TabsContent value="sources" className="mt-5">
          <ProcessQueueSourceAnalyticsTab sources={data.stats.sourceAnalytics} />
        </TabsContent>
      </Tabs>

      <ProcessQueueJobDetailsDialog
        open={isJobDetailsOpen}
        onOpenChange={setIsJobDetailsOpen}
        job={selectedJob}
      />
    </div>
  );
}

function AnalyticsTab({ value, icon: Icon, label }: { value: string; icon: React.ElementType; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="h-9 shrink-0 gap-2 rounded-lg px-3 text-sm text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    >
      <Icon className="h-4 w-4" />
      {label}
    </TabsTrigger>
  );
}
