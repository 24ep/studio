import type { UpdateApplicantInput } from './applicant-v1-detail-schema';

type ApplicantWithSourceRow = Record<string, unknown> & {
  customAttributes?: unknown;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceDescription?: string | null;
  sourceEmail?: string | null;
  sourceLogo?: string | null;
};

export function shapeUpdatedApplicant(applicantWithSource: ApplicantWithSourceRow) {
  return {
    ...applicantWithSource,
    custom_attributes: applicantWithSource.customAttributes || {},
    source: applicantWithSource.sourceId ? {
      id: applicantWithSource.sourceId,
      name: applicantWithSource.sourceName,
      description: applicantWithSource.sourceDescription,
      email: applicantWithSource.sourceEmail,
      logo: applicantWithSource.sourceLogo,
    } : null,
  };
}

export function shapeUnchangedApplicant(applicant: { customAttributes?: unknown } & Record<string, unknown>) {
  return {
    ...applicant,
    custom_attributes: applicant.customAttributes || {},
  };
}

export function getUpdatedApplicantFieldNames(updateData: UpdateApplicantInput) {
  return Object.keys(updateData).filter((key) => (
    updateData[key as keyof typeof updateData] !== undefined
  ));
}
