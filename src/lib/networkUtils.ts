// src/lib/networkUtils.ts
// Network utilities for health checks and connection diagnostics

import {
  calculateNetworkRetryDelay,
  getApiResponseErrorMessage,
  getNetworkErrorName,
  getNetworkErrorStatus,
  getNetworkErrorText,
  getNetworkFailureDetails,
  getUserFriendlyNetworkErrorMessage,
  isNetworkRetryableError,
  isNonRetryableHttpStatus,
} from './networkErrorUtils';

export interface NetworkHealthResult {
  isHealthy: boolean;
  latency: number;
  error?: string;
  details?: {
    dnsResolution: boolean;
    connectionEstablished: boolean;
    responseReceived: boolean;
  };
}

export interface ApiHealthResult {
  isHealthy: boolean;
  endpoints: {
    [key: string]: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime: number;
      error?: string;
    };
  };
}

type ApiEndpointHealth = ApiHealthResult['endpoints'][string];

function networkHealthDetails(responseReceived: boolean) {
  return {
    dnsResolution: true,
    connectionEstablished: true,
    responseReceived,
  };
}

async function fetchHeadWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildNetworkHealthResult(response: Response, latency: number): NetworkHealthResult {
  if (response.ok) {
    return {
      isHealthy: true,
      latency,
      details: networkHealthDetails(true),
    };
  }

  return {
    isHealthy: false,
    latency,
    error: `HTTP ${response.status}: ${response.statusText}`,
    details: networkHealthDetails(false),
  };
}

async function checkSingleApiEndpoint(endpoint: string): Promise<[string, ApiEndpointHealth]> {
  const startTime = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return [endpoint, {
        status: 'healthy',
        responseTime,
      }];
    }

    return [endpoint, {
      status: 'unhealthy',
      responseTime,
      error: `HTTP ${response.status}`,
    }];
  } catch (error: unknown) {
    return [endpoint, {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: getNetworkErrorText(error) || 'Network error',
    }];
  }
}

/**
 * Check network connectivity to a specific endpoint
 */
export async function checkNetworkHealth(url: string, timeout = 5000): Promise<NetworkHealthResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetchHeadWithTimeout(url, timeout);
    const latency = Date.now() - startTime;
    return buildNetworkHealthResult(response, latency);
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const details = getNetworkFailureDetails(error);

    if (getNetworkErrorName(error) === 'AbortError') {
      return {
        isHealthy: false,
        latency,
        error: 'Request timeout',
        details,
      };
    }

    return {
      isHealthy: false,
      latency,
      error: getNetworkErrorText(error) || 'Network error',
      details,
    };
  }
}

/**
 * Check health of multiple API endpoints
 */
export async function checkApiHealth(endpoints: string[]): Promise<ApiHealthResult> {
  const endpointEntries = await Promise.all(endpoints.map(checkSingleApiEndpoint));
  const endpointResults = Object.fromEntries(endpointEntries);

  return {
    isHealthy: Object.values(endpointResults).every(result => result.status === 'healthy'),
    endpoints: endpointResults,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      if (isNonRetryableHttpStatus(getNetworkErrorStatus(error))) {
        break;
      }

      const delay = calculateNetworkRetryDelay(attempt, baseDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return isNetworkRetryableError(error);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  return getUserFriendlyNetworkErrorMessage(error);
}

/**
 * Handle API response and throw appropriate error with user-friendly message
 */
export function handleApiResponse(response: Response, defaultMessage: string = 'Request failed'): Response {
  if (!response.ok) {
    throw new Error(getApiResponseErrorMessage(response.status, defaultMessage));
  }
  
  return response;
}

/**
 * Handle API response with JSON parsing and error handling
 */
export async function handleApiResponseJson<T>(response: Response, defaultMessage: string = 'Request failed'): Promise<T> {
  const handledResponse = handleApiResponse(response, defaultMessage);
  return handledResponse.json();
}
