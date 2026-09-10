'use client';

import { useCallback, useState } from 'react';

import { readJsonOrFallback } from '@/lib/response-json';
import { sanitizeWebhookAnalytics, type WebhookAnalytics } from './webhook-analytics-utils';

export function useWebhookAnalytics() {
  const [webhookAnalytics, setWebhookAnalytics] = useState<WebhookAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchWebhookAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/settings/webhooks/analytics');
      if (response.ok) {
        setWebhookAnalytics(sanitizeWebhookAnalytics(await readJsonOrFallback<unknown>(response, {})));
      } else {
        console.error('Failed to fetch webhook analytics');
      }
    } catch (error) {
      console.error('Error fetching webhook analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  return {
    webhookAnalytics,
    analyticsLoading,
    fetchWebhookAnalytics,
  };
}
