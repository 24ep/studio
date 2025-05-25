import type { Candidate, Position, UserProfile } from './types';

export const mockPositions: Position[] = [
  { id: 'pos1', title: 'Software Engineer', department: 'Engineering', isOpen: true, description: 'Develops and maintains software applications.' },
  { id: 'pos2', title: 'Product Manager', department: 'Product', isOpen: true, description: 'Manages product lifecycle from ideation to launch.' },
  { id: 'pos3', title: 'UX Designer', department: 'Design', isOpen: false, description: 'Creates user-centered design solutions.' },
  { id: 'pos4', title: 'Data Analyst', department: 'Analytics', isOpen: true, description: 'Analyzes data to provide actionable insights.' },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'cand1',
    name: 'Alice Wonderland',
    email: 'alice.wonderland@example.com',
    phone: '555-1234',
    positionId: 'pos1',
    positionTitle: 'Software Engineer',
    fitScore: 85,
    status: 'Interview Scheduled',
    applicationDate: new Date('2024-05-01T10:00:00Z').toISOString(),
    lastUpdateDate: new Date('2024-05-15T14:30:00Z').toISOString(),
    parsedData: {
      education: ["Bachelor's in Computer Science"],
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      experienceYears: 5,
      summary: 'Experienced full-stack developer with a passion for creating intuitive user experiences.'
    },
    transitionHistory: [
      { id: 'th1-1', date: new Date('2024-05-01T10:00:00Z').toISOString(), stage: 'Applied', notes: 'Applied via company website.' },
      { id: 'th1-2', date: new Date('2024-05-10T11:00:00Z').toISOString(), stage: 'Shortlisted', notes: 'Resume shortlisted by HR.' },
      { id: 'th1-3', date: new Date('2024-05-15T14:30:00Z').toISOString(), stage: 'Interview Scheduled', notes: 'First round technical interview.' },
    ],
  },
  {
    id: 'cand2',
    name: 'Bob The Builder',
    email: 'bob.builder@example.com',
    phone: '555-5678',
    positionId: 'pos1',
    positionTitle: 'Software Engineer',
    fitScore: 72,
    status: 'Applied',
    applicationDate: new Date('2024-05-05T14:20:00Z').toISOString(),
    lastUpdateDate: new Date('2024-05-05T14:20:00Z').toISOString(),
     parsedData: {
      education: ["Master's in Software Engineering"],
      skills: ['Java', 'Spring Boot', 'SQL', 'AWS'],
      experienceYears: 3,
      summary: 'Detail-oriented software engineer with expertise in backend systems.'
    },
    transitionHistory: [
      { id: 'th2-1', date: new Date('2024-05-05T14:20:00Z').toISOString(), stage: 'Applied' },
    ],
  },
  {
    id: 'cand3',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    positionId: 'pos2',
    positionTitle: 'Product Manager',
    fitScore: 92,
    status: 'Offer Extended',
    applicationDate: new Date('2024-04-20T09:00:00Z').toISOString(),
    lastUpdateDate: new Date('2024-05-20T16:00:00Z').toISOString(),
    parsedData: {
      education: ["MBA", "Bachelor's in Business Administration"],
      skills: ['Product Strategy', 'Market Research', 'Agile', 'JIRA'],
      experienceYears: 7,
      summary: 'Strategic product manager with a track record of successful product launches.'
    },
    transitionHistory: [
      { id: 'th3-1', date: new Date('2024-04-20T09:00:00Z').toISOString(), stage: 'Applied' },
      { id: 'th3-2', date: new Date('2024-04-25T10:00:00Z').toISOString(), stage: 'Shortlisted' },
      { id: 'th3-3', date: new Date('2024-05-02T14:00:00Z').toISOString(), stage: 'Interviewing', notes: 'Panel interview.' },
      { id: 'th3-4', date: new Date('2024-05-20T16:00:00Z').toISOString(), stage: 'Offer Extended', notes: 'Offer sent via email.' },
    ],
  },
    {
    id: 'cand4',
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    positionId: 'pos4',
    positionTitle: 'Data Analyst',
    fitScore: 65,
    status: 'Rejected',
    applicationDate: new Date('2024-05-10T11:30:00Z').toISOString(),
    lastUpdateDate: new Date('2024-05-18T10:15:00Z').toISOString(),
    parsedData: {
      education: ["Bachelor's in Statistics"],
      skills: ['SQL', 'Python', 'Tableau', 'Excel'],
      experienceYears: 2,
      summary: 'Analytical individual with experience in data visualization and reporting.'
    },
    transitionHistory: [
      { id: 'th4-1', date: new Date('2024-05-10T11:30:00Z').toISOString(), stage: 'Applied' },
      { id: 'th4-2', date: new Date('2024-05-18T10:15:00Z').toISOString(), stage: 'Rejected', notes: 'Not a good fit for the current requirements.' },
    ],
  },
];

// This mockUserProfile is for the currently "logged-in" user if not using real auth.
// With NextAuth, session.user will be preferred.
export const mockUserProfile: UserProfile = {
  id: 'user1',
  name: 'Jane Recruiter',
  email: 'jane.recruiter@canditrack.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  dataAiHint: 'profile woman',
  role: 'Recruiter',
};


// Mock data for the /users page (application users)
export const mockAppUsers: UserProfile[] = [
  {
    id: 'user1', // Matches mockUserProfile for consistency in this example
    name: 'Jane Recruiter',
    email: 'jane.recruiter@canditrack.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'profile woman',
    role: 'Recruiter',
  },
  {
    id: 'user2',
    name: 'Admin User',
    email: 'admin@canditrack.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'profile person',
    role: 'Admin',
  },
  {
    id: 'user3',
    name: 'Mike Manager',
    email: 'mike.manager@canditrack.com',
    // avatarUrl: 'https://placehold.co/100x100.png', // Example of user without avatar
    dataAiHint: 'profile man',
    role: 'Hiring Manager',
  },
];
