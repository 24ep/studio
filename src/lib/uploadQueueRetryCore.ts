import { logAudit } from './auditLog';
import {
  calculateRetryDelay,
  getRetryErrorMessage,
  isRetryableUploadQueueError,
  normalizeRetryConfig,
} from './uploadQueueRetryUtils';
import type { RetryConfig, RetryResult } from './uploadQueueRetryTypes';

async function waitForRetryDelay(attempt: number, config: RetryConfig) {
  const delay = calculateRetryDelay(attempt, config);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function runRetryLoop<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string | undefined,
  shouldRetryError?: (error: unknown) => boolean,
): Promise<RetryResult<T>> {
  const finalConfig = normalizeRetryConfig(config);
  const startTime = Date.now();

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();
      const totalTime = Date.now() - startTime;

      if (attempt > 0 && context) {
        await logAudit('INFO', `Retry succeeded after ${attempt} attempts for ${context}`, 'Retry:Success', null, {
          context,
          attempts: attempt,
          totalTime,
        });
      }

      return {
        success: true,
        data: result,
        retries: attempt,
        totalTime,
      };
    } catch (error) {
      const errorMessage = getRetryErrorMessage(error);
      const totalTime = Date.now() - startTime;

      if (shouldRetryError && !shouldRetryError(error)) {
        if (context) {
          await logAudit('ERROR', `Non-retryable error for ${context}`, 'Retry:NonRetryable', null, {
            context,
            error: errorMessage,
          });
        }

        return {
          success: false,
          error: errorMessage,
          retries: 0,
          totalTime,
        };
      }

      if (attempt === finalConfig.maxRetries) {
        if (context) {
          await logAudit('ERROR', `Retry failed after ${attempt + 1} attempts for ${context}`, 'Retry:Failure', null, {
            context,
            attempts: attempt + 1,
            totalTime,
            error: errorMessage,
          });
        }

        return {
          success: false,
          error: errorMessage,
          retries: attempt + 1,
          totalTime,
        };
      }

      if (context) {
        await logAudit('WARN', `Retry attempt ${attempt + 1} for ${context}`, 'Retry:Attempt', null, {
          context,
          attempt: attempt + 1,
          maxRetries: finalConfig.maxRetries,
          error: errorMessage,
        });
      }

      await waitForRetryDelay(attempt, finalConfig);
    }
  }

  return {
    success: false,
    error: 'Unexpected retry failure',
    retries: finalConfig.maxRetries + 1,
    totalTime: Date.now() - startTime,
  };
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string,
): Promise<RetryResult<T>> {
  return runRetryLoop(operation, config, context);
}

export async function retryUploadQueueInsertion(
  operation: () => Promise<unknown>,
  fileName: string,
  config: Partial<RetryConfig> = {},
): Promise<RetryResult<unknown>> {
  return retryWithBackoff(
    operation,
    config,
    `UploadQueue:Insert:${fileName}`,
  );
}

export async function retryBulkUploadQueueInsertion(
  operation: () => Promise<unknown>,
  batchId: string,
  fileCount: number,
  config: Partial<RetryConfig> = {},
): Promise<RetryResult<unknown>> {
  return retryWithBackoff(
    operation,
    config,
    `UploadQueue:BulkInsert:${batchId}:${fileCount}files`,
  );
}

export function isRetryableError(error: unknown): boolean {
  return isRetryableUploadQueueError(error);
}

export async function retryWithErrorChecking<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string,
): Promise<RetryResult<T>> {
  return runRetryLoop(operation, config, context, isRetryableError);
}
