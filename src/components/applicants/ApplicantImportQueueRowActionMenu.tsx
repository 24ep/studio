"use client";

import {
  ArrowUturnLeftIcon as RotateCcw,
  DocumentTextIcon as FileText,
  EllipsisHorizontalIcon as MoreHorizontal,
  EyeIcon as Eye,
  TrashIcon as Trash2,
  UserCircleIcon as UserCircle,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { QueueItem } from './applicant-import-queue-types';
import type { ApplicantImportQueueRowActions } from './ApplicantImportQueueTableBodyTypes';

export function ApplicantImportQueueRowActionMenu({
  item,
  onDeleteItem,
  onPreviewFile,
  onRetryItem,
  onShowDetails,
}: Omit<ApplicantImportQueueRowActions, 'onSelectItem'> & { item: QueueItem }) {
  const router = useRouter();
  const viewApplicant = () => {
    if (item.applicant_id) {
      router.push(`/applicants/${item.applicant_id}`);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {item.applicant_id ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={viewApplicant}
          className="h-7 w-7 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200"
          title={`View Applicant${item.applicant_name ? `: ${item.applicant_name}` : ''}`}
        >
          <UserCircle className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPreviewFile(item)}
        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
        title="Preview File"
      >
        <FileText className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-muted/50 transition-colors duration-200"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {item.applicant_id ? (
            <DropdownMenuItem
              onSelect={viewApplicant}
              className="text-sm py-2"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              View Applicant
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onSelect={() => onShowDetails(item)}
            className="text-sm py-2"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onPreviewFile(item)}
            className="text-sm py-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Preview File
          </DropdownMenuItem>
          {['failed', 'success'].includes(item.status) && (
            <DropdownMenuItem
              onSelect={() => onRetryItem(item.id)}
              className="text-sm py-2"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => onDeleteItem(item.id)}
            className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive text-sm py-2"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
