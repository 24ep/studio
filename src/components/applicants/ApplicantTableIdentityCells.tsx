"use client";

import { NoSymbolIcon as Ban, BriefcaseIcon as Briefcase } from '@heroicons/react/24/outline';
import { Pin as PinIcon } from 'lucide-react';

import { ApplicantAvatarCompact } from '@/components/ui/applicant-avatar';
import { TableCell } from '@/components/ui/table';
import { formatApplicantNameWithLang } from '@/lib/applicantUtils';
import { cn } from '@/lib/utils';
import type { Applicant } from '@/lib/types';
import { getApplicantParsedRecordField } from './applicant-parsed-data-utils';
import { isApplicantTableDetailIdValid } from './applicant-table-row-utils';

export function ApplicantIdentityCell({
  applicant,
  isUnread,
  onOpenDetail,
  togglePin,
}: {
  applicant: Applicant;
  isUnread: boolean;
  onOpenDetail: (applicantId: string, applicantName: string) => void;
  togglePin: (applicant: Applicant) => void;
}) {
  const nameInfo = formatApplicantNameWithLang(applicant);
  const isValidId = isApplicantTableDetailIdValid(applicant.id);

  return (
    <TableCell key={`${applicant.id}-applicant-info`} className="min-w-[200px] max-w-[300px]">
      <div className="flex items-center gap-3">
        <ApplicantAvatarCompact
          user={{ id: applicant.id, name: nameInfo.name, avatarUrl: applicant.avatarUrl, email: applicant.email }}
          size="md"
          shape="circle"
        />
        <div className="min-w-0 flex-1">
          {isValidId ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenDetail(applicant.id, applicant.name);
              }}
              className={cn(
                'hover:underline cursor-pointer truncate block text-left',
                nameInfo.fontClass,
                applicant.isBlacklisted
                  ? 'text-destructive'
                  : applicant.isPinned
                    ? 'text-amber-600 dark:text-amber-500'
                    : isUnread
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'font-medium text-foreground',
              )}
              lang={nameInfo.lang}
              title={nameInfo.name}
            >
              {nameInfo.name}
              {applicant.isPinned && <PinIcon className="inline-block ml-2 h-3.5 w-3.5 text-amber-500 fill-current align-text-top" />}
              {applicant.isBlacklisted && <Ban className="inline-block ml-2 h-3 w-3 text-destructive align-text-top" />}
            </button>
          ) : (
            <span className={`font-medium text-foreground ${nameInfo.fontClass}`} lang={nameInfo.lang}>{nameInfo.name}</span>
          )}
          <div className="text-xs text-muted-foreground truncate" title={applicant.email}>{applicant.email}</div>
        </div>
        <div className="flex-shrink-0 flex items-center justify-center sm:hidden">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              togglePin(applicant);
            }}
            className={`p-2 rounded-full ${applicant.isPinned ? 'text-blue-600' : 'text-muted-foreground'}`}
          >
            <PinIcon className="h-4 w-4 rotate-45" />
          </button>
        </div>
      </div>
    </TableCell>
  );
}

export function AppliedJobCell({ applicant }: { applicant: Applicant }) {
  const jobApplied = getApplicantParsedRecordField(applicant.parsedData, 'job_applied');
  const parsedJobTitle = typeof jobApplied.job_title === 'string' ? jobApplied.job_title : undefined;
  const jobTitle = parsedJobTitle || applicant.position?.title;

  return (
    <TableCell key={`${applicant.id}-position`} className="min-w-[120px] max-w-[200px]">
      {jobTitle ? (
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="font-medium text-foreground text-sm truncate" title={jobTitle}>{jobTitle}</div>
        </div>
      ) : applicant.positionId ? (
        <span className="text-warning-foreground bg-warning/20 px-2 py-1 rounded text-xs font-semibold">-</span>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      )}
    </TableCell>
  );
}
