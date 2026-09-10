import type { WebhookData } from './webhook-dispatcher-types';

export const WEBHOOK_EVENT_FIELDS: Record<string, string[]> = {
  'Applicant.created': [
    'id', 'name', 'email', 'phone', 'status', 'positionId', 'applicationDate',
    'createdAt', 'updatedAt', 'resume', 'coverLetter', 'skills', 'experience',
  ],
  'Applicant.updated': [
    'id', 'name', 'email', 'phone', 'status', 'positionId', 'applicationDate',
    'createdAt', 'updatedAt', 'resume', 'coverLetter', 'skills', 'experience',
    'changes', 'previousValues',
  ],
  'Applicant.deleted': [
    'id', 'name', 'email', 'phone', 'status', 'positionId', 'applicationDate',
    'createdAt', 'updatedAt', 'deletedAt',
  ],
  'Applicant.stage_changed': [
    'id', 'name', 'email', 'status', 'positionId', 'previousStage', 'newStage',
    'changedAt', 'changedBy', 'reason',
  ],
  'position.created': [
    'id', 'title', 'department', 'description', 'requirements', 'isOpen',
    'createdAt', 'updatedAt', 'salary', 'location', 'type',
  ],
  'position.updated': [
    'id', 'title', 'department', 'description', 'requirements', 'isOpen',
    'createdAt', 'updatedAt', 'salary', 'location', 'type', 'changes',
  ],
  'position.deleted': [
    'id', 'title', 'department', 'description', 'deletedAt',
  ],
  'user.created': [
    'id', 'name', 'email', 'role', 'createdAt', 'updatedAt',
  ],
  'user.updated': [
    'id', 'name', 'email', 'role', 'createdAt', 'updatedAt', 'changes',
  ],
  'user.deleted': [
    'id', 'name', 'email', 'role', 'deletedAt',
  ],
  'resume.uploaded': [
    'id', 'fileName', 'fileSize', 'uploadDate', 'applicantId', 'ApplicantName',
    'positionId', 'positionTitle',
  ],
  'resume.processed': [
    'id', 'fileName', 'fileSize', 'uploadDate', 'applicantId', 'ApplicantName',
    'positionId', 'positionTitle', 'processingResult', 'extractedData',
  ],
  'comment.created': [
    'id', 'content', 'authorId', 'authorName', 'applicantId', 'ApplicantName',
    'createdAt', 'attachments',
  ],
  'comment.updated': [
    'id', 'content', 'authorId', 'authorName', 'applicantId', 'ApplicantName',
    'createdAt', 'updatedAt', 'changes',
  ],
  'comment.deleted': [
    'id', 'content', 'authorId', 'authorName', 'applicantId', 'ApplicantName',
    'deletedAt',
  ],
  'upload_queue.created': [
    'id', 'fileName', 'fileSize', 'status', 'uploadDate', 'createdBy',
    'source', 'positionId',
  ],
  'upload_queue.processing': [
    'id', 'fileName', 'fileSize', 'status', 'uploadDate', 'processingStartedAt',
    'positionId',
  ],
  'upload_queue.completed': [
    'id', 'fileName', 'fileSize', 'status', 'uploadDate', 'completedDate',
    'processingResult', 'positionId',
  ],
  'upload_queue.failed': [
    'id', 'fileName', 'fileSize', 'status', 'uploadDate', 'error',
    'errorDetails', 'positionId',
  ],
  'upload_queue.retry': [
    'id', 'fileName', 'fileSize', 'status', 'uploadDate', 'retryCount',
    'previousErrors', 'positionId',
  ],
};

export const WEBHOOK_SAMPLE_PAYLOADS: Record<string, WebhookData> = {
  'Applicant.created': {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Sample Applicant',
    email: 'Applicant@example.com',
    phone: '+1234567890',
    status: 'active',
    positionId: '456e7890-e89b-12d3-a456-426614174001',
    applicationDate: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  'position.created': {
    id: '456e7890-e89b-12d3-a456-426614174001',
    title: 'Sample Position',
    department: 'Sample Department',
    description: 'Sample position description...',
    isOpen: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  'upload_queue.completed': {
    id: '789e0123-e89b-12d3-a456-426614174002',
    fileName: 'sample-resume.pdf',
    fileSize: 1024000,
    status: 'completed',
    uploadDate: '2024-01-15T10:30:00Z',
    completedDate: '2024-01-15T10:35:00Z',
    processingResult: 'success',
  },
};

export function getWebhookEventFields(eventType: string): string[] {
  return WEBHOOK_EVENT_FIELDS[eventType] || [];
}

export function getWebhookSamplePayload(eventType: string): WebhookData {
  return WEBHOOK_SAMPLE_PAYLOADS[eventType] || { message: 'Sample data not available for this event type' };
}
