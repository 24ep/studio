import type { MutableRefObject } from 'react';

export interface ClickProtectionConfig {
  debounceMs?: number;
  timeoutMs?: number;
  actionName?: string;
  onBlocked?: () => void;
  onExcessiveClicks?: () => void;
}

export interface ClickProtectionReturn {
  isActioning: boolean;
  handleProtectedClick: (action: () => void | Promise<void>) => void;
  handleProtectedAsyncClick: (action: () => Promise<void>) => Promise<void>;
  reset: () => void;
}

export type ClickProtectionTimeoutRef = MutableRefObject<NodeJS.Timeout | null>;
export type ClickProtectionMountedRef = MutableRefObject<boolean>;

export function clearClickProtectionTimeout(timeoutRef: ClickProtectionTimeoutRef) {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

export function scheduleClickProtectionReset({
  isMountedRef,
  setIsActioning,
  timeoutMs,
  timeoutRef,
}: {
  isMountedRef: ClickProtectionMountedRef;
  setIsActioning: (value: boolean) => void;
  timeoutMs: number;
  timeoutRef: ClickProtectionTimeoutRef;
}) {
  clearClickProtectionTimeout(timeoutRef);
  timeoutRef.current = setTimeout(() => {
    if (isMountedRef.current) {
      setIsActioning(false);
    }
  }, timeoutMs);
}

export function resetClickProtectionState({
  lastClickTimeRef,
  setIsActioning,
  timeoutRef,
}: {
  lastClickTimeRef: MutableRefObject<number>;
  setIsActioning: (value: boolean) => void;
  timeoutRef: ClickProtectionTimeoutRef;
}) {
  setIsActioning(false);
  lastClickTimeRef.current = 0;
  clearClickProtectionTimeout(timeoutRef);
}

export function canStartProtectedClick({
  debounceMs,
  isActioning,
  isMounted,
  lastClickTime,
  now,
  onBlocked,
  onExcessiveClicks,
}: {
  debounceMs: number;
  isActioning: boolean;
  isMounted: boolean;
  lastClickTime: number;
  now: number;
  onBlocked?: () => void;
  onExcessiveClicks?: () => void;
}) {
  if (!isMounted) {
    return false;
  }

  if (now - lastClickTime < debounceMs) {
    onExcessiveClicks?.();
    return false;
  }

  if (isActioning) {
    onBlocked?.();
    return false;
  }

  return true;
}

export function resetActioningWhenMounted(
  isMountedRef: ClickProtectionMountedRef,
  setIsActioning: (value: boolean) => void
) {
  if (isMountedRef.current) {
    setIsActioning(false);
  }
}
