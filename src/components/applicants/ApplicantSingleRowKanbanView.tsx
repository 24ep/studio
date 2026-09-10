"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Applicant, ApplicantStatus, UserProfile } from '@/lib/types';
import {
  SingleRowKanbanApplicantCard,
  SingleRowKanbanDetailModal,
  SingleRowKanbanEmptyState,
  SingleRowKanbanHeader,
  SingleRowKanbanLoadingState,
  SingleRowKanbanPaginationDots,
} from './ApplicantSingleRowKanbanParts';
import { formatApplicantName } from '@/lib/applicantUtils';
import {
  buildApplicantKanbanSummary,
  filterApplicantsForSingleRowKanban,
  getNextCarouselIndex,
  getPreviousCarouselIndex,
} from './applicant-kanban-layout-utils';

interface SingleRowKanbanViewProps {
  applicants: Applicant[];
  statuses: ApplicantStatus[];
  recruiters?: UserProfile[];
  onMoveApplicant?: (applicant: Applicant, newValue: string) => void;
  onCardClick?: (applicant: Applicant) => void;
  rowField?: string;
  columnField?: string;
  visibleFields?: string[];
  visibleRowValues?: string[];
  visibleColumnValues?: string[];
  isLoading?: boolean;
}

export function SingleRowKanbanView({
  applicants,
  onCardClick,
  rowField = 'status',
  columnField = 'recruiterId',
  visibleFields = ['name', 'email', 'status', 'fitScore'],
  visibleRowValues = [],
  visibleColumnValues = [],
  isLoading = false,
}: SingleRowKanbanViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicantSummary, setSelectedApplicantSummary] = useState<Partial<Applicant> & { id: string; name: string } | null>(null);

  const filteredApplicants = useMemo(() => {
    return filterApplicantsForSingleRowKanban({
      applicants,
      rowField,
      columnField,
      visibleRowValues,
      visibleColumnValues,
    });
  }, [applicants, rowField, columnField, visibleRowValues, visibleColumnValues]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredApplicants.length]);

  if (isLoading) {
    return <SingleRowKanbanLoadingState />;
  }

  const handleCardClick = (applicant: Applicant) => {
    if (onCardClick) {
      onCardClick(applicant);
      return;
    }

    setSelectedApplicantSummary(buildApplicantKanbanSummary(applicant, formatApplicantName));
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => getPreviousCarouselIndex(prev, filteredApplicants.length));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => getNextCarouselIndex(prev, filteredApplicants.length));
  };

  const currentApplicant = filteredApplicants[currentIndex];

  if (filteredApplicants.length === 0) {
    return (
      <SingleRowKanbanEmptyState
        applicantCount={applicants.length}
        columnField={columnField}
        rowField={rowField}
        visibleColumnValues={visibleColumnValues}
        visibleRowValues={visibleRowValues}
      />
    );
  }

  return (
    <>
      <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <SingleRowKanbanHeader
            currentIndex={currentIndex}
            totalCount={filteredApplicants.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />

          {currentApplicant && (
            <SingleRowKanbanApplicantCard
              applicant={currentApplicant}
              visibleFields={visibleFields}
              onCardClick={handleCardClick}
            />
          )}

          {filteredApplicants.length > 1 && (
            <SingleRowKanbanPaginationDots
              currentIndex={currentIndex}
              totalCount={filteredApplicants.length}
              onSelect={setCurrentIndex}
            />
          )}
        </div>
      </div>

      {!onCardClick && (
        <SingleRowKanbanDetailModal
          isOpen={isModalOpen}
          applicantSummary={selectedApplicantSummary}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApplicantSummary(null);
          }}
        />
      )}
    </>
  );
}
