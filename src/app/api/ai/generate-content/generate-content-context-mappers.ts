import type {
  GenerateContentApplicantData,
  GenerateContentRecord,
} from './generate-content-context-types';

function asRecord(value: unknown): GenerateContentRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as GenerateContentRecord
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecordArray(value: unknown): GenerateContentRecord[] {
  return asArray(value).flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  });
}

function getNumericScore(record: GenerateContentRecord, key: string) {
  const value = record[key];
  return typeof value === 'number' ? value : 0;
}

function hasScoreAbove(record: GenerateContentRecord, threshold: number) {
  return getNumericScore(record, 'fitScore') > threshold;
}

function mapPosition(position: GenerateContentRecord | null) {
  if (!position) return null;

  return {
    id: position.id,
    title: position.title,
    department: position.department,
    description: position.description,
    level: position.positionLevel,
    isOpen: position.isOpen,
    customAttributes: position.customAttributes,
    matchCriteria: position.matchCriteria,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

function mapPotentialMatch(match: GenerateContentRecord) {
  return {
    jobId: match.jobId,
    jobTitle: match.jobTitle || match.positionTitle,
    positionTitle: match.positionTitle,
    department: match.positionDepartment,
    description: match.positionDescription,
    level: match.positionLevel,
    isOpen: match.positionIsOpen,
    customAttributes: match.positionCustomAttributes,
    matchCriteria: match.positionMatchCriteria,
    fitScore: match.fitScore,
    matchReasons: match.matchReasons,
    jobDescriptionSummary: match.job_description_summary,
    matchedAt: match.createdAt,
    positionCreatedAt: match.positionCreatedAt,
    positionUpdatedAt: match.positionUpdatedAt,
  };
}

export function buildApplicantContext(data: GenerateContentApplicantData) {
  const {
    applicant: rawApplicant,
    comments,
    transitions,
    attachments,
    applicantComments,
    transitionRecords,
    jobMatches: rawJobMatches,
    appliedPositionData: rawAppliedPositionData,
  } = data;

  const applicant = asRecord(rawApplicant) ?? {};
  const jobMatches = asRecordArray(rawJobMatches);
  const appliedPositionData = asRecord(rawAppliedPositionData);
  const appliedPosition = mapPosition(appliedPositionData);

  return {
    basicInfo: {
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      status: applicant.currentStage || 'Unknown',
      applicationDate: applicant.applicationDate,
      fitScore: applicant.fitScore,
      dataAiHint: applicant.dataAiHint,
      customAttributes: applicant.customAttributes,
      parsedData: applicant.parsedData,
      assignmentJustification: applicant.assignmentJustification,
      avatarUrl: applicant.avatarUrl,
    },
    education: asArray(applicant.educationData),
    experience: asArray(applicant.experienceData),
    position: appliedPosition,
    recruiter: applicant.recruiterName ? {
      name: applicant.recruiterName,
      email: applicant.recruiterEmail,
    } : null,
    currentStage: {
      name: applicant.currentStage,
      description: applicant.stageDescription,
      color: applicant.stageColor,
    },
    documents: {
      resumePath: applicant.resumePath,
      attachments: asArray(attachments),
    },
    history: {
      comments: asArray(comments),
      applicantComments: asArray(applicantComments),
      transitions: asArray(transitions),
      transitionRecords: asArray(transitionRecords),
      jobMatches,
    },
    opportunities: {
      appliedPosition,
      potentialMatches: jobMatches.map(mapPotentialMatch),
      topMatches: jobMatches
        .filter((match) => hasScoreAbove(match, 0.7))
        .slice(0, 3)
        .map((match) => ({
          jobTitle: match.jobTitle || match.positionTitle,
          department: match.positionDepartment,
          fitScore: match.fitScore,
          matchReasons: match.matchReasons,
        })),
      matchCriteriaAnalysis: {
        appliedPositionCriteria: appliedPositionData?.matchCriteria || null,
        highMatchPositions: jobMatches
          .filter((match) => hasScoreAbove(match, 0.8))
          .map((match) => ({
            positionTitle: match.positionTitle,
            department: match.positionDepartment,
            matchCriteria: match.positionMatchCriteria,
            fitScore: match.fitScore,
            matchReasons: match.matchReasons,
          })),
        criteriaComparison: jobMatches
          .filter((match) => Boolean(match.positionMatchCriteria))
          .map((match) => ({
            positionTitle: match.positionTitle,
            matchCriteria: match.positionMatchCriteria,
            fitScore: match.fitScore,
            matchReasons: match.matchReasons,
          })),
      },
    },
  };
}
