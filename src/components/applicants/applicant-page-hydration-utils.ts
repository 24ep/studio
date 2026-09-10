import type { Applicant, ApplicantSource, Position } from '@/lib/types';

function buildEntityMap<T extends { id?: string | null }>(entities?: T[] | null) {
  return new Map(
    (Array.isArray(entities) ? entities : [])
      .filter((entity): entity is T & { id: string } => typeof entity?.id === 'string' && entity.id.length > 0)
      .map(entity => [entity.id, entity])
  );
}

export function hydrateApplicantsForDisplay(
  applicants?: Applicant[] | null,
  positions?: Position[] | null,
  recruiters?: Array<NonNullable<Applicant['recruiter']>> | null,
  sources?: ApplicantSource[] | null
) {
  const applicantList = Array.isArray(applicants) ? applicants : [];
  const positionMap = buildEntityMap(positions);
  const recruiterMap = buildEntityMap(recruiters);
  const sourceMap = buildEntityMap(sources);

  return applicantList.map(applicant => ({
    ...applicant,
    position: applicant.positionId ? positionMap.get(applicant.positionId) : undefined,
    recruiter: applicant.recruiterId ? recruiterMap.get(applicant.recruiterId) : undefined,
    source: applicant.sourceId ? sourceMap.get(applicant.sourceId) : undefined,
  }));
}
