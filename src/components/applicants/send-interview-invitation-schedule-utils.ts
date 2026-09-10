import type { MeetingRoom } from './send-interview-invitation-api';

export function shouldClearLocationForRoomMode(rooms: MeetingRoom[], location: string) {
  return !rooms.some((room) => room.displayName === location);
}

export function parseInterviewDurationInput(value: string, fallback = 60) {
  return parseInt(value, 10) || fallback;
}

export function getInterviewDurationLabel(duration: number) {
  return `Duration: ${Math.floor(duration / 60)}h ${duration % 60}m`;
}
