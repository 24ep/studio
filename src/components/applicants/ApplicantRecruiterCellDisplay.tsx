import {
  ArrowPathIcon as Loader2,
  ChevronDownIcon as ChevronDown,
  UserMinusIcon as UserX,
  UserPlusIcon as UserPlus,
} from '@heroicons/react/24/outline';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { Button } from '@/components/ui/button';
import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { cn } from '@/lib/utils';

import type { ApplicantRecruiterOption } from './applicant-recruiter-cell-types';
import { formatApplicantRecruiterName } from './applicant-recruiter-cell-utils';

interface RecruiterIdentityProps {
  recruiter: ApplicantRecruiterOption;
}

function RecruiterIdentity({ recruiter }: RecruiterIdentityProps) {
  return (
    <RecruiterAvatarCompact
      user={{
        id: recruiter.id,
        name: recruiter.name,
        avatarUrl: recruiter.avatarUrl,
        personalColor: recruiter.personalColor || undefined,
      }}
      size="xs"
      className="h-5 w-5"
    />
  );
}

export function ApplicantRecruiterReadonly({
  displayRecruiter,
}: {
  displayRecruiter: ApplicantRecruiterOption | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {displayRecruiter?.name ? (
        <>
          <RecruiterIdentity recruiter={displayRecruiter} />
          <span className="text-sm font-medium text-foreground truncate" title={displayRecruiter.name}>
            {formatApplicantRecruiterName(displayRecruiter.name)}
          </span>
        </>
      ) : (
        <>
          <UnassignedRecruiterIcon />
          <span className="text-sm text-muted-foreground">Unassigned</span>
        </>
      )}
    </div>
  );
}

interface ApplicantRecruiterTriggerProps extends ComponentPropsWithoutRef<typeof Button> {
  displayRecruiter: ApplicantRecruiterOption | null;
  isAssigning: boolean;
  open: boolean;
}

export const ApplicantRecruiterTrigger = forwardRef<HTMLButtonElement, ApplicantRecruiterTriggerProps>(function ApplicantRecruiterTrigger({
  className,
  displayRecruiter,
  isAssigning,
  open,
  ...buttonProps
}, ref) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      role="combobox"
      aria-expanded={open && !isAssigning}
      className={cn(
        'h-auto p-2 justify-start text-left w-full max-w-[200px] border-0 shadow-none',
        'hover:bg-accent/50 transition-colors',
        isAssigning && 'opacity-50 cursor-not-allowed',
        className,
      )}
      title={displayRecruiter?.name || 'Unassigned'}
      {...buttonProps}
    >
      {isAssigning ? (
        <AssigningRecruiterState />
      ) : displayRecruiter?.name ? (
        <AssignedRecruiterState recruiter={displayRecruiter} />
      ) : (
        <UnassignedRecruiterState />
      )}
    </Button>
  );
});

function AssigningRecruiterState() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Loader2 className="h-2 w-2 animate-spin" />
      </div>
      <span className="text-xs text-muted-foreground">Updating... (auto-reset in 2s)</span>
    </div>
  );
}

function AssignedRecruiterState({ recruiter }: RecruiterIdentityProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <RecruiterIdentity recruiter={recruiter} />
      <span className="text-sm font-medium text-foreground truncate flex-1">
        {formatApplicantRecruiterName(recruiter.name)}
      </span>
      <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

function UnassignedRecruiterState() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <UserPlus className="h-2 w-2 text-gray-500" />
      </div>
      <span className="text-sm text-muted-foreground">Unassigned</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
    </div>
  );
}

export function UnassignedRecruiterIcon() {
  return (
    <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      <UserX className="h-2 w-2 text-gray-500" />
    </div>
  );
}
