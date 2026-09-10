/*
  A safe fetch wrapper that:
  - Adds a timeout via AbortController
  - Never throws: returns a normalized result
  - Allows callers to proceed gracefully when endpoints fail
*/

export interface SafeFetchOptions extends RequestInit {
	timeoutMs?: number;
}

export interface SafeFetchResult<T = unknown> {
	ok: boolean;
	status: number | null;
	data: T | null;
	error: string | null;
}

function getSafeFetchErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.name === 'AbortError' ? 'Request timeout' : error.message || 'Network error';
	}

	if (error && typeof error === 'object') {
		const errorRecord = error as Record<string, unknown>;
		if (errorRecord.name === 'AbortError') {
			return 'Request timeout';
		}
		if (typeof errorRecord.message === 'string' && errorRecord.message) {
			return errorRecord.message;
		}
	}

	return 'Network error';
}

export async function safeFetch<T = unknown>(input: RequestInfo | URL, options: SafeFetchOptions = {}): Promise<SafeFetchResult<T>> {
	const { timeoutMs = 15000, signal, ...rest } = options;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(input, {
			...rest,
			signal: signal ?? controller.signal,
		});

		clearTimeout(timeoutId);

		let data: unknown = null;
		const contentType = response.headers.get('content-type') || '';
		try {
			if (contentType.includes('application/json')) {
				data = await response.json();
			} else if (contentType.startsWith('text/')) {
				data = await response.text();
			}
		} catch {
			// Ignore body parse errors; treat as null
		}

		return {
			ok: response.ok,
			status: response.status,
			data: (response.ok ? (data as T) : null),
			error: response.ok ? null : `HTTP ${response.status}`,
		};
	} catch (error: unknown) {
		clearTimeout(timeoutId);
		return {
			ok: false,
			status: null,
			data: null,
			error: getSafeFetchErrorMessage(error),
		};
	}
}

export async function safeAll<T = unknown>(promises: Array<Promise<SafeFetchResult<T>>>): Promise<SafeFetchResult<T>[]> {
	const results = await Promise.allSettled(promises);
	return results.map((r) => (r.status === 'fulfilled' ? r.value : { ok: false, status: null, data: null, error: 'Promise rejected' }));
}


