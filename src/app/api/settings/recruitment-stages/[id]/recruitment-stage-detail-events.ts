import { fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';

export async function broadcastRecruitmentStagesUpdated(userId: string) {
  const updatedStages = await fetchAllRecruitmentStagesDb();
  broadcastApplicantUpdate({ action: 'recruitment_stages_updated', stages: updatedStages }, userId);
}
