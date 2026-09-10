import type { Applicant, ApplicantStatus, UserProfile } from '@/lib/types';

export interface ApplicantKanbanViewProps {
  applicants: Applicant[];
  statuses: ApplicantStatus[];
  recruiters?: UserProfile[];
  onMoveApplicant?: (applicant: Applicant, newValue: string) => void;
  onCardClick?: (applicant: Applicant) => void;
  showAddButton?: boolean;
  rowField?: string;
  columnField?: string;
  visibleFields?: string[];
  visibleRowValues?: string[];
  visibleColumnValues?: string[];
  isLoading?: boolean;
}
