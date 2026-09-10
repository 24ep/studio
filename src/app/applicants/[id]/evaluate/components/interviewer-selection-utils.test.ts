import { describe, expect, it } from 'vitest';

import {
  buildInterviewerSelectionStyle,
  getInterviewerDisplayName,
  getInterviewerInitials,
} from './interviewer-selection-utils';

const baseStyleInput = {
  interviewerSelectedBgColor: '220 25% 97%',
  interviewerSelectedTextColor: '0 0% 0%',
  interviewerSelectedBorderColor: '220 15% 50%',
  interviewerSelectedBorderWidth: '2px',
  interviewerNonSelectedBgColor: '220 25% 97%',
  interviewerNonSelectedTextColor: '220 25% 50%',
  interviewerNonSelectedBorderColor: '220 15% 85%',
  interviewerNonSelectedBorderWidth: '1px',
};

describe('interviewer selection utilities', () => {
  it('derives display names and initials', () => {
    expect(getInterviewerDisplayName({ userName: 'Ada Lovelace', userEmail: 'ada@example.com' })).toBe('Ada Lovelace');
    expect(getInterviewerDisplayName({ userName: '', userEmail: 'ada@example.com' })).toBe('ada@example.com');
    expect(getInterviewerDisplayName({ userName: '', userEmail: undefined })).toBe('Interviewer');
    expect(getInterviewerInitials('Ada Lovelace')).toBe('AL');
    expect(getInterviewerInitials('Ada')).toBe('A');
  });

  it('builds selected styles with gradients or hsl fallbacks', () => {
    expect(buildInterviewerSelectionStyle({
      ...baseStyleInput,
      interviewerSelectedBgColor: 'linear-gradient(red, blue)',
    }, true)).toMatchObject({
      background: 'linear-gradient(red, blue)',
      borderWidth: '2px',
    });

    expect(buildInterviewerSelectionStyle({
      ...baseStyleInput,
      interviewerSelectedBgColor: '',
      interviewerSelectedTextColor: '',
      interviewerSelectedBorderColor: '',
      interviewerSelectedBorderWidth: '',
    }, true)).toMatchObject({
      backgroundColor: 'hsl(220 25% 97%)',
      color: 'hsl(0 0% 0%)',
      borderColor: 'hsl(220 15% 50%)',
      borderWidth: '2px',
    });
  });

  it('builds non-selected styles with defaults', () => {
    expect(buildInterviewerSelectionStyle({
      ...baseStyleInput,
      interviewerNonSelectedBgColor: '',
      interviewerNonSelectedTextColor: '',
      interviewerNonSelectedBorderColor: '',
      interviewerNonSelectedBorderWidth: '',
    }, false)).toMatchObject({
      backgroundColor: 'hsl(220 25% 97%)',
      color: 'hsl(220 25% 50%)',
      borderColor: 'hsl(220 15% 85%)',
      borderWidth: '1px',
    });
  });
});
