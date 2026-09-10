"use client";

import { FlagIcon as Target } from '@heroicons/react/24/outline';
import { Pin as PinIcon } from 'lucide-react';

import { ApplicantAvatar } from '@/components/ui/applicant-avatar';
import type { Applicant } from '@/lib/types';
import { formatApplicantNameWithLang } from '@/lib/applicantUtils';
import { cn } from '@/lib/utils';

import { BlacklistBadge } from './BlacklistBadge';

export function ApplicantCardHeader({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  const nameInfo = formatApplicantNameWithLang(applicant);

  return (
    <div className="flex items-start gap-3">
      <ApplicantAvatar
        user={applicant}
        size="md"
        className="h-10 w-10 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate flex items-center gap-1',
            nameInfo.fontClass,
            applicant.isBlacklisted ? 'text-destructive' : 'text-foreground'
          )}
          title={nameInfo.name}
          lang={nameInfo.lang}
        >
          {nameInfo.name}
          {applicant.isPinned && <PinIcon className="h-3 w-3 text-amber-500 fill-current flex-shrink-0 ml-1" />}
          {applicant.isBlacklisted && <BlacklistBadge className="px-1.5 py-0" iconClassName="h-2.5 w-2.5" />}
        </p>
        {visibleFields.includes('positionId') && (
          <p className="text-xs text-muted-foreground truncate mt-1" title={applicant.position?.title || 'N/A'}>
            <Target className="w-3 h-3 inline mr-1" />
            {applicant.position?.title || 'N/A'}
          </p>
        )}
      </div>
    </div>
  );
}
