'use client';

import { useCallback, useState } from 'react';

import { readJsonOrFallback } from '@/lib/response-json';
import type { Webhook } from './webhook-management-data';
import {
  getWebhookTestErrorMessage,
  sanitizeWebhookTestResult,
  type WebhookTestResult,
} from './webhook-analytics-utils';
import { createWebhookTestPayload } from './webhook-management-utils';

interface UseWebhookTestOptions {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useWebhookTest({ onError, onSuccess }: UseWebhookTestOptions) {
  const [selectedWebhookForTest, setSelectedWebhookForTest] = useState<Webhook | null>(null);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testPayload, setTestPayload] = useState(createWebhookTestPayload);

  const testWebhook = useCallback(async () => {
    if (!selectedWebhookForTest) return;

    try {
      setTestLoading(true);
      const response = await fetch(`/api/settings/webhooks/${selectedWebhookForTest.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testPayload,
      });

      if (response.ok) {
        setTestResult(sanitizeWebhookTestResult(await readJsonOrFallback<unknown>(response, {})));
        onSuccess('Webhook test completed');
      } else {
        onError(getWebhookTestErrorMessage(await readJsonOrFallback<unknown>(response, {})));
      }
    } catch (error) {
      onError('Webhook test failed');
    } finally {
      setTestLoading(false);
    }
  }, [onError, onSuccess, selectedWebhookForTest, testPayload]);

  const handleTestDialogOpen = useCallback((webhook: Webhook | null) => {
    setSelectedWebhookForTest(webhook);
    if (webhook) {
      setTestResult(null);
      setTestPayload(createWebhookTestPayload());
    }
  }, []);

  return {
    selectedWebhookForTest,
    testResult,
    testLoading,
    testWebhook,
    handleTestDialogOpen,
    closeTestDialog: () => setSelectedWebhookForTest(null),
  };
}
