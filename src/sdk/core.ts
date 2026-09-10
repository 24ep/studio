export type QueryPrimitive = string | number | boolean | Date;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
export type Query = Record<string, QueryValue>;

export type ResponseType = 'auto' | 'json' | 'text' | 'blob' | 'arrayBuffer' | 'response';

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  responseType?: ResponseType;
  idempotencyKey?: string;
}

export interface HriveClientOptions {
  /** The platform origin, for example https://hr.example.com. */
  baseUrl: string;
  accessToken?: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit;
  timeoutMs?: number;
  retries?: number;
  credentials?: RequestCredentials;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class HriveApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly method: string;
  readonly url: string;
  readonly body: unknown;
  readonly requestId?: string;

  constructor(input: {
    status: number;
    statusText: string;
    method: string;
    url: string;
    body: unknown;
    requestId?: string;
  }) {
    const apiBody = input.body as ApiErrorBody | null;
    const detail = apiBody && typeof apiBody === 'object'
      ? apiBody.message || apiBody.error
      : typeof input.body === 'string' ? input.body : undefined;
    super(detail || `Hrive API request failed with status ${input.status}`);
    this.name = 'HriveApiError';
    this.status = input.status;
    this.statusText = input.statusText;
    this.method = input.method;
    this.url = input.url;
    this.body = input.body;
    this.requestId = input.requestId;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  if (!baseUrl.trim()) throw new TypeError('baseUrl is required');
  return baseUrl.replace(/\/+$/, '');
}

function queryValue(value: QueryPrimitive) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function buildUrl(baseUrl: string, path: string, query?: Query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach(item => url.searchParams.append(key, queryValue(item)));
      return;
    }
    url.searchParams.append(key, queryValue(value as QueryPrimitive));
  });

  return url;
}

function isBodyInit(body: unknown): body is BodyInit {
  if (typeof body === 'string' || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return true;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return true;
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return true;
  return false;
}

function prepareBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (isBodyInit(body)) return body;
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return JSON.stringify(body);
}

function responseDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return Math.min(250 * 2 ** attempt, 2_000);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function mergeSignals(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = timeoutMs > 0
    ? setTimeout(() => controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError')), timeoutMs)
    : undefined;

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    },
  };
}

async function parseResponse(response: Response, responseType: ResponseType): Promise<unknown> {
  if (responseType === 'response') return response;
  if (response.status === 204 || response.status === 205) return undefined;
  if (responseType === 'blob') return response.blob();
  if (responseType === 'arrayBuffer') return response.arrayBuffer();
  if (responseType === 'text') return response.text();

  const contentType = response.headers.get('content-type') || '';
  if (responseType === 'json' || contentType.includes('json')) {
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }
  if (responseType === 'auto' && (contentType.includes('octet-stream') || contentType.includes('spreadsheet') || contentType.includes('zip'))) {
    return response.blob();
  }
  return response.text();
}

export class HriveHttpClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly defaultHeaders: HeadersInit;
  private readonly getAccessToken?: HriveClientOptions['getAccessToken'];
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly credentials: RequestCredentials;
  private accessToken?: string;

  constructor(options: HriveClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.fetcher = options.fetch || globalThis.fetch;
    if (!this.fetcher) throw new TypeError('A fetch implementation is required');
    this.defaultHeaders = options.headers || {};
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retries = Math.max(0, options.retries ?? 0);
    this.credentials = options.credentials ?? 'same-origin';
  }

  setAccessToken(token?: string) {
    this.accessToken = token;
  }

  getAccessTokenValue() {
    return this.accessToken;
  }

  async request<T = unknown>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const responseType = options.responseType ?? 'auto';
    const url = buildUrl(this.baseUrl, path, options.query);
    const retries = Math.max(0, options.retries ?? this.retries);
    const retryableMethod = method === 'GET' || method === 'HEAD' || Boolean(options.idempotencyKey);
    const token = this.getAccessToken ? await this.getAccessToken() : this.accessToken;
    let lastNetworkError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const headers = new Headers(this.defaultHeaders);
      new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      headers.set('accept', headers.get('accept') || 'application/json');
      if (token) headers.set('authorization', `Bearer ${token}`);
      if (options.idempotencyKey) headers.set('idempotency-key', options.idempotencyKey);
      const body = prepareBody(options.body, headers);
      const merged = mergeSignals(options.signal, options.timeoutMs ?? this.timeoutMs);

      try {
        const response = await this.fetcher(url, {
          method,
          headers,
          body,
          signal: merged.signal,
          credentials: this.credentials,
        });

        if (!response.ok && retryableMethod && attempt < retries && [408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
          await delay(responseDelay(response, attempt), options.signal);
          continue;
        }

        const parsed = await parseResponse(response, responseType);
        if (!response.ok) {
          throw new HriveApiError({
            status: response.status,
            statusText: response.statusText,
            method,
            url: url.toString(),
            body: parsed,
            requestId: response.headers.get('x-request-id') || undefined,
          });
        }
        return parsed as T;
      } catch (error) {
        if (error instanceof HriveApiError || options.signal?.aborted || merged.signal.aborted) throw error;
        lastNetworkError = error;
        if (!retryableMethod || attempt >= retries) throw error;
        await delay(Math.min(250 * 2 ** attempt, 2_000), options.signal);
      } finally {
        merged.cleanup();
      }
    }

    throw lastNetworkError;
  }
}

export function idPath(id: string) {
  return encodeURIComponent(id);
}

