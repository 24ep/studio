"use client";

import {
  ArrowPathIcon as Loader2,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
  XCircleIcon as XCircle,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { ExpandablePayload } from '@/components/ui/ExpandablePayload';
import { Label } from '@/components/ui/label';
import {
  calculateUploadQueueDuration,
  formatUploadQueueDate,
  formatUploadQueueFileSize,
  getUploadQueueStatusColor,
} from './applicant-import-queue-utils';
import type { QueueItem } from './applicant-import-queue-types';

export function QueueStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'queued':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'inprocess':
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

interface QueueDetailFieldProps {
  label: string;
  value: string | number;
}

function QueueDetailField({ label, value }: QueueDetailFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function ApplicantImportQueueDetailsTab({ item }: { item: QueueItem }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <QueueDetailField label="File Name" value={item.file_name} />
        <QueueDetailField
          label="File Size"
          value={formatUploadQueueFileSize(item.file_size)}
        />
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex items-center space-x-2">
            <QueueStatusIcon status={item.status} />
            <Badge className={getUploadQueueStatusColor(item.status)}>
              {item.status}
            </Badge>
          </div>
        </div>
        <QueueDetailField
          label="Position"
          value={item.position_title || 'Not assigned'}
        />
        <QueueDetailField
          label="Upload Date"
          value={formatUploadQueueDate(item.upload_date)}
        />
        {item.process_date ? (
          <QueueDetailField
            label="Process Date"
            value={formatUploadQueueDate(item.process_date)}
          />
        ) : null}
        {item.completed_date ? (
          <QueueDetailField
            label="Completed Date"
            value={formatUploadQueueDate(item.completed_date)}
          />
        ) : null}
        <QueueDetailField
          label="Duration"
          value={calculateUploadQueueDuration(item.process_date, item.completed_date)}
        />
        {item.user_email ? (
          <QueueDetailField label="Uploaded By" value={item.user_email} />
        ) : null}
        {item.source ? (
          <QueueDetailField label="Source" value={item.source} />
        ) : null}
      </div>

      {item.progress !== undefined ? (
        <ApplicantImportQueueProgress progress={item.progress} />
      ) : null}

      {item.processed_applicants !== undefined &&
      item.total_applicants !== undefined ? (
        <div>
          <Label className="text-sm font-medium">Applicants Processed</Label>
          <p className="text-sm">
            {item.processed_applicants} of {item.total_applicants} applicants
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ApplicantImportQueueProgress({ progress }: { progress: number }) {
  return (
    <div>
      <Label className="text-sm font-medium">Progress</Label>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{progress}% complete</p>
    </div>
  );
}

export function ApplicantImportQueueWebhookTab({ item }: { item: QueueItem }) {
  if (!item.webhook_payload) {
    return (
      <p className="text-sm text-muted-foreground">
        No webhook payload available.
      </p>
    );
  }

  return (
    <ExpandablePayload
      data={item.webhook_payload}
      title="Webhook Payload"
      maxHeight="max-h-40"
      compact={true}
    />
  );
}

export function ApplicantImportQueueErrorTab({ item }: { item: QueueItem }) {
  if (!item.error) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm font-medium text-red-700">Error</Label>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-red-700">
        {item.error}
      </p>
      {item.error_details ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-red-600">
            View Error Details
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-red-50 p-2 text-xs text-red-700">
            {item.error_details}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
