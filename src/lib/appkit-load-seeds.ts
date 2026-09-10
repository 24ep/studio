export type AppKitSeedEnvironment = 'development' | 'production';

export type RecruitmentStageSeed = {
  name: string;
  description: string;
  isSystem: boolean;
  sortOrder: number;
  colorComplete: string;
  colorBadge: string;
};

export type GradeSeed = {
  name: string;
  label: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  slaDays: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
};

export type PositionLevelSeed = {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
};

export type PlatformDefaultSettingSeed = {
  key: 'appLogoDataUrl' | 'defaultMatchCriteria' | 'applicantEvaluationCriteriaPrompt';
  value: string;
  description: string;
};

export const recruitmentStageSeeds: RecruitmentStageSeed[] = [
  { name: 'Screening', description: 'Initial screening of applicant qualifications', isSystem: false, sortOrder: 2, colorComplete: '#60a5fa', colorBadge: '#60a5fa' },
  { name: 'Shortlisted', description: 'Applicant has been shortlisted for further consideration', isSystem: false, sortOrder: 3, colorComplete: '#60a5fa', colorBadge: '#60a5fa' },
  { name: 'Interview Scheduled', description: 'Interview has been scheduled with the applicant', isSystem: false, sortOrder: 4, colorComplete: '#60a5fa', colorBadge: '#60a5fa' },
  { name: 'Interviewing', description: 'Applicant is currently in the interview process', isSystem: false, sortOrder: 5, colorComplete: '#60a5fa', colorBadge: '#60a5fa' },
  { name: 'Offer Extended', description: 'Job offer has been extended to the applicant', isSystem: false, sortOrder: 6, colorComplete: '#22c55e', colorBadge: '#22c55e' },
  { name: 'Offer Accepted', description: 'Applicant has accepted the job offer', isSystem: false, sortOrder: 7, colorComplete: '#22c55e', colorBadge: '#22c55e' },
  { name: 'On Hold', description: 'Applicant application is temporarily on hold', isSystem: false, sortOrder: 10, colorComplete: '#6b7280', colorBadge: '#6b7280' },
];

export const gradeSeeds: GradeSeed[] = Array.from({ length: 14 }, (_, index) => {
  const level = index + 1;
  const isEntry = level <= 2;
  const isMid = level >= 3 && level <= 5;
  const isSenior = level >= 6 && level <= 7;

  return {
    name: `G${level}`,
    label: `G${level}`,
    description: `Grade ${level} - ${isEntry ? 'Entry level' : isMid ? 'Mid-level' : isSenior ? 'Senior' : 'Executive'} positions`,
    minLevel: level,
    maxLevel: level,
    slaDays: isEntry ? 15 : isMid ? 30 : isSenior ? 45 : 60,
    color: isEntry ? '#3B82F6' : isMid ? '#10B981' : isSenior ? '#F59E0B' : '#EF4444',
    isActive: true,
    sortOrder: level,
  };
});

export const positionLevelSeeds: PositionLevelSeed[] = [
  { name: 'Entry Level', description: 'Entry level positions for recent graduates or junior professionals', color: '#3B82F6', isActive: true, sortOrder: 1 },
  { name: 'Junior', description: 'Junior positions with 1-3 years of experience', color: '#10B981', isActive: true, sortOrder: 2 },
  { name: 'Mid Level', description: 'Mid-level positions with 3-7 years of experience', color: '#F59E0B', isActive: true, sortOrder: 3 },
  { name: 'Senior', description: 'Senior positions with 7-12 years of experience', color: '#EF4444', isActive: true, sortOrder: 4 },
  { name: 'Lead', description: 'Lead positions with team leadership responsibilities', color: '#8B5CF6', isActive: true, sortOrder: 5 },
  { name: 'Manager', description: 'Managerial positions with department oversight', color: '#EC4899', isActive: true, sortOrder: 6 },
  { name: 'Director', description: 'Director level positions with strategic responsibilities', color: '#DC2626', isActive: true, sortOrder: 7 },
  { name: 'Executive', description: 'Executive level positions (C-level, VP, etc.)', color: '#7C2D12', isActive: true, sortOrder: 8 },
];

export const platformDefaultSettingSeeds: PlatformDefaultSettingSeed[] = [
  {
    key: 'appLogoDataUrl',
    value: '/brand/default-company-building.svg',
    description: 'Default transparent company building logo.',
  },
  {
    key: 'defaultMatchCriteria',
    value: '<h2>Required Skills & Experience</h2><ul><li>Relevant educational background (Bachelor degree or equivalent)</li><li>Minimum 2-3 years of professional experience in the field</li><li>Strong technical skills and proficiency in relevant tools</li><li>Excellent communication and teamwork abilities</li></ul><h2>Preferred Qualifications</h2><ul><li>Advanced degree or certifications</li><li>Experience with modern technologies and methodologies</li><li>Leadership or project management experience</li><li>Industry-specific knowledge and expertise</li></ul><h2>Personal Qualities</h2><ul><li>Problem-solving mindset and analytical thinking</li><li>Adaptability and willingness to learn</li><li>Strong work ethic and attention to detail</li><li>Cultural fit with company values</li></ul>',
    description: 'Default position/applicant matching criteria.',
  },
  {
    key: 'applicantEvaluationCriteriaPrompt',
    value: 'Evaluate the Applicant against the position requirements using configured expertise skills, personality traits, interviewer scores, and written feedback. Consider resume evidence, position criteria alignment, score consistency, strengths, risks, follow-up questions, and a concise hiring recommendation. Use fair, specific, evidence-based recruiting language.',
    description: 'Default applicant evaluation AI prompt.',
  },
];
