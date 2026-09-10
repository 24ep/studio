export interface WebhookFetchOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface WebhookFetchResult {
  status: number;
  ok: boolean;
  body: string;
  headers: Record<string, string>;
  duration: number;
}

export class WebhookFetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string,
    public isTimeout: boolean = false
  ) {
    super(message);
    this.name = 'WebhookFetchError';
  }
}
