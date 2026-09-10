import type { ErrorInfo } from 'react';

import { isChunkLoadError } from '@/lib/chunk-load-recovery';
import { isFilterError } from '@/lib/error-handler';

export type FilterErrorContext = {
  type?: string;
  errorType?: string;
  message: string;
  suggestion?: string;
  component?: string;
  function?: string;
};

export interface ErrorFallbackFlags {
  isChartError: boolean;
  isChunkError: boolean;
  isDateError: boolean;
  isFilterErrorType: boolean;
  isMimeError: boolean;
}

const FILTER_COMPONENT_STACK_MARKERS = [
  'ApplicantKanbanView',
  'ApplicantTable',
  'DashboardPageClient',
  'ApplicantsPageClient',
];

const FILTER_DETAIL_STACK_MARKERS = [
  ...FILTER_COMPONENT_STACK_MARKERS,
  'useMemo',
  'useEffect',
  'filter',
];

export function getFilterErrorContext(error: Error): FilterErrorContext | null {
  if (!isFilterError(error)) {
    return null;
  }

  if (error.message.includes('getTime is not a function')) {
    return {
      type: 'date_error',
      message: 'Date object validation failed - getTime method not available',
      suggestion: 'Check if date objects are properly initialized before calling getTime()',
    };
  }

  const context: FilterErrorContext = {
    errorType: 'filter_error',
    message: error.message,
  };
  const stackLines = getErrorStackLines(error);
  const componentLine = stackLines.find((line) =>
    FILTER_COMPONENT_STACK_MARKERS.some((marker) => line.includes(marker)),
  );
  const functionLine = stackLines.find((line) =>
    line.includes('filter') &&
    (line.includes('useMemo') || line.includes('useEffect') || line.includes('render')),
  );

  if (componentLine) {
    context.component = componentLine.trim();
  }

  if (functionLine) {
    context.function = functionLine.trim();
  }

  return context;
}

export function getErrorFallbackFlags(error: Error | undefined): ErrorFallbackFlags {
  return {
    isChartError: Boolean(error?.message?.includes('Filler plugin')),
    isChunkError: error ? isChunkLoadError(error) : false,
    isDateError: Boolean(error?.message?.includes('getTime is not a function')),
    isFilterErrorType: error ? isFilterError(error) : false,
    isMimeError: Boolean(error?.message?.includes('MIME type')),
  };
}

export function getRelevantFilterErrorStackLines(error: Error | undefined) {
  return getErrorStackLines(error)
    .filter((line) => FILTER_DETAIL_STACK_MARKERS.some((marker) => line.includes(marker)))
    .slice(0, 5);
}

export function createErrorBoundaryLogContext(error: Error, errorInfo: ErrorInfo) {
  return {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    filterErrorContext: getFilterErrorContext(error),
  };
}

function getErrorStackLines(error: Error | undefined) {
  return error?.stack?.split('\n') ?? [];
}
