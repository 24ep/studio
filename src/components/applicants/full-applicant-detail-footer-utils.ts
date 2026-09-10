import type { Applicant, RecruitmentStage } from '@/lib/types';

type FooterStageShape = Pick<RecruitmentStage, 'id' | 'name'>;

export function resolveFooterStages<TStage extends FooterStageShape>(
  applicant: Pick<Applicant, 'status' | 'statusId'>,
  availableStages: TStage[],
) {
  const rejectedStage = availableStages.find((stage) => stage.name.toLowerCase() === 'rejected');
  const currentStatusName = (applicant.status || '').toLowerCase();
  const currentStageIndex = availableStages.findIndex((stage) =>
    stage.id === applicant.statusId || stage.name.toLowerCase() === currentStatusName
  );
  const nextStage = currentStageIndex !== -1 && currentStageIndex < availableStages.length - 1
    ? availableStages[currentStageIndex + 1]
    : null;

  return {
    rejectedStage,
    nextStage,
    isRejected: applicant.statusId === rejectedStage?.id || currentStatusName === 'rejected',
  };
}
