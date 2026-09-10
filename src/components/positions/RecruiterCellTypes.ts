export interface RecruiterCellPosition {
  id: string;
  recruiterId?: string | null;
  recruiterName?: string | null;
}

export interface AvailableRecruiter {
  id: string;
  name: string;
  avatarUrl?: string;
  personalColor?: string;
  vacantHeadcount?: number;
}

export interface RecruiterCellProps {
  position: RecruiterCellPosition;
  availableRecruiter: AvailableRecruiter[];
  canManagePositions: boolean;
  isAssigning: boolean;
  onAssignRecruiter: (positionId: string, recruiterId: string | null) => Promise<void>;
  onResetAssigning?: () => void;
}
