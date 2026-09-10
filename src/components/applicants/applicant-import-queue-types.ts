export interface QueueItem {
  id: string;
  file_name: string;
  file_size: number;
  status: 'queued' | 'inprocess' | 'success' | 'failed';
  error?: string;
  error_details?: string;
  source?: string;
  source_id?: string;
  sub_source?: string;
  source_name?: string;
  source_logo?: string;
  applicant_id?: string;
  applicant_name?: string;
  upload_date: string;
  completed_date?: string;
  upload_id?: string;
  created_by?: string;
  updated_at: string;
  file_path: string;
  webhook_payload?: unknown;
  position_id?: string;
  position_title?: string;
  process_date?: string;
  url?: string;
  progress?: number;
  total_applicants?: number;
  processed_applicants?: number;
  user_id: string;
  user_email?: string;
}

export interface QueueSummary {
  total?: number;
  queued: number;
  inprocess: number;
  success: number;
  error: number;
}

export interface QueueResponse {
  data: QueueItem[];
  total: number;
  summary?: QueueSummary;
}
