"use client";

import type { Applicant, UserProfile } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SingleRowApplicantCard,
  SingleRowApplicantCountBadge,
  SingleRowApplicantEmptyState,
  SingleRowApplicantScrollButton,
} from './ApplicantSingleRowApplicantViewParts';
import {
  SINGLE_ROW_APPLICANT_CONTAINER_CLASS,
  SINGLE_ROW_APPLICANT_SCROLL_STEP,
} from './applicant-single-row-view-utils';

interface SingleRowApplicantViewProps {
  applicants: Applicant[];
  onCardClick?: (applicant: Applicant) => void;
  visibleFields?: string[];
  recruiters?: UserProfile[];
}

export function SingleRowApplicantView({
  applicants,
  onCardClick,
  visibleFields = ['name', 'email', 'status', 'fitScore'],
}: SingleRowApplicantViewProps) {
  const isMobile = useIsMobile();

  const scrollApplicants = (left: number) => {
    document
      .querySelector(`.${SINGLE_ROW_APPLICANT_CONTAINER_CLASS}`)
      ?.scrollBy({ left, behavior: 'smooth' });
  };

  if (applicants.length === 0) {
    return <SingleRowApplicantEmptyState />;
  }

  return (
    <div className="relative w-full">
      {applicants.length > 1 && (
        <SingleRowApplicantScrollButton
          direction="previous"
          onScroll={() => scrollApplicants(-SINGLE_ROW_APPLICANT_SCROLL_STEP)}
        />
      )}

      {applicants.length > 1 && (
        <SingleRowApplicantScrollButton
          direction="next"
          onScroll={() => scrollApplicants(SINGLE_ROW_APPLICANT_SCROLL_STEP)}
        />
      )}

      <div
        className={`flex flex-row overflow-x-auto gap-3 pb-2 ${SINGLE_ROW_APPLICANT_CONTAINER_CLASS} scrollbar-hide md:px-0 px-4 md:pr-0 pr-4`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
        {applicants.map((applicant, index) => (
          <SingleRowApplicantCard
            key={`applicant-${applicant.id}-${index}`}
            applicant={applicant}
            isMobile={isMobile}
            onCardClick={onCardClick}
            visibleFields={visibleFields}
          />
        ))}
      </div>

      {applicants.length > 1 && (
        <SingleRowApplicantCountBadge count={applicants.length} />
      )}
    </div>
  );
}
