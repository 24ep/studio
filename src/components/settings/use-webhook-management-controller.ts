'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebhookAnalytics } from './use-webhook-analytics';
import { useWebhookClipboard } from './use-webhook-clipboard';
import { useWebhookConfigurationsController } from './use-webhook-configurations-controller';
import { useWebhookForm } from './use-webhook-form';
import { useWebhookGlobalLogs } from './use-webhook-global-logs';
import { useWebhookLogs } from './use-webhook-logs';
import { useWebhookTest } from './use-webhook-test';
import { getFirstActiveWebhook } from './webhook-management-controller-utils';
import type { WebhookManagementTab } from './WebhookNavigationTabs';

export function useWebhookManagementController() {
  const [activeTab, setActiveTab] = useState<WebhookManagementTab>('overview');
  const { error: showError, success: showSuccess } = useToast();

  const webhookConfigurations = useWebhookConfigurationsController({
    onError: showError,
    onSuccess: showSuccess,
  });
  const {
    fetchWebhooks,
    webhooks,
  } = webhookConfigurations;

  const {
    webhookAnalytics,
    analyticsLoading,
    fetchWebhookAnalytics,
  } = useWebhookAnalytics();
  const {
    globalWebhookLogs,
    globalLogsLoading,
    globalLogsFilter,
    globalLogsSearch,
    globalLogsPage,
    globalLogsTotal,
    fetchGlobalWebhookLogs,
    handleGlobalLogsFilterChange,
    handleGlobalLogsSearch,
    handleGlobalLogsPageChange,
  } = useWebhookGlobalLogs({ onError: showError });
  const {
    selectedWebhookForLogs,
    webhookLogs,
    logsLoading,
    logsFilter,
    logsSearch,
    logsPage,
    logsTotal,
    handleLogsDialogOpen,
    handleLogsFilterChange,
    handleLogsSearch,
    handleLogsPageChange,
    exportLogs,
    closeLogsDialog,
  } = useWebhookLogs({ onError: showError });
  const {
    copiedId,
    copyToClipboard,
  } = useWebhookClipboard();
  const {
    selectedWebhookForTest,
    testResult,
    testLoading,
    testWebhook,
    handleTestDialogOpen,
    closeTestDialog,
  } = useWebhookTest({ onError: showError, onSuccess: showSuccess });

  const {
    isDialogOpen,
    editingWebhook,
    formData,
    customHeaders,
    setFormData,
    openCreateDialog,
    handleSubmit,
    handleEdit,
    handleDialogOpen,
    addCustomHeader,
    removeCustomHeader,
    updateCustomHeader,
  } = useWebhookForm({
    onError: showError,
    onSuccess: showSuccess,
    onRefresh: fetchWebhooks,
  });

  const handleQuickTest = () => {
    if (webhooks.length === 0) {
      showError('No webhooks available to test');
      return;
    }

    const activeWebhook = getFirstActiveWebhook(webhooks);
    if (!activeWebhook) {
      showError('No active webhooks to test');
      return;
    }

    handleTestDialogOpen(activeWebhook);
  };

  const handleAnalyticsViewLogs = (webhookId: string) => {
    const found = webhooks.find((webhook) => webhook.id === webhookId);
    if (found) {
      handleLogsDialogOpen(found);
    }
  };

  useEffect(() => {
    try {
      fetchWebhooks();
      fetchWebhookAnalytics();
      fetchGlobalWebhookLogs();
    } catch (err) {
      console.error('Error initializing WebhookManagement:', err);
      showError(err instanceof Error ? err.message : 'Failed to initialize component');
    }
  }, [fetchGlobalWebhookLogs, fetchWebhookAnalytics, fetchWebhooks, showError]);

  return {
    activeTab,
    addCustomHeader,
    analyticsLoading,
    closeLogsDialog,
    closeTestDialog,
    copiedId,
    copyToClipboard,
    customHeaders,
    editingWebhook,
    exportLogs,
    fetchGlobalWebhookLogs,
    formData,
    globalLogsFilter,
    globalLogsLoading,
    globalLogsPage,
    globalLogsSearch,
    globalLogsTotal,
    globalWebhookLogs,
    handleAnalyticsViewLogs,
    handleDialogOpen,
    handleEdit,
    handleGlobalLogsFilterChange,
    handleGlobalLogsPageChange,
    handleGlobalLogsSearch,
    handleLogsDialogOpen,
    handleLogsFilterChange,
    handleLogsPageChange,
    handleLogsSearch,
    handleQuickTest,
    handleSubmit,
    handleTestDialogOpen,
    isDialogOpen,
    logsFilter,
    logsLoading,
    logsPage,
    logsSearch,
    logsTotal,
    openCreateDialog,
    removeCustomHeader,
    selectedWebhookForLogs,
    selectedWebhookForTest,
    setActiveTab,
    setFormData,
    showError,
    testLoading,
    testResult,
    testWebhook,
    updateCustomHeader,
    webhookAnalytics,
    ...webhookConfigurations,
    webhookLogs,
  };
}

export type WebhookManagementController = ReturnType<typeof useWebhookManagementController>;
