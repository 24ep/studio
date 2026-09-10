import type { RecruitmentStage, TransitionRecord } from '@/lib/types';

export interface StageDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stage: RecruitmentStage;
  records: TransitionRecord[];
  editableNotes: boolean;
  onNoteEdit: (transitionId: string, newNote: string) => Promise<void>;
  onTimestampEdit: (transitionId: string, newDate: string) => Promise<void>;
  isUpdating: Set<string>;
}

export interface StageDetailEditState {
  editingRecord: string | null;
  editNote: string;
  editDate: string;
}
