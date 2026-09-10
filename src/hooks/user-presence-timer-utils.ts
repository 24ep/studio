import type { MutableRefObject } from 'react';

export function clearPresenceIntervalRef(intervalRef: MutableRefObject<NodeJS.Timeout | null>) {
  if (!intervalRef.current) {
    return;
  }

  clearInterval(intervalRef.current);
  intervalRef.current = null;
}

export function clearPresenceIntervalRefs(
  ...intervalRefs: Array<MutableRefObject<NodeJS.Timeout | null>>
) {
  intervalRefs.forEach(clearPresenceIntervalRef);
}
