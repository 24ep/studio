import type { ApplicantSource } from '@/lib/types';

export interface ApplicantSourceCellApplicant {
  id: string;
  sourceId?: string | null;
  source?: ApplicantSource | null;
  subSource?: string | null;
}

export interface ApplicantSourceCellProps {
  applicant: ApplicantSourceCellApplicant;
  availableSources: ApplicantSource[];
  canManageApplicants: boolean;
  isAssigning: boolean;
  onAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => void;
  onResetAssigning?: () => void;
}
