"use client";

import type { Applicant } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PlusIcon as Plus,
  ChevronLeftIcon as ChevronRight,
  ChevronRightIcon as ChevronLeft,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  getSingleRowApplicantCountLabel,
  shouldShowSingleRowScrollHint,
} from './applicant-single-row-view-utils';
import {
  SingleRowApplicantActions,
  SingleRowApplicantAvatar,
  SingleRowApplicantFields,
  SingleRowApplicantFitScore,
  SingleRowApplicantHeader,
} from './ApplicantSingleRowApplicantCardParts';

interface SingleRowApplicantCardProps {
  applicant: Applicant;
  isMobile: boolean;
  onCardClick?: (applicant: Applicant) => void;
  visibleFields: string[];
}

export function SingleRowApplicantEmptyState() {
  return (
    <div className="flex items-center justify-center w-full py-8">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No applicants</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Drag applicants here</p>
      </div>
    </div>
  );
}

export function SingleRowApplicantScrollButton({
  direction,
  onScroll,
}: {
  direction: 'previous' | 'next';
  onScroll: () => void;
}) {
  const isPrevious = direction === 'previous';
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        'absolute top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200',
        isPrevious ? 'left-2' : 'right-2'
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onScroll();
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function SingleRowApplicantCard({
  applicant,
  isMobile,
  onCardClick,
  visibleFields,
}: SingleRowApplicantCardProps) {
  return (
    <Card
      className={cn(
        'flex-shrink-0 w-[calc(100vw-5rem)] md:w-80 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card',
        !isMobile && 'border',
        isMobile && 'border-0'
      )}
      style={{ scrollSnapAlign: 'start' }}
      onClick={() => onCardClick?.(applicant)}
    >
      <div className="flex items-start gap-3">
        <SingleRowApplicantAvatar applicant={applicant} />

        <div className="flex-1 min-w-0 space-y-2">
          <SingleRowApplicantHeader applicant={applicant} visibleFields={visibleFields} />
          <SingleRowApplicantFields applicant={applicant} visibleFields={visibleFields} />
          <SingleRowApplicantFitScore applicant={applicant} visibleFields={visibleFields} />
          <SingleRowApplicantActions applicant={applicant} onCardClick={onCardClick} />
        </div>
      </div>
    </Card>
  );
}

export function SingleRowApplicantCountBadge({ count }: { count: number }) {
  return (
    <div className="flex justify-center mt-2">
      <Badge variant="secondary" className="text-xs">
        {getSingleRowApplicantCountLabel(count)}
        {shouldShowSingleRowScrollHint(count) && (
          <span className="ml-1 text-blue-600">Scroll</span>
        )}
      </Badge>
    </div>
  );
}
