"use client";

import {
  PhotoIcon as ImageIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import {
  getUploadQueueStatusBadgeVariant,
  getUploadQueueStatusDisplayText,
} from './applicant-import-queue-utils';
import type { QueueItem } from './applicant-import-queue-types';

export function ApplicantImportQueueSourceCell({ item }: { item: QueueItem }) {
  return (
    <div className="flex items-center gap-2">
      {item.source_logo ? (
        <img
          src={convertMinIOUrlToSecureUrl(item.source_logo) || item.source_logo}
          alt={`${item.source_name} logo`}
          className="h-5 w-5 object-contain rounded-full flex-shrink-0"
        />
      ) : (
        <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">
          {item.source_name || '-'}
        </div>
        {item.sub_source && (
          <div className="text-xs text-muted-foreground">
            {item.sub_source}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicantImportQueueStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={getUploadQueueStatusBadgeVariant(status)}
      className={cn(
        "rounded-full border-0 px-2.5 font-medium",
        status === 'queued' && "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
        status === 'inprocess' && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        status === 'success' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        status === 'failed' && "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      )}
    >
      {getUploadQueueStatusDisplayText(status)}
    </Badge>
  );
}
