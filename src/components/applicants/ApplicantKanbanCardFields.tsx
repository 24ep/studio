"use client";

import type { ReactNode } from 'react';
import {
  CalendarIcon as Calendar,
  EnvelopeIcon as Mail,
  PhoneIcon as Phone,
  UserIcon as User,
} from '@heroicons/react/24/outline';

import type { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatScoreWithGrade, getScoreBgColor, normalizeFitScore } from '@/lib/scoreUtils';

import { getFieldLabel } from './applicant-kanban-utils';

export function ApplicantFitScoreField({
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

export function ApplicantContactFields({
  applicant,
  visibleFields,
}: {
  applicant: Applicant;
  visibleFields: string[];
}) {
  const hasContactFields = ['email', 'phone', 'applicationDate', 'recruiterId']
    .some((field) => visibleFields.includes(field));
  if (!hasContactFields) return null;

  return (
    <div className="space-y-1">
      {visibleFields.includes('email') && applicant.email && (
        <ApplicantFieldRow icon={<Mail className="w-3 h-3 mr-1" />}>
          <span className="truncate">{applicant.email}</span>
        </ApplicantFieldRow>
      )}
      {visibleFields.includes('phone') && applicant.phone && (
        <ApplicantFieldRow icon={<Phone className="w-3 h-3 mr-1" />}>
          <span className="truncate">{applicant.phone}</span>
        </ApplicantFieldRow>
      )}
      {visibleFields.includes('applicationDate') && applicant.applicationDate && (
        <ApplicantFieldRow icon={<Calendar className="w-3 h-3 mr-1" />}>
          Applied: {new Date(applicant.applicationDate).toLocaleDateString()}
        </ApplicantFieldRow>
      )}
      {visibleFields.includes('recruiterId') && (
        <ApplicantFieldRow icon={<User className="w-3 h-3 mr-1" />}>
          <span>{applicant.recruiter?.name || applicant.recruiterId || 'Unassigned'}</span>
        </ApplicantFieldRow>
      )}
    </div>
  );
}

export function ApplicantFieldRow({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}
