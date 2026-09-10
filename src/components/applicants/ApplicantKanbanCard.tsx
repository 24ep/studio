"use client";

import { Card } from '@/components/ui/card';
import type { Applicant, UserProfile } from '@/lib/types';
import { getApplicantPersonalColor } from '@/lib/personalColorUtils';
import { cn } from '@/lib/utils';

import {
  ApplicantCardHeader,
  ApplicantCardStatusIndicator,
  ApplicantContactFields,
  ApplicantEducationSummaryList,
  ApplicantExperienceSummaryList,
  ApplicantFitScoreField,
  ApplicantSkillsSummary,
  InvalidApplicantCard,
} from './ApplicantKanbanCardParts';
import { getEducation, getExperience, getSkills } from './applicant-kanban-utils';
import { useApplicantKanbanCardDrag } from './use-applicant-kanban-card-drag';

interface ApplicantKanbanCardProps {
  applicant: Applicant;
  isDragged?: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  visibleFields?: string[];
  columnField?: string;
  recruiters?: UserProfile[];
}

export function ApplicantKanbanCard({
  applicant,
  isDragged = false,
  onClick,
  onDragStart,
  onDragEnd,
  visibleFields = ['name', 'email', 'status', 'fitScore'],
  columnField = 'status',
  recruiters,
}: ApplicantKanbanCardProps) {
  const canDrag = columnField === 'status';
  const isUnread = applicant?.isRead !== true;
  const {
    handleDragEnd,
    handleDragStart,
    isDragStarting,
  } = useApplicantKanbanCardDrag({ applicant, onDragEnd, onDragStart });

  if (!applicant?.id) {
    return <InvalidApplicantCard />;
  }

  const personalColor = getApplicantPersonalColor(applicant, recruiters);

  return (
    <Card
      className={getCardClassName({
        applicant,
        canDrag,
        isDragged,
        isDragStarting,
        isUnread,
      })}
      style={getCardStyle({ applicant, isUnread, personalColor })}
      onClick={onClick}
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragEnd={canDrag ? handleDragEnd : undefined}
    >
      <ApplicantCardStatusIndicator applicant={applicant} isUnread={isUnread} />

      {visibleFields.includes('name') && (
        <ApplicantCardHeader applicant={applicant} visibleFields={visibleFields} />
      )}

      <div className="space-y-2">
        <ApplicantFitScoreField applicant={applicant} visibleFields={visibleFields} />
        <ApplicantContactFields applicant={applicant} visibleFields={visibleFields} />
        <ApplicantEducationSummaryList education={getEducation(applicant)} visibleFields={visibleFields} />
        <ApplicantExperienceSummaryList experience={getExperience(applicant)} visibleFields={visibleFields} />
        <ApplicantSkillsSummary skills={getSkills(applicant)} visibleFields={visibleFields} />
      </div>
    </Card>
  );
}

function getCardClassName({
  applicant,
  canDrag,
  isDragged,
  isDragStarting,
  isUnread,
}: {
  applicant: Applicant;
  canDrag: boolean;
  isDragged: boolean;
  isDragStarting: boolean;
  isUnread: boolean;
}) {
  return cn(
    'w-full p-4 hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative',
    canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
    isDragged && 'opacity-60 scale-95 shadow-lg',
    isDragStarting && 'scale-105 shadow-xl',
    applicant.isBlacklisted
      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
      : applicant.isPinned
        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm'
        : isUnread
          ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/30'
          : 'bg-card border-border'
  );
}

function getCardStyle({
  applicant,
  isUnread,
  personalColor,
}: {
  applicant: Applicant;
  isUnread: boolean;
  personalColor: string;
}) {
  const usesPersonalColor = !applicant.isBlacklisted && !applicant.isPinned && !isUnread;

  return {
    borderColor: usesPersonalColor ? personalColor : undefined,
    backgroundColor: usesPersonalColor ? `${personalColor}05` : undefined,
  };
}
