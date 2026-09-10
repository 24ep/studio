export interface FetchMonitorListener {
  onResponse?: (response: Response, input: RequestInfo | URL, init?: RequestInit) => void;
  onError?: (error: unknown, input: RequestInfo | URL, init?: RequestInit) => void;
}

export interface FetchMonitorTarget {
  fetch: typeof fetch;
}

interface FetchMonitorState {
  listeners: Set<FetchMonitorListener>;
  originalFetch: typeof fetch;
  monitoredFetch: typeof fetch;
}

const monitorStates = new WeakMap<object, FetchMonitorState>();

function notifyListeners(
  listeners: Set<FetchMonitorListener>,
  callback: (listener: FetchMonitorListener) => void
) {
  for (const listener of [...listeners]) {
    try {
      callback(listener);
    } catch (error) {
      console.error('[fetch-monitor] Listener failed:', error);
    }
  }
}

export function subscribeToFetchMonitor(
  listener: FetchMonitorListener,
  target: FetchMonitorTarget = window
) {
  let state = monitorStates.get(target);

  if (!state) {
    const listeners = new Set<FetchMonitorListener>();
    const originalFetch = target.fetch;
    const monitoredFetch: typeof fetch = async (input, init) => {
      try {
        const response = await originalFetch.call(target, input, init);
        notifyListeners(listeners, current => current.onResponse?.(response, input, init));
        return response;
      } catch (error) {
        notifyListeners(listeners, current => current.onError?.(error, input, init));
        throw error;
      }
    };

    state = { listeners, originalFetch, monitoredFetch };
    monitorStates.set(target, state);
    target.fetch = monitoredFetch;
  }

  state.listeners.add(listener);

  return () => {
    const currentState = monitorStates.get(target);
    if (!currentState) return;

    currentState.listeners.delete(listener);
    if (currentState.listeners.size > 0) return;

    if (target.fetch === currentState.monitoredFetch) {
      target.fetch = currentState.originalFetch;
    }
    monitorStates.delete(target);
  };
}
