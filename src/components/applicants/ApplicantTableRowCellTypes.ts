import type { Applicant, ApplicantSource } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';

export interface ApplicantTableRowColumnCellProps {
  applicant: Applicant;
  availableRecruiter: { id: string; name: string }[];
  availableSources: ApplicantSource[];
  assigningRecruiter: string | null;
  assigningSource: string | null;
  canAssignSource: boolean;
  canEditApplicants: boolean;
  columnKey: string;
  isJobMatchEnabled: boolean;
  isUnread: boolean;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => void;
  onOpenDetail: (applicantId: string, applicantName: string) => void;
  onResetAssigning: () => void;
  onTogglePin: () => void;
  settings?: ApplicantSettings;
  stageColors: Record<string, string>;
  stageNames: Record<string, string>;
  togglePin: (applicant: Applicant) => void;
}
