import type {
  GraphMeetingRoom,
  GraphMeetingRoomAddress,
  GraphRoomList,
  MeetingRoom,
  RoomList,
} from './graph-meeting-room-types';

function normalizeGraphMeetingRoomAddress(address: GraphMeetingRoomAddress) {
  return {
    city: address.city ?? null,
    countryOrRegion: address.countryOrRegion ?? null,
    postalCode: address.postalCode ?? null,
    state: address.state ?? null,
    street: address.street ?? null,
  };
}

export function normalizeGraphMeetingRoom(room: GraphMeetingRoom): MeetingRoom {
  return {
    id: room.id ?? '',
    displayName: room.displayName || room.nickname || 'Unknown Room',
    emailAddress: room.emailAddress || room.mail || '',
    capacity: room.capacity ?? null,
    building: room.building ?? null,
    floorNumber: room.floorNumber ?? null,
    isWheelChairAccessible: room.isWheelChairAccessible ?? null,
    address: room.address ? normalizeGraphMeetingRoomAddress(room.address) : null,
  };
}

export function normalizeGraphRoomMailbox(room: GraphMeetingRoom): MeetingRoom {
  return {
    ...normalizeGraphMeetingRoom(room),
    capacity: null,
    building: null,
    floorNumber: null,
    isWheelChairAccessible: null,
    address: null,
  };
}

export function normalizeGraphRoomList(list: GraphRoomList): RoomList {
  return {
    id: list.id ?? '',
    displayName: list.displayName || 'Unknown List',
    emailAddress: list.emailAddress || '',
  };
}

export function getGraphErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}
