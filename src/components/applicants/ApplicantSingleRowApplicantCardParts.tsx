"use client";

import type { ReactNode } from 'react';
import type { Applicant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon as Calendar,
  EyeIcon as Eye,
  EnvelopeIcon as Mail,
  PencilIcon as Pencil,
  PhoneIcon as Phone,
  FlagIcon as Target,
  UserIcon as User,
} from '@heroicons/react/24/outline';
import { formatApplicantName } from '@/lib/applicantUtils';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import { formatScoreWithGrade, getScoreBgColor, normalizeFitScore } from '@/lib/scoreUtils';
import { cn } from '@/lib/utils';
import { StatusBadge, getFieldLabel } from './applicant-kanban-utils';
import { getSingleRowApplicantInitial } from './applicant-single-row-view-utils';

export function SingleRowApplicantAvatar({ applicant }: { applicant: Applicant }) {
  const applicantName = formatApplicantName(applicant);
  const fallbackInitial = getSingleRowApplicantInitial(applicantName);

  return (
    <Avatar className="h-10 w-10 flex-shrink-0">
      <AvatarImage
        src={applicant.avatarUrl ? convertMinIOUrlToSecureUrl(applicant.avatarUrl) || undefined : `https://placehold.co/40x40.png?text=${fallbackInitial}`}
        alt={applicantName}
      />
      <AvatarFallback className="bg-primary/10 text-primary">
        {fallbackInitial}
      </AvatarFallback>
    </Avatar>
  );
}

export function SingleRowApplicantHeader({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  const applicantName = formatApplicantName(applicant);

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground truncate" title={applicantName}>
          {applicantName}
        </p>
        {visibleFields.includes('positionId') && (
          <p className="text-xs text-muted-foreground truncate" title={applicant.position?.title || 'N/A'}>
            <Target className="w-3 h-3 inline mr-1" />
            {applicant.position?.title || 'N/A'}
          </p>
        )}
      </div>
      <StatusBadge statusId={applicant.statusId} className="text-xs px-2 py-1 flex-shrink-0" />
    </div>
  );
}

export function SingleRowApplicantFields({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  return (
    <div className="space-y-1">
      {visibleFields.includes('email') && applicant.email && (
        <ApplicantMetadataLine icon={<Mail className="w-3 h-3 mr-1 flex-shrink-0" />}>
          {applicant.email}
        </ApplicantMetadataLine>
      )}
      {visibleFields.includes('phone') && applicant.phone && (
        <ApplicantMetadataLine icon={<Phone className="w-3 h-3 mr-1 flex-shrink-0" />}>
          {applicant.phone}
        </ApplicantMetadataLine>
      )}
      {visibleFields.includes('applicationDate') && applicant.applicationDate && (
        <ApplicantMetadataLine icon={<Calendar className="w-3 h-3 mr-1 flex-shrink-0" />}>
          Applied: {new Date(applicant.applicationDate).toLocaleDateString()}
        </ApplicantMetadataLine>
      )}
      {visibleFields.includes('recruiterId') && (
        <ApplicantMetadataLine icon={<User className="w-3 h-3 mr-1 flex-shrink-0" />}>
          {applicant.recruiter?.name || applicant.recruiterId || 'Unassigned'}
        </ApplicantMetadataLine>
      )}
    </div>
  );
}

export function SingleRowApplicantFitScore({
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
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{getFieldLabel('fitScore')}</span>
        <span className="font-medium text-foreground">
          {formatScoreWithGrade(applicant.fitScore)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', getScoreBgColor(applicant.fitScore))}
          style={{ width: `${normalizeFitScore(applicant.fitScore)}%` }}
        />
      </div>
    </div>
  );
}

export function SingleRowApplicantActions({
  applicant,
  onCardClick,
}: {
  applicant: Applicant;
  onCardClick?: (applicant: Applicant) => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Button
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onCardClick?.(applicant);
        }}
        className="flex items-center gap-1 h-7 px-2 text-xs"
      >
        <Eye className="w-3 h-3" />
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
        }}
        className="flex items-center gap-1 h-7 px-2 text-xs"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </Button>
    </div>
  );
}

function ApplicantMetadataLine({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}
