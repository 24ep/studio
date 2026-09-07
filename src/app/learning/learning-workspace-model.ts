export type LearningRecord = Record<string, unknown> & { id: string };

export interface LearningResource {
  records?: LearningRecord[];
}

export interface LearningResponse {
  metrics?: Array<{ label: string; value: string | number; helper?: string }>;
  resource?: LearningResource;
  records?: LearningRecord[];
}

export interface CareerSnapshot {
  employee: {
    id: string;
    name: string;
    jobTitle: string | null;
    department: string | null;
  };
  evidence: {
    skills: string[];
    completedCourses: number;
    verifiedCertificates: number;
  };
  roles: Array<{
    id: string;
    title: string;
    department: string;
    readiness: number;
    intermediateRole: string;
    description: string;
    strengths: Array<{ title: string; detail: string }>;
    gaps: Array<{ title: string; detail: string }>;
    course: {
      id: string;
      title: string;
      category: string | null;
      description: string | null;
      durationHours: number | null;
    } | null;
  }>;
  goal: { id: string; title: string } | null;
}

export interface CourseForm {
  title: string;
  category: string;
  description: string;
  durationHours: string;
  isRequired: string;
  isActive: string;
}

export interface CertificateForm {
  employeeId: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  validityMonths: string;
  verificationUrl: string;
  status: string;
  category: string;
  renewalRequirement: string;
  credentialIdPattern: string;
  geographicCoverage: string;
  policyOwner: string;
  approvedOn: string;
  nextReviewAt: string;
  verificationRequirements: string;
  policyChangeNote: string;
}

export interface LearningPathForm {
  title: string;
  description: string;
  status: string;
  courseIds: string[];
}

export interface CourseWizardSection {
  title: string;
  lessonTitle: string;
  description: string;
}

export interface CourseWizardSubmission {
  coverFile: File | null;
  sections: CourseWizardSection[];
}

export interface LearningAssignmentForm {
  employeeId: string;
  courseIds: string[];
  dueDate: string;
  sourceLabel: string;
}

export const courseFormDefault: CourseForm = {
  title: "",
  category: "",
  description: "",
  durationHours: "",
  isRequired: "false",
  isActive: "true",
};

export const certificateFormDefault: CertificateForm = {
  employeeId: "",
  name: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  validityMonths: "",
  verificationUrl: "",
  status: "active",
  category: "",
  renewalRequirement: "required",
  credentialIdPattern: "",
  geographicCoverage: "Global",
  policyOwner: "Learning & Development",
  approvedOn: new Date().toISOString().slice(0, 10),
  nextReviewAt: "",
  verificationRequirements:
    "Credential ID must be provided and match the official registry.\nCredential must be in active status.\nName on credential must match employee record.\nVerification must be performed through the official issuer registry.",
  policyChangeNote: "",
};

export const learningPathFormDefault: LearningPathForm = {
  title: "",
  description: "",
  status: "draft",
  courseIds: [],
};

export const learningAssignmentDefault: LearningAssignmentForm = {
  employeeId: "",
  courseIds: [],
  dueDate: "",
  sourceLabel: "",
};
