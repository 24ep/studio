"use client";

import React from 'react';
import { ApplicantAvatar } from '@/components/ui/applicant-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRightIcon as ChevronRight, BriefcaseIcon as Briefcase, NoSymbolIcon as Ban } from '@heroicons/react/24/outline';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatApplicantNameWithLang } from '@/lib/applicantUtils';
import { BlacklistBadge } from './BlacklistBadge';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import { ScoreBadge } from '@/components/ui/score-color';
import { StatusBadge } from './applicant-kanban-utils';
import type { Applicant, Position } from '@/lib/types';

interface ApplicantsMobileListViewProps {
  applicants: Applicant[];
  selectedApplicantIds: Set<string>;
  onToggleSelectApplicant: (applicantId: string) => void;
  onApplicantClick: (applicant: Applicant, event: React.MouseEvent) => void;
  stageNames?: Record<string, string>;
  stageColors?: Record<string, string>;
  baseIndex?: number;
  allDbPositions?: Pick<Position, 'id' | 'title'>[];
}

export function ApplicantsMobileListView({
  applicants,
  selectedApplicantIds,
  onToggleSelectApplicant,
  onApplicantClick,
  stageNames = {},
  stageColors = {},
  baseIndex = 0,
  allDbPositions = [],
}: ApplicantsMobileListViewProps) {
  const renderApplicantListItem = (applicant: Applicant, index: number) => {
    const nameInfo = formatApplicantNameWithLang(applicant);
    const fitScoreValue = applicant.fitScore;
    const appliedPosition = allDbPositions.find(p => p.id === applicant.positionId);

    const isUnread = applicant.isRead !== true;

    return (
      <div
        key={applicant.id}
        className={cn(
          "flex items-center gap-2 px-3 py-4 transition-all duration-150 cursor-pointer border-b border-border/50",
          applicant.isBlacklisted 
            ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20" 
            : applicant.isPinned 
              ? "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
              : isUnread 
                ? "border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10" 
                : "bg-background active:bg-muted/70"
        )}
        onClick={(e) => onApplicantClick(applicant, e)}
       role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
        {/* Checkbox - Hidden on mobile */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-1 -m-1 touch-manipulation hidden"
         role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
          <Checkbox
            checked={selectedApplicantIds.has(applicant.id)}
            onCheckedChange={() => onToggleSelectApplicant(applicant.id)}
            aria-label={`Select applicant ${applicant.name}`}
            className="h-4 w-4"
          />
        </div>

        {/* Avatar - Smaller */}
        <ApplicantAvatar
          user={{
            id: applicant.id,
            name: applicant.name || '',
            avatarUrl: applicant.avatarUrl,
            email: applicant.email,
          }}
          size="sm"
          className="h-8 w-8 flex-shrink-0"
        />

        {/* Main Content - Left side: Name and Position */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className={cn(
              "font-semibold text-xs leading-tight truncate", 
              nameInfo.fontClass,
              applicant.isBlacklisted ? "text-destructive" :
              applicant.isPinned ? "text-amber-600 dark:text-amber-500" :
              isUnread ? "text-blue-600 dark:text-blue-400 font-bold" : "text-foreground"
            )} lang={nameInfo.lang}>
              {nameInfo.name}
              {applicant.isBlacklisted && <Ban className="inline-block ml-1 h-2.5 w-2.5 text-destructive" />}
            </h3>
            {applicant.isPinned && (
              <Pin className="h-3 w-3 text-amber-500 fill-current rotate-45 flex-shrink-0" />
            )}
          </div>

          {appliedPosition ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate leading-tight">
              <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{appliedPosition.title}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground truncate leading-tight">No position</p>
          )}
          {applicant.email && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5 opacity-80" title={applicant.email}>
              {applicant.email}
            </div>
          )}
        </div>

        {/* Status - Right side - Compact */}
        <div className="flex-shrink-0">
          {applicant.isBlacklisted ? (
            <BlacklistBadge className="px-1.5 py-0.5 text-[9px]" iconClassName="h-2 w-2" />
          ) : (
            <StatusBadge
              statusId={applicant.statusId}
              status={applicant.status}
              className="text-[10px] px-1.5 py-0.5"
              stageNames={stageNames}
              stageColors={stageColors}
            />
          )}
        </div>

        {/* Chevron - Compact touch target */}
        <div className="p-1 -m-1 flex-shrink-0">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {applicants.map((applicant, index) => renderApplicantListItem(applicant, baseIndex + index))}
    </div>
  );
}
