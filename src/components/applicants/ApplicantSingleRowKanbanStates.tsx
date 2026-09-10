"use client";

import type { Applicant } from '@/lib/types';
import { UsersIcon as Users } from '@heroicons/react/24/outline';
import FullApplicantDetail from './FullApplicantDetail';

export function SingleRowKanbanLoadingState() {
  return (
    <div className="w-full min-h-[300px] bg-muted/30 rounded-lg p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center animate-pulse">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">Loading applicants...</p>
      </div>
    </div>
  );
}

export function SingleRowKanbanEmptyState({
  applicantCount,
  columnField,
  rowField,
  visibleColumnValues,
  visibleRowValues,
}: {
  applicantCount: number;
  columnField: string;
  rowField: string;
  visibleColumnValues: string[];
  visibleRowValues: string[];
}) {
  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No applicants found</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {applicantCount > 0
            ? 'No applicants match the current board configuration. Try adjusting your board settings or resetting to default.'
            : 'No applicants available. Please add some applicants first.'}
        </p>
        {applicantCount > 0 && (
          <div className="text-xs text-muted-foreground">
            <p>Current configuration:</p>
            <p>Row: {rowField} | Column: {columnField}</p>
            <p>Visible rows: {visibleRowValues.length > 0 ? visibleRowValues.join(', ') : 'All'}</p>
            <p>Visible columns: {visibleColumnValues.length > 0 ? visibleColumnValues.join(', ') : 'All'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SingleRowKanbanDetailModal({
  applicantSummary,
  isOpen,
  onClose,
}: {
  applicantSummary: (Partial<Applicant> & { id: string; name: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !applicantSummary) {
    return null;
  }

  return (
    <FullApplicantDetail
      applicantId={applicantSummary.id}
      isModal={true}
      onClose={onClose}
      comments={[]}
      resumes={[]}
      onRefresh={() => {}}
    />
  );
}
