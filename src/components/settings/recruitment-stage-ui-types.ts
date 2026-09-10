import type { RecruitmentStage } from '@/lib/types';

export type RecruitmentStageColorField = 'color_complete' | 'color_badge';

export type RecruitmentStageRow = RecruitmentStage & {
  sort_order?: number | null;
  color_complete?: string | null;
  color_badge?: string | null;
};
