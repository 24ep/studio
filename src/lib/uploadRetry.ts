export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERROR_MESSAGES = [
  'fetch failed',
  'network',
  'ECONNRESET',
  'ETIMEDOUT',
  'MinIO',
  'S3',
  'storage',
  'connection',
  'timeout',
  'pool',
];

interface SimpleRetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );

  if (!config.jitter) {
    return delay;
  }

  const jitter = delay * 0.25 * (getRandomValue() - 0.5);
  return Math.max(0, delay + jitter);
}

function getRandomValue(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 0xFFFFFFFF;
  }

  return Math.random();
}

function getErrorCode(error: unknown): number | string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as { code?: unknown; status?: unknown };
  const code = candidate.code ?? candidate.status;
  return typeof code === 'number' || typeof code === 'string' ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryableError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  if (RETRYABLE_ERROR_MESSAGES.some((message) => errorMessage.includes(message))) {
    return true;
  }

  return Boolean(errorCode && RETRYABLE_STATUS_CODES.includes(Number(errorCode)));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const data = await operation();
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      const isLastAttempt = attempt === finalConfig.maxAttempts;
      const isRetryable = isRetryableError(error);

      if (isLastAttempt || !isRetryable) {
        return {
          success: false,
          error: getErrorMessage(error),
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      }

      await wait(calculateDelay(attempt, finalConfig));
    }
  }

  return {
    success: false,
    error: 'Max retry attempts exceeded',
    attempts: finalConfig.maxAttempts,
    totalTime: Date.now() - startTime,
  };
}

export async function retryMinIOUpload(
  uploadOperation: () => Promise<void>,
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  const result = await retryWithBackoff(uploadOperation, {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
  });

  if (!result.success) {
    console.error(`[UPLOAD] MinIO upload failed for ${fileName} after ${result.attempts} attempts:`, result.error);
  }

  return toSimpleRetryResult(result);
}

export async function retryDatabaseOperation<T>(
  dbOperation: () => Promise<T>,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  const result = await retryWithBackoff(dbOperation, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
  });

  if (!result.success) {
    console.error(`[UPLOAD] Database operation '${operationName}' failed after ${result.attempts} attempts:`, result.error);
  }

  return toSimpleRetryResult(result);
}

export async function retryBatchOperations<T>(
  operations: Array<() => Promise<T>>,
  config: Partial<RetryConfig> = {}
): Promise<Array<{ success: boolean; data?: T; error?: string; index: number }>> {
  const results = await Promise.all(
    operations.map(async (operation, index) => {
      const result = await retryWithBackoff(operation, config);
      return {
        success: result.success,
        data: result.data,
        error: result.success ? undefined : result.error,
        index,
      };
    })
  );

  return results;
}

function toSimpleRetryResult<T>(result: RetryResult<T>): SimpleRetryResult<T> {
  return {
    success: result.success,
    data: result.data,
    error: result.success ? undefined : result.error,
  };
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
