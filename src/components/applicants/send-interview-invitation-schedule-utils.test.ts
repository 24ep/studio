import { describe, expect, it } from 'vitest';

import {
  getInterviewDurationLabel,
  parseInterviewDurationInput,
  shouldClearLocationForRoomMode,
} from './send-interview-invitation-schedule-utils';
import type { MeetingRoom } from './send-interview-invitation-api';

const rooms: MeetingRoom[] = [
  {
    id: 'room-1',
    displayName: 'HQ 1',
    emailAddress: 'hq1@example.com',
  },
];

describe('send-interview-invitation-schedule-utils', () => {
  it('detects when room mode should clear a custom location', () => {
    expect(shouldClearLocationForRoomMode(rooms, 'HQ 1')).toBe(false);
    expect(shouldClearLocationForRoomMode(rooms, 'Zoom')).toBe(true);
  });

  it('parses and formats interview duration controls', () => {
    expect(parseInterviewDurationInput('90')).toBe(90);
    expect(parseInterviewDurationInput('')).toBe(60);
    expect(parseInterviewDurationInput('0')).toBe(60);
    expect(getInterviewDurationLabel(75)).toBe('Duration: 1h 15m');
  });
});
