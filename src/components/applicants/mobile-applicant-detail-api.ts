import type { Applicant, Position, RecruitmentStage, TransitionRecord } from '@/lib/types';
import {
  normalizeMobileApplicantAttachments,
  normalizeRecords,
  normalizeRecruiters,
  normalizeSources,
  parseSettledResponse,
  type MobileApplicantAttachment,
  type MobileApplicantComment,
  type MobileApplicantReference,
} from './mobile-applicant-detail-normalizers';

export {
  assignMobileApplicantRecruiter,
  changeMobileApplicantStatus,
  deleteMobileApplicant,
  reprocessMobileApplicant,
  updateMobileApplicantPin,
  updateMobileApplicantStatus,
} from './mobile-applicant-detail-actions';

export type {
  MobileApplicantAttachment,
  MobileApplicantComment,
  MobileApplicantReference,
} from './mobile-applicant-detail-normalizers';

export interface MobileApplicantDetailData {
  applicant: Applicant;
  positions: Position[];
  stages: RecruitmentStage[];
  recruiters: MobileApplicantReference[];
  sources: MobileApplicantReference[];
  comments: MobileApplicantComment[];
  attachments: MobileApplicantAttachment[];
  transitions: TransitionRecord[];
}

export async function loadMobileApplicantDetailData(
  applicantId: string,
  signal?: AbortSignal,
): Promise<MobileApplicantDetailData> {
  const [
    applicantRes,
    positionsRes,
    stagesRes,
    recruitersRes,
    sourcesRes,
    commentsRes,
    attachmentsRes,
    transitionsRes,
  ] = await Promise.allSettled([
    fetch(`/api/applicants/${applicantId}`, { credentials: 'include', signal }),
    fetch('/api/positions', { credentials: 'include', signal }),
    fetch('/api/recruitment-stages', { credentials: 'include', signal }),
    fetch('/api/users?role=Recruiter', { credentials: 'include', signal }),
    fetch('/api/applicant-sources', { credentials: 'include', signal }),
    fetch(`/api/applicants/${applicantId}/comments?limit=100&offset=0`, { credentials: 'include', signal }),
    fetch(`/api/applicants/${applicantId}/resumes?limit=100&offset=0`, { credentials: 'include', signal }),
    fetch(`/api/transitions?applicantId=${applicantId}`, { credentials: 'include', signal }),
  ]);

  const applicant = await parseSettledResponse<Applicant>(applicantRes);
  if (!applicant) {
    throw new Error('Applicant not found');
  }

  return {
    applicant,
    positions: normalizeRecords<Position>(await parseSettledResponse(positionsRes)),
    stages: normalizeRecords<RecruitmentStage>(await parseSettledResponse(stagesRes)),
    recruiters: normalizeRecruiters(await parseSettledResponse(recruitersRes)),
    sources: normalizeSources(await parseSettledResponse(sourcesRes)),
    comments: normalizeRecords<MobileApplicantComment>(await parseSettledResponse(commentsRes)),
    attachments: normalizeMobileApplicantAttachments(await parseSettledResponse(attachmentsRes)),
    transitions: normalizeRecords<TransitionRecord>(await parseSettledResponse(transitionsRes)),
  };
}
