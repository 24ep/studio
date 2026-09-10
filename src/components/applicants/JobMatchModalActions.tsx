import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRightIcon as ArrowRight,
  UserGroupIcon as UserCheck,
  UserMinusIcon as UserX,
  UsersIcon as Users,
} from '@heroicons/react/24/outline';
import type { JobMatchApplicantFilterType } from './job-match-modal-utils';

interface JobMatchQuickActionsCardProps {
  isNavigating: boolean;
  onNavigate: (filterType: JobMatchApplicantFilterType) => void;
}

const QUICK_ACTIONS: Array<{
  filterType: JobMatchApplicantFilterType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = [
  { filterType: 'applied', icon: Users, label: 'View Applied Applicants' },
  { filterType: 'matching', icon: UserCheck, label: 'View Good Matches' },
  { filterType: 'matchingNotApplied', icon: UserX, label: 'View High Matches (Not Applied)' },
];

export function JobMatchQuickActionsCard({ isNavigating, onNavigate }: JobMatchQuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton
            key={action.filterType}
            disabled={isNavigating}
            icon={action.icon}
            label={action.label}
            onClick={() => onNavigate(action.filterType)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start"
      variant="outline"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
