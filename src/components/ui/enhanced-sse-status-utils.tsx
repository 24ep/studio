import type { EnhancedSSEEndpointStatus } from '@/hooks/use-enhanced-sse';
import {
  AlertTriangle,
  CheckCircle,
  PowerOff,
  XCircle,
} from 'lucide-react';

export function getEnhancedSseStatusIcon(endpoint: EnhancedSSEEndpointStatus) {
  if (endpoint.isConnected) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }

  if (endpoint.lastError) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }

  if (!endpoint.enabled) {
    return <PowerOff className="h-4 w-4 text-gray-400" />;
  }

  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
}

export function getEnhancedSseStatusColor(endpoint: EnhancedSSEEndpointStatus) {
  if (endpoint.isConnected) {
    return 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200';
  }

  if (endpoint.lastError) {
    return 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200';
  }

  if (!endpoint.enabled) {
    return 'border-border bg-muted text-muted-foreground';
  }

  return 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
}

export function getEnhancedSseStatusText(endpoint: EnhancedSSEEndpointStatus) {
  if (endpoint.isConnected) {
    return 'Connected';
  }

  if (endpoint.lastError) {
    return 'Failed';
  }

  if (!endpoint.enabled) {
    return 'Disabled';
  }

  return 'Disconnected';
}

export function formatEnhancedSseError(error: string) {
  return error.length > 50 ? `${error.substring(0, 50)}...` : error;
}

export type EnhancedSseSummaryColor = 'blue' | 'green' | 'gray' | 'red';

const ENHANCED_SSE_SUMMARY_CARD_CLASSES: Record<EnhancedSseSummaryColor, {
  backgroundClassName: string;
  textClassName: string;
}> = {
  blue: {
    backgroundClassName: 'bg-blue-50 dark:bg-blue-950/40',
    textClassName: 'text-blue-600 dark:text-blue-300',
  },
  green: {
    backgroundClassName: 'bg-green-50 dark:bg-green-950/40',
    textClassName: 'text-green-600 dark:text-green-300',
  },
  gray: {
    backgroundClassName: 'bg-muted',
    textClassName: 'text-muted-foreground',
  },
  red: {
    backgroundClassName: 'bg-red-50 dark:bg-red-950/40',
    textClassName: 'text-red-600 dark:text-red-300',
  },
};

export function getEnhancedSseSummaryCardClassNames(color: EnhancedSseSummaryColor) {
  return ENHANCED_SSE_SUMMARY_CARD_CLASSES[color];
}
