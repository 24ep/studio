import { Database, Globe, Send, Settings, Shield, Upload } from 'lucide-react';

import type { FieldMapping, WebhookBodyConfig } from './webhook-body-customization-types';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  is_active: boolean;
  auth_type: 'none' | 'basic' | 'bearer' | 'header';
  auth_username?: string;
  auth_password?: string;
  auth_token?: string;
  auth_header_name?: string;
  auth_header_value?: string;
  headers: Record<string, string>;
  retry_count: number;
  timeout: number;
  body_template?: string | null;
  field_mappings?: FieldMapping[] | null;
  include_metadata?: boolean;
  custom_payload?: boolean;
  body_configs?: WebhookBodyConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface WebhookFormData {
  name: string;
  url: string;
  events: string[];
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  is_active: boolean;
  auth_type: 'none' | 'basic' | 'bearer' | 'header';
  auth_username?: string;
  auth_password?: string;
  auth_token?: string;
  auth_header_name?: string;
  auth_header_value?: string;
  headers: Record<string, string>;
  retry_count: number;
  timeout: number;
}

export const WEBHOOK_EVENT_CATEGORIES = [
  {
    category: 'Applicant Management',
    icon: <Database className="h-4 w-4" />,
    color: 'bg-blue-500',
    events: [
      { id: 'Applicant.created', label: 'Applicant Created', description: 'When a new Applicant is added to the system' },
      { id: 'Applicant.updated', label: 'Applicant Updated', description: 'When Applicant information is modified' },
      { id: 'Applicant.deleted', label: 'Applicant Deleted', description: 'When a Applicant is removed from the system' },
      { id: 'Applicant.stage_changed', label: 'Stage Changed', description: 'When a Applicant moves to a different stage' },
    ],
  },
  {
    category: 'Position Management',
    icon: <Globe className="h-4 w-4" />,
    color: 'bg-green-500',
    events: [
      { id: 'position.created', label: 'Position Created', description: 'When a new job position is created' },
      { id: 'position.updated', label: 'Position Updated', description: 'When position details are modified' },
      { id: 'position.deleted', label: 'Position Deleted', description: 'When a position is removed' },
    ],
  },
  {
    category: 'User Management',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-500',
    events: [
      { id: 'user.created', label: 'User Created', description: 'When a new user account is created' },
      { id: 'user.updated', label: 'User Updated', description: 'When user information is modified' },
      { id: 'user.deleted', label: 'User Deleted', description: 'When a user account is removed' },
    ],
  },
  {
    category: 'Document Processing',
    icon: <Upload className="h-4 w-4" />,
    color: 'bg-orange-500',
    events: [
      { id: 'resume.uploaded', label: 'Resume Uploaded', description: 'When a resume file is uploaded' },
      { id: 'resume.processed', label: 'Resume Processed', description: 'When resume parsing is completed' },
    ],
  },
  {
    category: 'Communication',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-pink-500',
    events: [
      { id: 'comment.created', label: 'Comment Created', description: 'When a new comment is added' },
      { id: 'comment.updated', label: 'Comment Updated', description: 'When a comment is modified' },
      { id: 'comment.deleted', label: 'Comment Deleted', description: 'When a comment is removed' },
    ],
  },
  {
    category: 'System Events',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-gray-500',
    events: [
      { id: 'upload_queue.created', label: 'Upload Queue Created', description: 'When a file upload is queued' },
      { id: 'upload_queue.inprocess', label: 'Upload Queue Processing', description: 'When file processing begins' },
      { id: 'upload_queue.completed', label: 'Upload Queue Completed', description: 'When file processing finishes' },
      { id: 'upload_queue.failed', label: 'Upload Queue Failed', description: 'When file processing fails' },
      { id: 'upload_queue.retry', label: 'Upload Queue Retry', description: 'When file processing is retried' },
    ],
  },
];
