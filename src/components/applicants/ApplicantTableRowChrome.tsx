"use client";

import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  EllipsisHorizontalIcon as MoreHorizontal,
  TrashIcon as Trash2,
  EyeIcon as Eye,
  EnvelopeIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import { Pin as PinIcon, PinOff } from 'lucide-react';
import type { Applicant } from '@/lib/types';

interface ApplicantTableSelectCellsProps {
  applicant: Applicant;
  rowNumber: number;
  selectedApplicantIds: Set<string>;
  onToggleSelectApplicant: (applicantId: string) => void;
}

export function ApplicantTableSelectCells({
  applicant,
  rowNumber,
  selectedApplicantIds,
  onToggleSelectApplicant,
}: ApplicantTableSelectCellsProps) {
  return (
    <>
      <TableCell key={`${applicant.id}-row-number`} className="text-center text-muted-foreground">
        {rowNumber}
      </TableCell>
      <TableCell key={`${applicant.id}-select`} className="text-center">
        <Checkbox
          checked={selectedApplicantIds.has(applicant.id)}
          onCheckedChange={() => onToggleSelectApplicant(applicant.id)}
          aria-label={`Select applicant ${applicant.name}`}
        />
      </TableCell>
    </>
  );
}

interface ApplicantTableActionsCellProps {
  applicant: Applicant;
  canViewDetailed: boolean;
  canDeleteApplicants: boolean;
  onOpenDetail: (applicantId: string, applicantName: string) => void;
  onTogglePin: (applicant: Applicant) => void;
  onToggleRead: (applicant: Applicant) => void;
  onDelete: (applicant: Applicant) => void;
}

export function ApplicantTableActionsCell({
  applicant,
  canViewDetailed,
  canDeleteApplicants,
  onOpenDetail,
  onTogglePin,
  onToggleRead,
  onDelete,
}: ApplicantTableActionsCellProps) {
  return (
    <TableCell key={`${applicant.id}-actions`} className="text-right max-w-[100px]">
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canViewDetailed && (
              <DropdownMenuItem
                key="view-detail"
                onSelect={() => onOpenDetail(applicant.id, applicant.name)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              key="pin-toggle"
              onSelect={() => onTogglePin(applicant)}
            >
              {applicant.isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4 text-blue-600 fill-current" />
                  Unpin from top
                </>
              ) : (
                <>
                  <PinIcon className="mr-2 h-4 w-4 text-foreground" />
                  Pin to top (shared)
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              key="read-toggle"
              onSelect={() => onToggleRead(applicant)}
            >
              {applicant.isRead === false ? (
                <>
                  <EnvelopeOpenIcon className="mr-2 h-4 w-4 text-foreground" />
                  Mark as Read
                </>
              ) : (
                <>
                  <EnvelopeIcon className="mr-2 h-4 w-4 text-blue-600" />
                  Mark as Unread
                </>
              )}
            </DropdownMenuItem>
            {canDeleteApplicants && (
              <DropdownMenuItem
                key="delete"
                onSelect={() => onDelete(applicant)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  );
}
