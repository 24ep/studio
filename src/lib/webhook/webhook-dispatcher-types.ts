export type WebhookData = Record<string, unknown>;

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: unknown;
  webhook_id?: string;
  [key: string]: unknown;
}

export interface WebhookResult {
  webhook_id: string;
  success: boolean;
  status?: number;
  error?: string;
  duration_ms: number;
  rateLimited?: boolean;
}
