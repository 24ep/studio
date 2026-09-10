import type { CSSProperties } from 'react';
import type { Interviewer } from '../types';

export interface InterviewerSelectionStyleInput {
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
}

export function getInterviewerDisplayName(interviewer: Pick<Interviewer, 'userName' | 'userEmail'>) {
  return interviewer.userName || interviewer.userEmail || 'Interviewer';
}

export function getInterviewerInitials(name: string) {
  return name
    .split(' ')
    .map(part => part?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function hasColorValue(value: string) {
  return value.trim() !== '';
}

function getHslColor(value: string, fallback: string) {
  return hasColorValue(value) ? `hsl(${value})` : fallback;
}

export function buildInterviewerSelectionStyle(
  input: InterviewerSelectionStyleInput,
  isSelected: boolean,
): CSSProperties {
  if (isSelected) {
    return {
      ...(hasColorValue(input.interviewerSelectedBgColor) && input.interviewerSelectedBgColor.includes('gradient')
        ? { background: input.interviewerSelectedBgColor }
        : { backgroundColor: getHslColor(input.interviewerSelectedBgColor, 'hsl(220 25% 97%)') }
      ),
      color: getHslColor(input.interviewerSelectedTextColor, 'hsl(0 0% 0%)'),
      borderColor: getHslColor(input.interviewerSelectedBorderColor, 'hsl(220 15% 50%)'),
      borderWidth: input.interviewerSelectedBorderWidth || '2px',
      borderStyle: 'solid',
    };
  }

  return {
    backgroundColor: getHslColor(input.interviewerNonSelectedBgColor, 'hsl(220 25% 97%)'),
    color: getHslColor(input.interviewerNonSelectedTextColor, 'hsl(220 25% 50%)'),
    borderColor: getHslColor(input.interviewerNonSelectedBorderColor, 'hsl(220 15% 85%)'),
    borderWidth: input.interviewerNonSelectedBorderWidth || '1px',
    borderStyle: 'solid',
  };
}
