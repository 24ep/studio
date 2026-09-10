export interface ErrorContext {
  errorType: string;
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
  dataType?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

export type ErrorAdditionalContext = Record<string, unknown>;

const FILTER_ERROR_PATTERNS = [
  "filter is not a function",
  "T.filter is not a function",
  "filter is not a function or its return value is not iterable",
];

const INITIALIZATION_ERROR_PATTERNS = [
  "Cannot access",
  "before initialization",
  "is not defined",
  "temporal dead zone",
  "tg",
  "ee",
];

const INITIALIZATION_SUGGESTIONS = [
  "Try refreshing the page to reload the JavaScript bundle",
  "Clear your browser cache and reload",
  "Check your internet connection",
  "Try using a different browser or incognito mode",
  "Disable browser extensions temporarily",
];

const FILTER_ERROR_SUGGESTIONS = [
  "Use reactSafeArray.filter() instead of array.filter()",
  "Add defensive checks: Array.isArray(data) ? data.filter(...) : []",
  "Use the useSafeFilter hook for React components",
  "Check API response structure and ensure data is properly initialized",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function buildErrorContext(
  error: Error | string,
  errorType: string,
  additionalContext: ErrorAdditionalContext | undefined,
): ErrorContext {
  return {
    ...additionalContext,
    errorType,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server-side",
    url: typeof window !== "undefined" ? window.location.href : "server-side",
  };
}

export function isInitializationError(message: string): boolean {
  return INITIALIZATION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function getInitializationErrorVariableName(message: string): string {
  if (message.includes("tg")) {
    return "TG";
  }

  if (message.includes("ee")) {
    return "EE";
  }

  return "Unknown";
}

export function createInitializationErrorContext(errorContext: ErrorContext) {
  const variableName = getInitializationErrorVariableName(errorContext.message);

  return {
    ...errorContext,
    errorType: `${variableName}_initialization_error`,
    suggestions: INITIALIZATION_SUGGESTIONS,
    likelyCause: "Variable accessed before initialization in minified bundle",
    recommendation: "This is likely a minified bundle issue. Try refreshing the page.",
  };
}

export function createFilterErrorContext(errorContext: ErrorContext) {
  return {
    ...errorContext,
    errorType: "filter_error",
    suggestions: FILTER_ERROR_SUGGESTIONS,
  };
}

export function isResizeObserverLoopError(message: string | undefined): boolean {
  return Boolean(
    message?.includes("ResizeObserver loop completed with undelivered notifications"),
  );
}

export function isFilterError(error: Error | string): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return FILTER_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function getFilterErrorDebugInfo(array: unknown, context: string) {
  const objectValue = isRecord(array) ? array : null;
  const lengthValue = typeof array === "string" || Array.isArray(array) ? array.length : undefined;

  return {
    context,
    arrayType: typeof array,
    isArray: Array.isArray(array),
    isNull: array === null,
    isUndefined: array === undefined,
    constructor: objectValue?.constructor?.name,
    length: lengthValue,
    keys: objectValue ? Object.keys(objectValue) : null,
    sample: objectValue ? `${JSON.stringify(objectValue).substring(0, 200)}...` : null,
    timestamp: new Date().toISOString(),
  };
}
