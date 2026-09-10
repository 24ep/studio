import { describe, expect, it } from 'vitest';

import {
  getGraphErrorMessage,
  normalizeGraphMeetingRoom,
  normalizeGraphRoomList,
  normalizeGraphRoomMailbox,
} from './graph-meeting-room-normalizers';

describe('graph meeting room normalizers', () => {
  it('normalizes places API meeting rooms with safe fallbacks', () => {
    expect(normalizeGraphMeetingRoom({
      id: 'room-1',
      nickname: 'Focus Room',
      mail: 'focus@example.com',
      capacity: 4,
      address: {
        city: 'Bangkok',
        countryOrRegion: 'TH',
      },
    })).toEqual({
      id: 'room-1',
      displayName: 'Focus Room',
      emailAddress: 'focus@example.com',
      capacity: 4,
      building: null,
      floorNumber: null,
      isWheelChairAccessible: null,
      address: {
        city: 'Bangkok',
        countryOrRegion: 'TH',
        postalCode: null,
        state: null,
        street: null,
      },
    });

    expect(normalizeGraphMeetingRoom({})).toMatchObject({
      id: '',
      displayName: 'Unknown Room',
      emailAddress: '',
      address: null,
    });
  });

  it('normalizes mailbox rooms and room lists', () => {
    expect(normalizeGraphRoomMailbox({
      displayName: 'Mailbox Room',
      mail: 'mailbox@example.com',
      capacity: 12,
      building: 'HQ',
    })).toEqual({
      id: '',
      displayName: 'Mailbox Room',
      emailAddress: 'mailbox@example.com',
      capacity: null,
      building: null,
      floorNumber: null,
      isWheelChairAccessible: null,
      address: null,
    });

    expect(normalizeGraphRoomList({ emailAddress: 'list@example.com' })).toEqual({
      id: '',
      displayName: 'Unknown List',
      emailAddress: 'list@example.com',
    });
  });

  it('formats unknown graph errors without leaking object shapes', () => {
    expect(getGraphErrorMessage(new Error('Missing permission'))).toBe('Missing permission');
    expect(getGraphErrorMessage({ message: 'ignored' })).toBe('Unknown error');
  });
});
