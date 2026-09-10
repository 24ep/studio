"use client";

import type { ReactNode } from 'react';
import {
  ArrowPathIcon as RefreshCw,
  CalendarIcon as Calendar,
  CodeBracketIcon as Code,
  ExclamationTriangleIcon as AlertTriangle,
  PlayIcon as Play,
  StarIcon as Star,
  UserMinusIcon as UserMinus,
  UserMinusIcon as UserX,
  UserPlusIcon as UserCheck,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const today = () => new Date().toISOString().slice(0, 10);
const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

interface QuickCommand {
  label: string;
  query: string;
  description: string;
  icon: ReactNode;
}

interface ApplicantAdvancedQueryCommandsProps {
  onSelectQuery: (query: string) => void;
}

export function ApplicantAdvancedQueryCommands({ onSelectQuery }: ApplicantAdvancedQueryCommandsProps) {
  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs font-medium text-muted-foreground">Quick Commands</Label>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-1">
        {getQuickCommands().map((command) => (
          <Button
            key={command.label}
            variant="ghost"
            size="sm"
            className="w-full h-auto p-2 flex items-center justify-start gap-2 text-left hover:bg-muted/50"
            onClick={() => onSelectQuery(command.query)}
          >
            <div className="flex-shrink-0">
              {command.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{command.label}</div>
              <div className="text-xs text-muted-foreground truncate">{command.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

function getQuickCommands(): QuickCommand[] {
  return [
    {
      label: 'High Priority',
      query: 'minAppliedJobFitScore:80',
      description: 'Applicants with 80%+ fit score',
      icon: <Star className="h-3 w-3" />,
    },
    {
      label: 'Active Pipeline',
      query: 'status:Applied,Screening',
      description: 'Applicants in early stages',
      icon: <Play className="h-3 w-3" />,
    },
    {
      label: 'Unassigned',
      query: 'recruiterId:unassigned',
      description: 'Applicants needing assignment',
      icon: <UserX className="h-3 w-3" />,
    },
    {
      label: 'No Status',
      query: 'status:Off',
      description: 'Applicants without status',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    {
      label: 'Applied Today',
      query: `applicationDateStart:${today()}`,
      description: 'Applicants who applied today',
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      label: 'Applied This Week',
      query: `applicationDateStart:${sevenDaysAgo()}`,
      description: 'Applicants who applied this week',
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      label: 'Hiring Today',
      query: 'status:Offer Extended,Offer Accepted,Hired',
      description: 'Applicants in final hiring stages',
      icon: <UserCheck className="h-3 w-3" />,
    },
    {
      label: 'Hiring This Week',
      query: 'status:Interviewing,Offer Extended,Offer Accepted,Hired',
      description: 'Applicants in hiring pipeline',
      icon: <UserCheck className="h-3 w-3" />,
    },
    {
      label: 'No Applied Job',
      query: 'positionId:not-applied',
      description: 'Applicants without applied positions',
      icon: <UserMinus className="h-3 w-3" />,
    },
    {
      label: 'Unassigned Recruiter',
      query: 'recruiterId:unassigned',
      description: 'Applicants without assigned recruiter',
      icon: <UserX className="h-3 w-3" />,
    },
    {
      label: 'Updated Today',
      query: `applicationDateStart:${today()}`,
      description: 'Applicants updated today',
      icon: <RefreshCw className="h-3 w-3" />,
    },
    {
      label: 'Senior Devs',
      query: 'minExperienceYears:5 skills:React,Python',
      description: 'Experienced developers',
      icon: <Code className="h-3 w-3" />,
    },
  ];
}
