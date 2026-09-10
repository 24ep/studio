import { describe, expect, it, vi } from 'vitest';

import {
  canStartProtectedClick,
  clearClickProtectionTimeout,
  resetActioningWhenMounted,
  resetClickProtectionState,
  scheduleClickProtectionReset,
} from './click-protection-utils';

describe('click protection utilities', () => {
  it('blocks unmounted, rapid, and already-running clicks with callbacks', () => {
    const onBlocked = vi.fn();
    const onExcessiveClicks = vi.fn();

    expect(canStartProtectedClick({
      debounceMs: 200,
      isActioning: false,
      isMounted: false,
      lastClickTime: 0,
      now: 500,
    })).toBe(false);
    expect(canStartProtectedClick({
      debounceMs: 200,
      isActioning: false,
      isMounted: true,
      lastClickTime: 450,
      now: 500,
      onExcessiveClicks,
    })).toBe(false);
    expect(canStartProtectedClick({
      debounceMs: 200,
      isActioning: true,
      isMounted: true,
      lastClickTime: 0,
      now: 500,
      onBlocked,
    })).toBe(false);

    expect(onExcessiveClicks).toHaveBeenCalledTimes(1);
    expect(onBlocked).toHaveBeenCalledTimes(1);
  });

  it('allows mounted non-rapid clicks when no action is running', () => {
    expect(canStartProtectedClick({
      debounceMs: 200,
      isActioning: false,
      isMounted: true,
      lastClickTime: 100,
      now: 500,
    })).toBe(true);
  });

  it('clears and schedules action reset timers', () => {
    vi.useFakeTimers();
    const timeoutRef = { current: null };
    const isMountedRef = { current: true };
    const setIsActioning = vi.fn();

    scheduleClickProtectionReset({
      isMountedRef,
      setIsActioning,
      timeoutMs: 100,
      timeoutRef,
    });

    expect(timeoutRef.current).not.toBeNull();
    vi.advanceTimersByTime(100);
    expect(setIsActioning).toHaveBeenCalledWith(false);

    clearClickProtectionTimeout(timeoutRef);
    expect(timeoutRef.current).toBeNull();
    vi.useRealTimers();
  });

  it('resets state and only clears actioning while mounted', () => {
    const timeout = setTimeout(() => undefined, 1000);
    const timeoutRef = { current: timeout };
    const lastClickTimeRef = { current: 123 };
    const setIsActioning = vi.fn();

    resetClickProtectionState({ lastClickTimeRef, setIsActioning, timeoutRef });
    expect(lastClickTimeRef.current).toBe(0);
    expect(timeoutRef.current).toBeNull();
    expect(setIsActioning).toHaveBeenCalledWith(false);

    resetActioningWhenMounted({ current: false }, setIsActioning);
    expect(setIsActioning).toHaveBeenCalledTimes(1);
  });
});
