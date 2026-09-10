import {
  BanknotesIcon as Banknote,
  BuildingOffice2Icon as Building2,
  InformationCircleIcon as Info,
  PencilSquareIcon as Edit2,
  UserIcon as User,
  UsersIcon as Users,
} from '@heroicons/react/24/outline';
import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatJobAppliedExpectedSalary } from './job-applied-tab-utils';

interface JobAppliedEntity {
  name: string;
}

interface JobAppliedDetailsCardProps {
  expectedSalary?: number | null;
  currentStage?: JobAppliedEntity | null;
  currentSource?: JobAppliedEntity | null;
  currentRecruiter?: JobAppliedEntity | null;
  onEditStatus: () => void;
  onEditSource: () => void;
  onEditRecruiter: () => void;
  onEditSalary: () => void;
}

function JobAppliedDetailRow({
  Icon,
  label,
  children,
  onEdit,
  withDivider = true,
}: {
  Icon: typeof Info;
  label: string;
  children: React.ReactNode;
  onEdit: () => void;
  withDivider?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${withDivider ? 'border-b border-border/50' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function JobAppliedDetailsCard({
  expectedSalary,
  currentStage,
  currentSource,
  currentRecruiter,
  onEditStatus,
  onEditSource,
  onEditRecruiter,
  onEditSalary,
}: JobAppliedDetailsCardProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Applicant Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <JobAppliedDetailRow Icon={Info} label="Status" onEdit={onEditStatus}>
          {currentStage ? (
            <Badge variant="secondary" className="text-xs">
              {currentStage.name}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not set</span>
          )}
        </JobAppliedDetailRow>

        <JobAppliedDetailRow Icon={Building2} label="Source" onEdit={onEditSource}>
          {currentSource ? (
            <Badge variant="outline" className="text-xs">
              {currentSource.name}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not set</span>
          )}
        </JobAppliedDetailRow>

        <JobAppliedDetailRow Icon={Users} label="Recruiter" onEdit={onEditRecruiter}>
          {currentRecruiter ? (
            <Badge variant="outline" className="text-xs">
              {currentRecruiter.name}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not assigned</span>
          )}
        </JobAppliedDetailRow>

        <JobAppliedDetailRow Icon={Banknote} label="Expected Salary" onEdit={onEditSalary} withDivider={false}>
          {expectedSalary ? (
            <span className="text-sm font-medium">
              {formatJobAppliedExpectedSalary(expectedSalary)}
              <span className="text-xs text-muted-foreground font-normal ml-1">/month</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not set</span>
          )}
        </JobAppliedDetailRow>
      </CardContent>
    </Card>
  );
}
