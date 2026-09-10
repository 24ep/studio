import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, createLoopGuard, createProtectedDebounce } from './infinite-loop-guards';

describe('infinite loop guards', () => {
  it('opens and resets a circuit breaker after repeated failures', async () => {
    const breaker = new CircuitBreaker(2, 1000, 'test');
    const failingOperation = () => Promise.reject(new Error('nope'));

    await expect(breaker.execute(failingOperation)).rejects.toThrow('nope');
    await expect(breaker.execute(failingOperation)).rejects.toThrow('nope');
    expect(breaker.getState()).toBe('OPEN');
    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toThrow('Circuit breaker is OPEN');

    breaker.reset();
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('throws when a loop guard exceeds its max iterations', () => {
    const guard = createLoopGuard(2, 'import');

    guard.check();
    guard.check();
    expect(() => guard.check()).toThrow('Infinite loop detected in import: 3 iterations');

    guard.reset();
    expect(guard.getCount()).toBe(0);
  });

  it('debounces protected calls and resets call count after execution', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = createProtectedDebounce(callback, 100, 3, 'search');

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('b');
    vi.useRealTimers();
  });
});
