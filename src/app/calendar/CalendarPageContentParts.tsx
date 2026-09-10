"use client";

import { Button } from '@/components/ui/button';
import { DesktopEvaluateCalendar, MobileEvaluateCalendar } from '@/components/ui/evaluate-calendar';
import { cn } from '@/lib/utils';
import { FileCheck, Loader2, Plus } from 'lucide-react';
import type {
  ApplicantReminder,
  ApplicantWithEvaluationLink,
} from './calendar-page-utils';

interface CalendarPageLoadingStateProps {
  fullScreen?: boolean;
}

interface CalendarPageErrorStateProps {
  error: string;
  isMobile: boolean;
  onRetry: () => void;
}

interface CalendarPageMainContentProps {
  applicants: ApplicantWithEvaluationLink[];
  isMobile: boolean;
  reminders: ApplicantReminder[];
  selectedDate: Date;
  onApplicantClick: (applicantId: string, isReminder?: boolean) => void;
  onScheduleApplicant: (applicantId: string, interviewDateTime: string) => Promise<void>;
  onCreateLink: () => void;
  onDateSelect: (date: Date) => void;
}

export function CalendarPageLoadingState({ fullScreen = true }: CalendarPageLoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center", fullScreen ? "min-h-screen" : "h-[calc(100vh-8rem)]")}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function CalendarPageErrorState({
  error,
  isMobile,
  onRetry,
}: CalendarPageErrorStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen",
      isMobile ? "p-4" : "p-6"
    )}>
      <div className={cn("w-full text-center", isMobile ? "max-w-sm" : "max-w-md")}>
        <FileCheck className={cn(
          "text-destructive mx-auto mb-4",
          isMobile ? "h-10 w-10" : "h-12 w-12"
        )} />
        <h2 className={cn(
          "font-semibold mb-2 text-destructive",
          isMobile ? "text-base" : "text-lg"
        )}>
          Error Loading Evaluation Links
        </h2>
        <p className={cn("text-muted-foreground mb-6", isMobile ? "text-sm" : "text-base")}>
          {error}
        </p>
        <div className="space-y-2">
          <Button onClick={onRetry} className="w-full" size={isMobile ? "default" : "lg"}>
            Retry
          </Button>
          {error.includes('permission') && (
            <p className="text-xs text-muted-foreground mt-4">
              If you believe you should have access, please contact your administrator.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarPageMainContent({
  applicants,
  isMobile,
  reminders,
  selectedDate,
  onApplicantClick,
  onCreateLink,
  onDateSelect,
  onScheduleApplicant,
}: CalendarPageMainContentProps) {
  return (
    <div className={cn("w-full py-4", isMobile ? "px-4 pb-24" : "px-6")}>
      {isMobile && <CalendarPageHeader isMobile={isMobile} onCreateLink={onCreateLink} />}
      {applicants.length === 0 && isMobile ? (
        <CalendarEmptyState onCreateLink={onCreateLink} />
      ) : isMobile ? (
        <MobileEvaluateCalendar
          applicants={applicants}
          reminders={reminders}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onApplicantClick={onApplicantClick}
        />
      ) : (
        <DesktopEvaluateCalendar
          applicants={applicants}
          reminders={reminders}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onApplicantClick={onApplicantClick}
          onCreateLink={onCreateLink}
          onScheduleApplicant={onScheduleApplicant}
        />
      )}
    </div>
  );
}

export function CalendarMobileCreateButton({
  isMobile,
  onCreateLink,
}: {
  isMobile: boolean;
  onCreateLink: () => void;
}) {
  if (!isMobile) return null;

  return (
    <Button
      onClick={onCreateLink}
      className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
      size="icon"
      aria-label="Create evaluation link"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}

function CalendarPageHeader({
  isMobile,
  onCreateLink,
}: {
  isMobile: boolean;
  onCreateLink: () => void;
}) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          All evaluation sessions (active, expired, and passed)
        </p>
      </div>
      <Button
        onClick={onCreateLink}
        className={cn("items-center gap-2", isMobile ? "hidden" : "flex")}
      >
        <Plus className="h-4 w-4" />
        Create Evaluate Link
      </Button>
    </div>
  );
}

function CalendarEmptyState({ onCreateLink }: { onCreateLink: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        No evaluation sessions
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Evaluation sessions will appear here.
      </p>
      <Button onClick={onCreateLink} variant="outline" className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        New Evaluation Session
      </Button>
    </div>
  );
}
