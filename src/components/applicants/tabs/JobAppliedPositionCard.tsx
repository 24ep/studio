import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CompanyReference, Position } from '@/lib/types';
import type { UseFormRegister } from 'react-hook-form';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  getNonEmptyJobAppliedJustifications,
} from './job-applied-tab-utils';
import {
  JobAppliedCopyButton,
  JobAppliedEmptyState,
  JobAppliedJustifications,
  JobAppliedPositionHeader,
  JobAppliedSalaryRow,
} from './JobAppliedPositionCardParts';

interface JobAppliedPositionCardProps {
  appliedJobId: string | null;
  appliedPosition: Position | null;
  appliedFitScore: number | null;
  appliedJustification: string[];
  appliedJobBadge: React.ReactNode;
  copiedJobApplied: boolean;
  isEditing: boolean;
  company?: CompanyReference | null;
  orgLogoUrl?: string | null;
  expectedSalary?: number | null;
  register?: UseFormRegister<EditApplicantFormValues>;
  onCopyJobApplied: () => void;
  onOpenPositionDrawer: (positionId: string) => void;
  onEditSalary: () => void;
}

export function JobAppliedPositionCard({
  appliedJobId,
  appliedPosition,
  appliedFitScore,
  appliedJustification,
  appliedJobBadge,
  copiedJobApplied,
  isEditing,
  company,
  orgLogoUrl,
  expectedSalary,
  register,
  onCopyJobApplied,
  onOpenPositionDrawer,
  onEditSalary,
}: JobAppliedPositionCardProps) {
  const justifications = getNonEmptyJobAppliedJustifications(appliedJustification);

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        {appliedJobId ? (
          <div
            className="relative cursor-pointer text-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPositionDrawer(appliedJobId);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            <div className="absolute right-4 top-4 z-10">
              <JobAppliedCopyButton
                copiedJobApplied={copiedJobApplied}
                onCopyJobApplied={onCopyJobApplied}
              />
            </div>
            <JobAppliedPositionHeader
              appliedFitScore={appliedFitScore}
              appliedPosition={appliedPosition}
              company={company}
              orgLogoUrl={orgLogoUrl}
            />
            <div className="border-t border-border px-5 py-4 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <JobAppliedSalaryRow expectedSalary={expectedSalary} isEditing={isEditing} onEditSalary={onEditSalary} register={register} />
                {appliedJobBadge ? <div>{appliedJobBadge}</div> : null}
              </div>
              <JobAppliedJustifications justifications={justifications} />
            </div>
          </div>
        ) : (
          <JobAppliedEmptyState />
        )}
      </CardContent>
    </Card>
  );
}
