"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';
import {
  getDefaultProcessQueueDateRange,
  getPresetProcessQueueDateRange,
  type ProcessQueueDatePreset,
} from './process-queue-analytics-date-utils';
import {
  type ProcessQueueAnalyticsData,
} from './process-queue-analytics-utils';
import { fetchProcessQueueAnalyticsData } from './process-queue-analytics-api';
import {
  downloadProcessQueueErrorAnalysis,
  downloadSingleProcessQueueErrorAnalysis,
} from './process-queue-error-downloads';
import type { ActiveElement, ChartEvent } from 'chart.js';

export function useProcessQueueAnalytics() {
  const [data, setData] = useState<ProcessQueueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultProcessQueueDateRange);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<ProcessQueueAnalyticsData['scatterData'][0] | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const { isConnected: realtimeConnected } = useEnhancedSSE();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await fetchProcessQueueAnalyticsData({ dateRange, statusFilter }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    if (realtimeConnected) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, realtimeConnected]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const setDatePreset = useCallback((preset: ProcessQueueDatePreset) => {
    setDateRange(getPresetProcessQueueDateRange(preset));
  }, []);

  const handlePointClick = useCallback((_event: ChartEvent, elements: ActiveElement[]) => {
    const dataIndex = elements[0]?.index;
    if (typeof dataIndex === 'undefined') return;

    const clickedJob = data?.scatterData[dataIndex];
    if (clickedJob) {
      setSelectedJob(clickedJob);
      setIsJobDetailsOpen(true);
    }
  }, [data]);

  const handleExportErrors = useCallback(async () => {
    if (!data) return;

    await downloadProcessQueueErrorAnalysis({ data, dateRange, statusFilter });
  }, [data, dateRange, statusFilter]);

  const handleViewErrorDetails = useCallback((reason: string) => {
    const errorItem = data?.stats.errorsByReason.find(item => item.reason === reason);
    if (!errorItem) return;

    setSelectedJob({
      x: '',
      y: 0,
      status: 'Error',
      fileName: '',
      fileSize: 0,
      uploadDate: '',
      processDate: null,
      completedDate: null,
      error: errorItem.reason,
      errorDetails: '',
      positionTitle: null,
      source: null,
      source_logo: null,
      id: '',
    });
    setIsJobDetailsOpen(true);
  }, [data]);

  const handleExportSingleError = useCallback(async (reason: string) => {
    if (!data) return;

    await downloadSingleProcessQueueErrorAnalysis({ data, dateRange, statusFilter, reason });
  }, [data, dateRange, statusFilter]);

  return {
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
  };
}
