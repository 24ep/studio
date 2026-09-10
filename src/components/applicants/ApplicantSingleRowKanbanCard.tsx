"use client";

import type { Applicant } from '@/lib/types';
import {
  CalendarIcon as Calendar,
  EnvelopeIcon as Mail,
  EyeIcon as Eye,
  FlagIcon as Target,
  PhoneIcon as Phone,
  UserIcon as User,
} from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatApplicantName } from '@/lib/applicantUtils';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import { formatScoreWithGrade, getScoreBgColor, normalizeFitScore } from '@/lib/scoreUtils';
import { cn } from '@/lib/utils';
import { StatusBadge, getFieldLabel } from './applicant-kanban-utils';

export function SingleRowKanbanApplicantCard({
  applicant,
  onCardClick,
  visibleFields,
}: {
  applicant: Applicant;
  onCardClick: (applicant: Applicant) => void;
  visibleFields: string[];
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-start gap-6">
        <ApplicantAvatar applicant={applicant} />
        <div className="flex-1 min-w-0">
          <SingleRowKanbanApplicantHeader applicant={applicant} />
          <SingleRowKanbanApplicantFields applicant={applicant} visibleFields={visibleFields} />
          <SingleRowKanbanFitScore applicant={applicant} visibleFields={visibleFields} />
          <SingleRowKanbanActions applicant={applicant} onCardClick={onCardClick} />
        </div>
      </div>
    </div>
  );
}

function ApplicantAvatar({ applicant }: { applicant: Applicant }) {
  const applicantName = formatApplicantName(applicant);
  const fallbackInitial = applicantName?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div className="flex-shrink-0">
      <Avatar className="h-16 w-16">
        <AvatarImage
          src={applicant.avatarUrl ? convertMinIOUrlToSecureUrl(applicant.avatarUrl) || undefined : `https://placehold.co/64x64.png?text=${fallbackInitial}`}
          alt={applicantName}
        />
        <AvatarFallback className="bg-primary/10 text-primary text-base">
          {fallbackInitial}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function SingleRowKanbanApplicantHeader({ applicant }: { applicant: Applicant }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">
          {formatApplicantName(applicant)}
        </h3>
        <p className="text-muted-foreground">
          <Target className="w-4 h-4 inline mr-2" />
          {applicant.position?.title || 'No position assigned'}
        </p>
      </div>

      <StatusBadge status={applicant.status} className="text-sm px-3 py-1" />
    </div>
  );
}

function SingleRowKanbanApplicantFields({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {visibleFields.includes('email') && applicant.email && (
        <KanbanField icon={<Mail className="w-4 h-4 mr-2 text-muted-foreground" />}>
          {applicant.email}
        </KanbanField>
      )}
      {visibleFields.includes('phone') && applicant.phone && (
        <KanbanField icon={<Phone className="w-4 h-4 mr-2 text-muted-foreground" />}>
          {applicant.phone}
        </KanbanField>
      )}
      {visibleFields.includes('applicationDate') && applicant.applicationDate && (
        <KanbanField icon={<Calendar className="w-4 h-4 mr-2 text-muted-foreground" />}>
          Applied: {new Date(applicant.applicationDate).toLocaleDateString()}
        </KanbanField>
      )}
      {visibleFields.includes('recruiterId') && (
        <KanbanField icon={<User className="w-4 h-4 mr-2 text-muted-foreground" />}>
          {applicant.recruiter?.name || applicant.recruiterId || 'Unassigned'}
        </KanbanField>
      )}
    </div>
  );
}

function SingleRowKanbanFitScore({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  if (!visibleFields.includes('fitScore') || applicant.fitScore === undefined || applicant.fitScore === null) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{getFieldLabel('fitScore')}</span>
        <span className="text-sm font-semibold text-foreground">
          {formatScoreWithGrade(applicant.fitScore)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={cn('h-3 rounded-full transition-all duration-300', getScoreBgColor(applicant.fitScore))}
          style={{ width: `${normalizeFitScore(applicant.fitScore)}%` }}
        />
      </div>
    </div>
  );
}

function SingleRowKanbanActions({
  applicant,
  onCardClick,
}: {
  applicant: Applicant;
  onCardClick: (applicant: Applicant) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => onCardClick(applicant)}
        className="flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        View Details
      </Button>
    </div>
  );
}

function KanbanField({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center text-sm">
      {icon}
      <span className="text-foreground">{children}</span>
    </div>
  );
}
