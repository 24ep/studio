"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, RotateCcw, UserMinus, Users } from 'lucide-react';
import {
  buildDesktopEvaluateInterviewerStyle,
  getDesktopEvaluateInterviewerFallbackName,
  getDesktopEvaluateInterviewerPositionTitle,
  shouldShowDesktopEvaluateInterviewerMenu,
  shouldShowDesktopEvaluateInterviewerMenuSeparator,
} from './utils';
import type { DesktopInterviewerTabsProps } from './DesktopEvaluatePagePartTypes';
import type { EvaluationSummary, Interviewer } from './types';

export function DesktopEvaluateInterviewerTabs(props: DesktopInterviewerTabsProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
        <Users className="h-4 w-4" /> Interviewer
      </h3>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {props.interviewers.map((interviewer) => (
          <DesktopEvaluateInterviewerTab
            key={interviewer.userId}
            interviewer={interviewer}
            evaluation={props.allEvaluations.get(interviewer.userId)}
            isSelected={props.selectedInterviewerId === interviewer.userId}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopEvaluateInterviewerTab({
  interviewer,
  evaluation,
  isSelected,
  ...props
}: DesktopInterviewerTabsProps & {
  interviewer: Interviewer;
  evaluation?: EvaluationSummary;
  isSelected: boolean;
}) {
  const hasEvaluation = !!evaluation;
  const interviewerStyle = buildDesktopEvaluateInterviewerStyle(props, isSelected);
  const showMenu = shouldShowDesktopEvaluateInterviewerMenu({
    canResetEvaluation: props.canResetEvaluation,
    canRemoveInterviewer: props.canRemoveInterviewer,
    hasEvaluation,
  });
  const positionTitleText = getDesktopEvaluateInterviewerPositionTitle(interviewer, props.positionTitle);

  return (
    <div
      className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-full cursor-pointer transition-all flex-shrink-0 shadow-sm hover:scale-105"
      style={interviewerStyle}
    >
      <div
        className="flex items-center gap-2 flex-1"
        onClick={() => props.onInterviewerSelect(interviewer.userId)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            props.onInterviewerSelect(interviewer.userId);
          }
        }}
      >
        <Avatar className="rounded-full h-8 w-8 border border-background">
          <AvatarImage src={interviewer.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">{getDesktopEvaluateInterviewerFallbackName(interviewer)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start leading-none ml-1">
          <span className="text-sm font-medium">{interviewer.userName}</span>
          {positionTitleText && (
            <span className="text-[10px] opacity-80 mt-0.5 font-normal">
              {positionTitleText}
            </span>
          )}
        </div>
      </div>

      {showMenu ? (
        <DesktopEvaluateInterviewerMenu
          interviewer={interviewer}
          evaluation={evaluation}
          hasEvaluation={hasEvaluation}
          {...props}
        />
      ) : (
        <div className="w-2" />
      )}
    </div>
  );
}

function DesktopEvaluateInterviewerMenu({
  interviewer,
  evaluation,
  hasEvaluation,
  canResetEvaluation,
  canRemoveInterviewer,
  onResetEvaluation,
  onRemoveInterviewer,
}: Pick<DesktopInterviewerTabsProps, 'canResetEvaluation' | 'canRemoveInterviewer' | 'onResetEvaluation' | 'onRemoveInterviewer'> & {
  interviewer: Interviewer;
  evaluation?: EvaluationSummary;
  hasEvaluation: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
          title="More options"
          aria-label="More interviewer options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canResetEvaluation && hasEvaluation && (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              if (evaluation?.id) {
                onResetEvaluation?.(interviewer.userId, evaluation.id);
              }
            }}
            className="flex items-center gap-2 text-orange-600"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Evaluation
          </DropdownMenuItem>
        )}
        {shouldShowDesktopEvaluateInterviewerMenuSeparator({
          canResetEvaluation,
          canRemoveInterviewer,
          hasEvaluation,
        }) && (
          <DropdownMenuSeparator />
        )}
        {canRemoveInterviewer && (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onRemoveInterviewer?.(interviewer.userId);
            }}
            className="flex items-center gap-2 text-destructive"
          >
            <UserMinus className="h-4 w-4" />
            Remove Interviewer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
