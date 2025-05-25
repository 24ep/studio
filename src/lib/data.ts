
import type { Candidate, Position, UserProfile } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for mock data

export const mockPositions: Position[] = [
  { id: 'pos1', title: 'Software Engineer', department: 'Engineering', isOpen: true, description: 'Develops and maintains software applications.' },
  { id: 'pos2', title: 'Product Manager', department: 'Product', isOpen: true, description: 'Manages product lifecycle from ideation to launch.' },
  { id: 'pos3', title: 'UX Designer', department: 'Design', isOpen: false, description: 'Creates user-centered design solutions.' },
  { id: 'pos4', title: 'Data Analyst', department: 'Analytics', isOpen: true, description: 'Analyzes data to provide actionable insights.' },
];

export let mockAppUsers: UserProfile[] = [
  {
    id: 'user1',
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
    dataAiHint: 'profile man',
    role: 'Hiring Manager',
  },
];

// Functions to manipulate mockAppUsers for API prototypes
export const addUserToMockData = (user: Omit<UserProfile, 'id' | 'avatarUrl' | 'dataAiHint'>): UserProfile => {
  const newUser: UserProfile = {
    id: uuidv4(),
    ...user,
    avatarUrl: `https://placehold.co/100x100.png?text=${user.name.charAt(0)}`, // Basic avatar
    dataAiHint: "profile person"
  };
  mockAppUsers.push(newUser);
  return newUser;
};

export const updateUserInMockData = (id: string, updates: Partial<Omit<UserProfile, 'id'>>): UserProfile | null => {
  const userIndex = mockAppUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return null;
  }
  mockAppUsers[userIndex] = { ...mockAppUsers[userIndex], ...updates };
  return mockAppUsers[userIndex];
};

// --- Rest of your mock data like mockCandidates can remain here ---
export const mockCandidates: Candidate[] = [
  {
    id: 'cand1',
    name: 'Alice Wonderland',
    email: 'alice.wonderland@example.com',
    phone: '555-1234',
    positionId: 'pos1',
    // positionTitle: 'Software Engineer', // This was removed as position is an object
    position: mockPositions.find(p => p.id === 'pos1'),
    fitScore: 85,
    status: 'Interview Scheduled',
    applicationDate: new Date('2024-05-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-05-15T14:30:00Z').toISOString(),
    parsedData: {
      personal_info: { firstname: 'Alice', lastname: 'Wonderland'},
      contact_info: { email: 'alice.wonderland@example.com'},
      education: [{ major: "Computer Science", university: "Tech University" }],
      skills: [{ segment_skill: 'Programming', skill: ['JavaScript', 'React', 'Node.js', 'Python']}],
    },
    transitionHistory: [
      { id: 'th1-1', date: new Date('2024-05-01T10:00:00Z').toISOString(), stage: 'Applied', notes: 'Applied via company website.' },
      { id: 'th1-2', date: new Date('2024-05-10T11:00:00Z').toISOString(), stage: 'Shortlisted', notes: 'Resume shortlisted by HR.' },
      { id: 'th1-3', date: new Date('2024-05-15T14:30:00Z').toISOString(), stage: 'Interview Scheduled', notes: 'First round technical interview.' },
    ],
  },
  // Add other mock candidates similarly, ensuring 'position' object is included if 'positionId' is set.
];

    