import type { AppraisalWorkspaceData } from '@/lib/appraisal/appraisal-contracts';

const cycle = {
  id: 'preview-cycle-2026',
  name: '2026 Annual Review',
  reviewType: 'annual',
  status: 'in_progress',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  selfDueDate: '2026-07-15T00:00:00.000Z',
  managerDueDate: '2026-08-18T00:00:00.000Z',
};

const baseGoals = [
  { id: 'goal-1', title: 'Launch Insights dashboard', description: 'Improve analytics adoption', progress: 96, status: 'completed' },
  { id: 'goal-2', title: 'Increase product adoption', description: 'Drive activation to 65%', progress: 82, status: 'on_track' },
  { id: 'goal-3', title: 'Customer feedback program', description: 'Establish and scale VoC', progress: 78, status: 'on_track' },
  { id: 'goal-4', title: 'Team effectiveness', description: 'Build a high-performing team', progress: 92, status: 'completed' },
];

const people = [
  ['preview-priya', 'Priya Nair', 'Senior Product Manager', 'Product Management', 'EMP-10124', 'manager_review_in_progress', 60],
  ['preview-arjun', 'Arjun Rao', 'Software Engineer II', 'Engineering', 'EMP-10418', 'awaiting_manager_review', 0],
  ['preview-sara', 'Sara Mehta', 'UX Designer', 'Design', 'EMP-10942', 'awaiting_calibration', 100],
  ['preview-vikram', 'Vikram Kapoor', 'Data Analyst', 'Analytics', 'EMP-11207', 'manager_review_in_progress', 80],
  ['preview-neha', 'Neha Desai', 'HR Business Partner', 'People', 'EMP-10618', 'awaiting_manager_review', 0],
  ['preview-rohit', 'Rohit Singh', 'DevOps Engineer', 'Engineering', 'EMP-11504', 'manager_review_in_progress', 75],
] as const;

const teamReviews = people.map(([id, employeeName, jobTitle, department, employeeNumber, status, progress], index) => ({
  id,
  cycleId: cycle.id,
  cycleName: cycle.name,
  reviewType: cycle.reviewType,
  cycleStartDate: cycle.startDate,
  cycleEndDate: cycle.endDate,
  selfDueDate: cycle.selfDueDate,
  managerDueDate: cycle.managerDueDate,
  employeeId: `${id}-employee`,
  employeeName,
  employeeNumber,
  jobTitle,
  department,
  status,
  selfAssessment: index === 1 || index === 4 ? null : 'Submitted reflection with outcomes, evidence, challenges, and development priorities.',
  submittedAt: index === 1 || index === 4 ? null : '2026-07-12T09:30:00.000Z',
  managerAssessment: progress >= 75 ? 'Manager review evidence recorded.' : null,
  managerComments: progress >= 75 ? 'Strong delivery and cross-functional contribution during the review period.' : null,
  managerRating: progress >= 75 ? 4 : null,
  goals: index === 0 ? baseGoals : baseGoals.slice(0, 3),
  competencyAssessment: index === 0 ? [
    { name: 'Strategic thinking', evidence: 'Defined the 2026 roadmap and aligned priorities to market needs.', source: 'Priya Nair · Jul 12' },
    { name: 'Customer focus', evidence: 'Led customer interviews that produced three validated insights.', source: 'Peer feedback · Jul 10' },
    { name: 'Drive for results', evidence: 'Q2 product adoption exceeded the target by eight percent.', source: 'Goal evidence · Jul 8' },
    { name: 'Collaboration', evidence: 'Coordinated a cross-functional launch with Engineering and Design.', source: 'Peer feedback · Jul 9' },
  ] : null,
  createdAt: index % 2 ? '2024-04-01T00:00:00.000Z' : '2023-02-01T00:00:00.000Z',
}));

export const APPRAISAL_REVIEW_DESK_PREVIEW_DATA: AppraisalWorkspaceData = {
  permissions: {
    role: 'administrator',
    canManage: true,
    canCalibrate: true,
    canApprove: true,
    canViewReports: true,
    canOverrideRating: true,
  },
  actorEmployeeId: 'preview-admin',
  cycles: [cycle],
  reviews: [],
  teamReviews,
  reviewerAssignments: [
    { id: 'feedback-1', reviewId: 'preview-priya', status: 'submitted', reviewerRole: 'peer' },
    { id: 'feedback-2', reviewId: 'preview-priya', status: 'submitted', reviewerRole: 'peer' },
  ],
  templates: [],
  ratingModels: [],
  calibration: [teamReviews[2]],
  approvals: [],
  appeals: [],
  timeline: [],
  populationPreview: [],
  analytics: {
    total: 6,
    selfCompleted: 4,
    managerCompleted: 1,
    released: 0,
    overdue: 2,
    completionRate: 17,
    ratingDistribution: [],
    departmentProgress: [],
  },
  meta: {
    generatedAt: '2026-08-13T09:00:00.000Z',
    partial: false,
    unavailableSources: [],
  },
};
