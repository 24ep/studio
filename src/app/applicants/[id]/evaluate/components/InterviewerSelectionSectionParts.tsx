"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Interviewer } from '../types';

import {
  buildInterviewerSelectionStyle,
  getInterviewerDisplayName,
  getInterviewerInitials,
  type InterviewerSelectionStyleInput,
} from './interviewer-selection-utils';

interface InterviewerSelectionListProps {
  interviewers: Interviewer[];
  selectedInterviewerId: string | null;
  styleInput: InterviewerSelectionStyleInput;
  onInterviewerClick: (interviewer: Interviewer) => void;
}

export function MobileInterviewerCarousel({
  interviewers,
  selectedInterviewerId,
  styleInput,
  onInterviewerClick,
}: InterviewerSelectionListProps) {
  return (
    <div className="block md:hidden">
      {interviewers.length > 0 ? (
        <div
          className="overflow-x-auto pb-2 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex items-center gap-3 px-2">
            {interviewers.map((interviewer, index) => (
              <MobileInterviewerButton
                key={interviewer.id || index}
                interviewer={interviewer}
                isSelected={selectedInterviewerId === interviewer.userId}
                styleInput={styleInput}
                onClick={() => onInterviewerClick(interviewer)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-left">No interviewers assigned to this position</div>
      )}
    </div>
  );
}

function MobileInterviewerButton({
  interviewer,
  isSelected,
  onClick,
  styleInput,
}: {
  interviewer: Interviewer;
  isSelected: boolean;
  onClick: () => void;
  styleInput: InterviewerSelectionStyleInput;
}) {
  const name = getInterviewerDisplayName(interviewer);
  const initials = getInterviewerInitials(name);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all flex-shrink-0 shadow-sm hover:scale-105 active:scale-95"
      style={buildInterviewerSelectionStyle(styleInput, isSelected)}
    >
      <Avatar className="rounded-full h-8 w-8 border border-background">
        <AvatarImage src={interviewer.avatarUrl || undefined} alt={name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start leading-none ml-1">
        <span className="text-sm font-medium whitespace-nowrap">{name}</span>
        {interviewer.positionTitle && (
          <span className="text-xs opacity-90 mt-0.5 font-normal whitespace-nowrap">
            {interviewer.positionTitle}
          </span>
        )}
      </div>
    </button>
  );
}

export function DesktopInterviewerList({
  interviewers,
  selectedInterviewerId,
  styleInput,
  onInterviewerClick,
}: InterviewerSelectionListProps) {
  return (
    <div className="hidden md:block">
      <ScrollArea className="h-[calc(100vh-18rem)] min-h-[400px]">
        <div className="space-y-3 text-left">
          {interviewers.map((interviewer, index) => (
            <DesktopInterviewerRow
              key={interviewer.id || index}
              interviewer={interviewer}
              isSelected={selectedInterviewerId === interviewer.userId}
              styleInput={styleInput}
              onClick={() => onInterviewerClick(interviewer)}
            />
          ))}
          {interviewers.length === 0 && (
            <div className="text-base text-muted-foreground text-left">No interviewers assigned to this position</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DesktopInterviewerRow({
  interviewer,
  isSelected,
  onClick,
  styleInput,
}: {
  interviewer: Interviewer;
  isSelected: boolean;
  onClick: () => void;
  styleInput: InterviewerSelectionStyleInput;
}) {
  const name = getInterviewerDisplayName(interviewer);
  const initials = getInterviewerInitials(name);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={onClick}
        className="w-full p-3 text-left transition-all duration-200 rounded-md hover:scale-105 hover:shadow-lg active:scale-95"
        style={buildInterviewerSelectionStyle(styleInput, isSelected)}
      >
        <div className="flex items-center gap-3 justify-start">
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={interviewer.avatarUrl || undefined} alt={name} />
            <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left flex-1">
            <div className="text-base font-medium truncate text-left">{name}</div>
            <div className="text-sm truncate text-left">{interviewer.userRole || interviewer.userEmail || ''}</div>
            {interviewer.positionTitle && (
              <div className="text-sm truncate text-left mt-0.5 opacity-80">{interviewer.positionTitle}</div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
