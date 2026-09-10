import { getRecruitmentStageName } from '@/lib/recruitmentStageUtils';
import type { Applicant, ApplicantDetails } from '@/lib/types';
import {
  appendIfPresent,
  buildApplicantDetailSummaryLines,
  buildCustomAttributeLines,
  formatFitScore,
} from './search-applicants-summary-formatters';

function getLatestTransition(transitionHistory: Applicant['transitionHistory']) {
  return [...(transitionHistory || [])].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0;
    }
    return dateB.getTime() - dateA.getTime();
  })[0];
}

function buildApplicationStatusLine(applicant: Applicant, stageName: string) {
  const fitScore = formatFitScore(applicant.fitScore);
  return applicant.position?.title
    ? `Applied for Position: ${applicant.position.title} (Fit Score: ${fitScore}%, Status: ${stageName})`
    : `General Application (Status: ${stageName}, Overall Fit Score: ${fitScore}%)`;
}

async function appendApplicantHeader(summaryParts: string[], applicant: Applicant) {
  const { id, name, email, phone, status, fitScore, position, applicationDate, recruiter, transitionHistory } = applicant;
  const stageName = await getRecruitmentStageName(status || '') || (status || '');

  summaryParts.push(`Applicant ID: ${id}`);
  summaryParts.push(`Name: ${name}`);
  appendIfPresent(summaryParts, 'Email', email);
  appendIfPresent(summaryParts, 'Phone', phone);
  summaryParts.push(buildApplicationStatusLine({ ...applicant, fitScore, position }, stageName));

  appendIfPresent(summaryParts, 'Application Date', applicationDate ? new Date(applicationDate).toLocaleDateString() : '');
  appendIfPresent(summaryParts, 'Assigned Recruiter', recruiter?.name);

  const latestTransition = getLatestTransition(transitionHistory);
  if (latestTransition) {
    const latestStageName = await getRecruitmentStageName(latestTransition.stage) || latestTransition.stage;
    summaryParts.push(`Last Status Update: ${latestStageName} on ${new Date(latestTransition.date).toLocaleDateString()}`);
  }
}

export async function createApplicantSummary(applicant: Applicant): Promise<string> {
  const summaryParts: string[] = [];
  const details = applicant.parsedData as ApplicantDetails | null;

  await appendApplicantHeader(summaryParts, applicant);

  if (details) {
    summaryParts.push(...buildApplicantDetailSummaryLines(details));
  }

  summaryParts.push(...buildCustomAttributeLines(applicant.customAttributes));
  return summaryParts.join('\n');
}

export async function buildApplicantSummariesText(applicants: Applicant[]) {
  const summaries = await Promise.all(
    applicants.map(async applicant => `Applicant_START\n${await createApplicantSummary(applicant)}\nApplicant_END`)
  );
  return summaries.join('\n\n---\n\n');
}
