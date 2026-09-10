type ParsedApplicantData = {
  skills?: Array<{ skill?: string }>;
  education?: Array<{ university?: string; major?: string }>;
  experience?: Array<{ company?: string; position?: string }>;
};

export type SearchApplicantMatchSource = {
  parsedData?: ParsedApplicantData | null;
  positionTitle?: string | null;
  fitScore?: number | null;
  status?: string | null;
  recruiterName?: string | null;
};

function includesQueryTerm(queryLower: string, value: string | null | undefined) {
  return Boolean(value && queryLower.includes(value.toLowerCase()));
}

function fallbackMatchReason(aiReasoning?: string) {
  if (!aiReasoning) {
    return 'Matches search criteria';
  }

  const reasoningLower = aiReasoning.toLowerCase();
  if (reasoningLower.includes('skill') || reasoningLower.includes('experience')) {
    return 'Matches search criteria based on skills and experience';
  }
  if (reasoningLower.includes('education')) {
    return 'Matches search criteria based on education';
  }
  return 'Matches search criteria';
}

export function generateMatchReasons(
  query: string,
  applicant: SearchApplicantMatchSource,
  aiReasoning?: string
): string[] {
  const reasons: string[] = [];
  const queryLower = query.toLowerCase();
  const parsedData = applicant.parsedData;

  if (parsedData?.skills) {
    for (const skill of parsedData.skills) {
      if (includesQueryTerm(queryLower, skill.skill)) {
        reasons.push(`Has ${skill.skill} skill`);
      }
    }
  }

  if (parsedData?.education) {
    for (const education of parsedData.education) {
      if (includesQueryTerm(queryLower, education.university)) {
        reasons.push(`Graduated from ${education.university}`);
      }
      if (includesQueryTerm(queryLower, education.major)) {
        reasons.push(`Studied ${education.major}`);
      }
    }
  }

  if (parsedData?.experience) {
    for (const experience of parsedData.experience) {
      if (includesQueryTerm(queryLower, experience.company)) {
        reasons.push(`Worked at ${experience.company}`);
      }
      if (includesQueryTerm(queryLower, experience.position)) {
        reasons.push(`Has ${experience.position} experience`);
      }
    }
  }

  if (includesQueryTerm(queryLower, applicant.positionTitle)) {
    reasons.push(`Applied for ${applicant.positionTitle} position`);
  }

  if ((queryLower.includes('fit score') || queryLower.includes('score')) && applicant.fitScore != null) {
    const score = applicant.fitScore < 1 ? Math.round(applicant.fitScore * 100) : applicant.fitScore;
    reasons.push(`Fit score: ${score}%`);
  }

  if (includesQueryTerm(queryLower, applicant.status)) {
    reasons.push(`Status: ${applicant.status}`);
  }

  if (includesQueryTerm(queryLower, applicant.recruiterName)) {
    reasons.push(`Assigned to ${applicant.recruiterName}`);
  }

  return reasons.length > 0 ? reasons : [fallbackMatchReason(aiReasoning)];
}
