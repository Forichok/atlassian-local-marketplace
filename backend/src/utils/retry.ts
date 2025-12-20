import { delay } from './delay';

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < options.maxRetries) {
        if (options.onRetry) {
          options.onRetry(lastError, attempt + 1);
        }

        const backoffDelay = options.retryDelay * Math.pow(2, attempt);
        await delay(backoffDelay);
      }
    }
  }

  throw lastError!;
}
