import type { DropResult } from '@hello-pangea/dnd';

import type { RecruitmentStage } from '@/lib/types';

export interface RecruitmentStageFormValues {
  name: string;
  description?: string | null;
  sort_order?: number;
  color_complete?: string | null;
  color_badge?: string | null;
}

export interface RecruitmentStagesPageViewProps {
  showLogoOnly: boolean;
  stages: RecruitmentStage[];
  isLoading: boolean;
  fetchError: string | null;
  isModalOpen: boolean;
  editingStage: RecruitmentStage | null;
  stageToDelete: RecruitmentStage | null;
  isReplacementModalOpen: boolean;
  replacementStageName: string;
  onOpenModal: (stage?: RecruitmentStage) => void;
  onCloseModal: () => void;
  onSubmitStage: (data: RecruitmentStageFormValues) => Promise<void>;
  onAttemptDelete: (stage: RecruitmentStage) => Promise<void>;
  onDragEnd: (result: DropResult) => Promise<void>;
  onReplacementOpenChange: (open: boolean) => void;
  onReplacementStageNameChange: (stageName: string) => void;
  onConfirmDeleteWithReplacement: () => Promise<void>;
}

export type RecruitmentStagesHeaderProps = Pick<
  RecruitmentStagesPageViewProps,
  'showLogoOnly' | 'onOpenModal'
>;

export type RecruitmentStagesListProps = Pick<
  RecruitmentStagesPageViewProps,
  'stages' | 'isLoading' | 'fetchError' | 'onOpenModal' | 'onAttemptDelete' | 'onDragEnd'
>;

export type ReplacementStageDialogProps = Pick<
  RecruitmentStagesPageViewProps,
  | 'stages'
  | 'stageToDelete'
  | 'isReplacementModalOpen'
  | 'replacementStageName'
  | 'onReplacementOpenChange'
  | 'onReplacementStageNameChange'
  | 'onConfirmDeleteWithReplacement'
>;
