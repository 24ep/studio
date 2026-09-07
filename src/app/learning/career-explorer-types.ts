import type { ComponentType } from 'react';

export type ExplorerMode = 'map' | 'compare';
export type RoleId = string;

export interface CareerRole {
  id: RoleId;
  title: string;
  department: string;
  readiness: number;
  comparisonReadiness: number;
  months: string;
  destinationMonths: string;
  intermediateRole: string;
  description: string;
  change: string;
  strengths: Array<{ title: string; detail: string }>;
  gaps: Array<{ title: string; detail: string }>;
  course: {
    id: string;
    title: string;
    category: string | null;
    description: string | null;
    durationHours: number | null;
  } | null;
  icon: ComponentType<{ className?: string }>;
  tone: 'teal' | 'indigo';
}

export interface CareerExplorerPayload {
  state: 'ready' | 'unlinked';
  message?: string;
  data: null | {
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
    roles: Array<Omit<CareerRole, 'icon' | 'tone'>>;
    goal: { id: string; title: string; keyResults: unknown } | null;
  };
}
