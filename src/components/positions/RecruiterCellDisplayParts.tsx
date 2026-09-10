"use client";

import type { ReactNode } from 'react';
import { ChevronDown, Loader2, UserPlus, UserX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { cn } from '@/lib/utils';

import type { AvailableRecruiter, RecruiterCellPosition } from './RecruiterCellTypes';
import { ASSIGNMENT_AUTO_RESET_MS } from './use-recruiter-cell-state';

interface RecruiterDisplayProps {
  currentRecruiter?: AvailableRecruiter;
  position: RecruiterCellPosition;
  showChevron?: boolean;
}

interface RecruiterTriggerContentProps extends RecruiterDisplayProps {
  isAssigning: boolean;
  open: boolean;
}

export function RecruiterReadonlyView({ position, currentRecruiter }: RecruiterDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      {position.recruiterName ? (
        <RecruiterDisplay position={position} currentRecruiter={currentRecruiter} />
      ) : (
        <UnassignedRecruiter label="Unassigned" />
      )}
    </div>
  );
}

export function RecruiterTriggerContent({
  position,
  currentRecruiter,
  isAssigning,
  open,
}: RecruiterTriggerContentProps) {
  return (
    <Button
      variant="ghost"
      role="combobox"
      aria-expanded={open && !isAssigning}
      className={cn(
        'h-auto p-2 justify-start text-left w-full max-w-[200px] border-0 shadow-none',
        'hover:bg-accent/50 transition-colors',
        isAssigning && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isAssigning ? (
        <AssigningRecruiterState />
      ) : position.recruiterName ? (
        <RecruiterDisplay
          position={position}
          currentRecruiter={currentRecruiter}
          showChevron
        />
      ) : (
        <AssignRecruiterPrompt />
      )}
    </Button>
  );
}

export function RecruiterIconCircle({ children }: { children: ReactNode }) {
  return (
    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      {children}
    </div>
  );
}

function RecruiterDisplay({ position, currentRecruiter, showChevron }: RecruiterDisplayProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <RecruiterAvatarCompact
        user={{
          id: currentRecruiter?.id || position.recruiterId || '',
          name: position.recruiterName || '',
          avatarUrl: currentRecruiter?.avatarUrl,
          personalColor: currentRecruiter?.personalColor,
        }}
        size="xs"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">
          {position.recruiterName}
        </span>
        {currentRecruiter?.vacantHeadcount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {currentRecruiter.vacantHeadcount} vacant
          </span>
        )}
      </div>
      {showChevron && <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
    </div>
  );
}

function AssigningRecruiterState() {
  return (
    <div className="flex items-center gap-2">
      <RecruiterIconCircle>
        <Loader2 className="h-3 w-3 animate-spin" />
      </RecruiterIconCircle>
      <span className="text-xs text-muted-foreground">
        Updating... (auto-reset in {ASSIGNMENT_AUTO_RESET_MS / 1000}s)
      </span>
    </div>
  );
}

function AssignRecruiterPrompt() {
  return (
    <div className="flex items-center gap-2">
      <RecruiterIconCircle>
        <UserPlus className="h-3 w-3 text-gray-500" />
      </RecruiterIconCircle>
      <span className="text-sm text-muted-foreground">Assign recruiter</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
    </div>
  );
}

function UnassignedRecruiter({ label }: { label: string }) {
  return (
    <>
      <RecruiterIconCircle>
        <UserX className="h-3 w-3 text-gray-500" />
      </RecruiterIconCircle>
      <span className="text-sm text-muted-foreground">{label}</span>
    </>
  );
}
