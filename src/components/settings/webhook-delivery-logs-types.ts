export interface WebhookLog {
  id: string;
  event_type: string;
  payload: unknown;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number;
  createdAt: string;
}

export interface WebhookLogsProps {
  webhookId: string;
  webhookName: string;
}

export interface WebhookLogsFiltersState {
  event_type: string;
  success: string;
  start_date: string;
  end_date: string;
}

export interface WebhookLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type WebhookLogsFilterKey = keyof WebhookLogsFiltersState;

