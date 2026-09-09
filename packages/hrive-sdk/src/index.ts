export type HriveQueryValue = string | number | boolean | null | undefined;
export type HriveQuery = Record<string, HriveQueryValue>;

export interface HriveClientOptions {
  /** Hrive origin, for example https://people.outborn.co */
  baseUrl?: string;
  /** JWT Bearer token returned by /api/v1/auth/login. */
  token?: string;
  /** Optional fetch implementation for tests, edge runtimes, or custom transports. */
  fetch?: typeof globalThis.fetch;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
}

export interface HriveLoginInput {
  email: string;
  password: string;
}

export interface HriveLoginResponse {
  success?: boolean;
  token?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string | null;
    role?: string | null;
    modulePermissions?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface HriveListQuery {
  page?: number;
  limit?: number;
  search?: string;
  searchTerm?: string;
  status?: string;
  role?: string;
  department?: string;
  isOpen?: boolean;
}

export interface HriveRawRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: HriveQuery;
  body?: unknown;
  headers?: Record<string, string>;
}

export class HriveApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, details: { status: number; statusText: string; url: string; body: unknown }) {
    super(message);
    this.name = 'HriveApiError';
    this.status = details.status;
    this.statusText = details.statusText;
    this.url = details.url;
    this.body = details.body;
  }
}

function normalizeBaseUrl(value: string | undefined) {
  return String(value || 'https://people.outborn.co').trim().replace(/\/+$/, '');
}

function apiPath(path: string) {
  const trimmed = String(path || '').trim();
  if (!trimmed) return '/api/v1/health';
  if (trimmed.startsWith('/api/v1/')) return trimmed;
  if (trimmed === '/api/v1') return trimmed;
  return `/api/v1/${trimmed.replace(/^\/+/, '')}`;
}

function appendQuery(url: URL, query?: HriveQuery) {
  if (!query) return;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return text;
}

function errorMessage(body: unknown, response: Response) {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nestedError = record.error && typeof record.error === 'object'
      ? record.error as Record<string, unknown>
      : undefined;
    const candidate = record.message || nestedError?.message || record.error;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return `Hrive API request failed with ${response.status} ${response.statusText}`;
}

export class HriveClient {
  readonly baseUrl: string;
  private token?: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HriveClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.token = options.token?.trim() || undefined;
    this.fetchImpl = options.fetch || globalThis.fetch;
    if (!this.fetchImpl) throw new Error('A fetch implementation is required');
    this.defaultHeaders = { ...options.headers };
  }

  setToken(token: string | undefined) {
    this.token = token?.trim() || undefined;
    return this;
  }

  getToken() {
    return this.token;
  }

  async request<T = unknown>(request: HriveRawRequest): Promise<T> {
    const method = request.method || 'GET';
    const url = new URL(apiPath(request.path), this.baseUrl);
    appendQuery(url, request.query);

    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.defaultHeaders,
      ...request.headers,
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    const init: RequestInit = { method, headers };
    if (request.body !== undefined) {
      headers['content-type'] = headers['content-type'] || 'application/json';
      init.body = headers['content-type'].includes('application/json')
        ? JSON.stringify(request.body)
        : String(request.body);
    }

    const response = await this.fetchImpl(url, init);
    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new HriveApiError(errorMessage(body, response), {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        body,
      });
    }
    return body as T;
  }

  health<T = unknown>() {
    return this.request<T>({ path: 'health' });
  }

  async login(input: HriveLoginInput) {
    const response = await this.request<HriveLoginResponse>({
      path: 'auth/login',
      method: 'POST',
      body: input,
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  listApplicants<T = unknown>(query: HriveListQuery = {}) {
    return this.request<T>({ path: 'applicants', query: query as HriveQuery });
  }

  getApplicant<T = unknown>(id: string) {
    return this.request<T>({ path: `applicants/${encodeURIComponent(id)}` });
  }

  createApplicant<T = unknown>(input: unknown) {
    return this.request<T>({ path: 'applicants', method: 'POST', body: input });
  }

  listPositions<T = unknown>(query: HriveListQuery = {}) {
    return this.request<T>({ path: 'positions', query: query as HriveQuery });
  }

  getPosition<T = unknown>(id: string) {
    return this.request<T>({ path: `positions/${encodeURIComponent(id)}` });
  }

  createPosition<T = unknown>(input: unknown) {
    return this.request<T>({ path: 'positions', method: 'POST', body: input });
  }

  listUsers<T = unknown>(query: HriveListQuery = {}) {
    return this.request<T>({ path: 'users', query: query as HriveQuery });
  }

  getUser<T = unknown>(id: string) {
    return this.request<T>({ path: `users/${encodeURIComponent(id)}` });
  }

  listRecruitmentStages<T = unknown>(query: HriveQuery = {}) {
    return this.request<T>({ path: 'recruitment-stages', query });
  }

  listNotifications<T = unknown>(query: HriveQuery = {}) {
    return this.request<T>({ path: 'notifications', query });
  }

  raw<T = unknown>(request: HriveRawRequest) {
    return this.request<T>(request);
  }
}

export function createHriveClient(options: HriveClientOptions = {}) {
  return new HriveClient(options);
}
