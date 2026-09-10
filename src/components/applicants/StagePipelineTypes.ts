import type { RecruitmentStage, TransitionRecord } from "@/lib/types";

export interface StagePipelineProps {
  stages: RecruitmentStage[];
  transitionHistory: TransitionRecord[];
  currentStatus: string;
  onStageClick: (stageName: string) => void;
  editableNotes: boolean;
  onNoteEdit: (transitionId: string, newNote: string) => Promise<void>;
  applicantId: string;
}

export interface StagePipelineStageViewModel {
  stage: RecruitmentStage;
  index: number;
  records: TransitionRecord[];
  isCompleted: boolean;
  isCurrent: boolean;
  latestRecord: TransitionRecord | null;
}
