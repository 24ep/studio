export interface Interviewer {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  positionTitle?: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
  createdAt: string;
}

export interface InterviewerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  positionTitle?: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}
