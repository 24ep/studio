import type { ComponentType } from 'react';
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FileText,
  GitBranch,
  ListChecks,
  Map,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

export const setupIcons: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  'Company Info': Building2,
  'Company References': Building2,
  Department: Network,
  Branch: Map,
  Designation: BriefcaseBusiness,
  Grades: BadgeCheck,
  'Position Levels': GitBranch,
  'Headcount Types': UsersRound,
  'Leave Policies': ShieldCheck,
  'Leave & Absence Policies': ShieldCheck,
  'Leave Policy Assignments': UsersRound,
  'Policy Documents': BookOpen,
  'Employee Documents': FileText,
  'Onboarding Checklist': ListChecks,
  'Recruitment Stages': GitBranch,
  'Applicant Sources': UsersRound,
  'Evaluation Configuration': Sparkles,
};

const relationships: Record<string, { dependsOn: string; usedBy: string; related: string[] }> = {
  Designation: { dependsOn: 'Departments and position levels', usedBy: 'Headcount planning', related: ['Department', 'Position Levels'] },
  Grades: { dependsOn: 'Position structure', usedBy: 'Compensation & progression', related: ['Designation', 'Position Levels'] },
  'Leave Policies': { dependsOn: 'Company foundation', usedBy: 'Leave requests & approvals', related: ['Company Info', 'Department'] },
  'Onboarding Checklist': { dependsOn: 'Departments and owners', usedBy: 'Employee onboarding', related: ['Department', 'Designation'] },
  'Recruitment Stages': { dependsOn: 'Position structure', usedBy: 'Applicant hiring workflows', related: ['Designation', 'Position Levels'] },
};

export function getHrSetupRelationships(label: string) {
  return relationships[label] ?? {
    dependsOn: 'Workspace foundation',
    usedBy: 'Connected HR workflows',
    related: ['Company Info', 'Department'],
  };
}
