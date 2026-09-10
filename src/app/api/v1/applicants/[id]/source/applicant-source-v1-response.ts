import type { QueryResultRow } from 'pg';
import type { UpdateApplicantSourceInput } from './applicant-source-v1-schema';

export type ApplicantSourceRow = QueryResultRow & {
  id: string;
  name: string;
  sourceId: string | null;
  subSource: string | null;
  sourceName?: string | null;
  sourceDescription?: string | null;
  sourceEmail?: string | null;
  sourceLogo?: string | null;
};

export function serializeApplicantSource(applicant: ApplicantSourceRow) {
  return {
    applicantId: applicant.id,
    applicantName: applicant.name,
    sourceId: applicant.sourceId,
    subSource: applicant.subSource,
    source: applicant.sourceId
      ? {
          id: applicant.sourceId,
          name: applicant.sourceName,
          description: applicant.sourceDescription,
          email: applicant.sourceEmail,
          logo: applicant.sourceLogo,
        }
      : null,
  };
}

export function serializeUpdatedApplicantSource(
  applicant: ApplicantSourceRow,
  input: UpdateApplicantSourceInput,
  oldSourceId: string | null,
  oldSubSource: string | null,
) {
  return {
    message: 'Applicant source updated successfully',
    applicantId: applicant.id,
    applicantName: applicant.name,
    sourceId: applicant.sourceId,
    subSource: applicant.subSource,
    source: applicant.sourceId
      ? {
          id: applicant.sourceId,
          name: applicant.sourceName,
          description: applicant.sourceDescription,
          logo: applicant.sourceLogo,
        }
      : null,
    changes: {
      sourceId: input.sourceId !== undefined ? { from: oldSourceId, to: input.sourceId } : undefined,
      subSource: input.subSource !== undefined ? { from: oldSubSource, to: input.subSource } : undefined,
    },
  };
}

export function buildApplicantSourceChangeDescription(
  input: UpdateApplicantSourceInput,
  oldSourceId: string | null,
  oldSubSource: string | null,
) {
  const changeDescription = [];

  if (input.sourceId !== undefined) {
    changeDescription.push(`source: ${oldSourceId || 'none'} -> ${input.sourceId || 'none'}`);
  }

  if (input.subSource !== undefined) {
    changeDescription.push(`sub-source: ${oldSubSource || 'none'} -> ${input.subSource || 'none'}`);
  }

  return changeDescription.join(', ');
}
