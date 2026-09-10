export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: CircuitBreakerState = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000,
    private name: string = 'CircuitBreaker'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        console.log(`${this.name}: Circuit breaker half-open`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log(`${this.name}: Circuit breaker reset`);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`${this.name}: Circuit breaker opened after ${this.failureCount} failures`);
    }
  }
}

export function createLoopGuard(maxIterations: number = 1000, name: string = 'Loop') {
  let iterationCount = 0;

  return {
    check: () => {
      iterationCount++;
      if (iterationCount > maxIterations) {
        throw new Error(`Infinite loop detected in ${name}: ${iterationCount} iterations`);
      }
    },
    reset: () => {
      iterationCount = 0;
    },
    getCount: () => iterationCount,
  };
}

export function createProtectedDebounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number,
  maxCalls: number = 100,
  name: string = 'DebouncedFunction'
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let callCount = 0;
  let lastCallTime = 0;

  return (...args: TArgs) => {
    const now = Date.now();
    callCount++;

    if (callCount > maxCalls) {
      console.error(`Excessive calls detected in ${name}: ${callCount} calls`);
      return;
    }

    if (now - lastCallTime < 50) {
      console.warn(`Frequent calls detected in ${name}: ${now - lastCallTime}ms between calls`);
    }

    lastCallTime = now;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      callCount = 0;
    }, delay);
  };
}
