import { fetchGraphCollection } from './graph-collection-fetch';
import {
  normalizeGraphMeetingRoom,
  normalizeGraphRoomList,
  normalizeGraphRoomMailbox,
} from './graph-meeting-room-normalizers';
import type {
  GraphMeetingRoom,
  GraphRoomList,
  MeetingRoom,
  RoomList,
} from './graph-meeting-room-types';

const GRAPH_ROOM_ENDPOINTS = {
  placesRooms: 'https://graph.microsoft.com/v1.0/places/microsoft.graph.room',
  roomMailboxes: 'https://graph.microsoft.com/v1.0/users?$filter=recipientType eq \'Room\'&$select=id,displayName,mail,mailboxSettings',
  roomLists: 'https://graph.microsoft.com/v1.0/places/microsoft.graph.roomList',
} as const;

interface GraphRoomSource<T> {
  endpoint: string;
  fetchFailureLog: string;
  sourceFailureLog: string;
  normalize: (item: T) => MeetingRoom;
}

async function fetchMeetingRoomSource<T>(
  accessToken: string,
  source: GraphRoomSource<T>
) {
  try {
    const rooms = await fetchGraphCollection<T>(
      source.endpoint,
      accessToken,
      source.fetchFailureLog
    );

    return rooms.map(source.normalize);
  } catch (error) {
    console.error(source.sourceFailureLog, error);
    return [];
  }
}

export function fetchRoomsFromPlacesAPI(accessToken: string): Promise<MeetingRoom[]> {
  return fetchMeetingRoomSource<GraphMeetingRoom>(accessToken, {
    endpoint: GRAPH_ROOM_ENDPOINTS.placesRooms,
    fetchFailureLog: '[GraphClient] Places API failed:',
    sourceFailureLog: '[GraphClient] Error in fetchRoomsFromPlacesAPI:',
    normalize: normalizeGraphMeetingRoom,
  });
}

export function fetchRoomMailboxes(accessToken: string): Promise<MeetingRoom[]> {
  return fetchMeetingRoomSource<GraphMeetingRoom>(accessToken, {
    endpoint: GRAPH_ROOM_ENDPOINTS.roomMailboxes,
    fetchFailureLog: '[GraphClient] Room mailboxes API failed:',
    sourceFailureLog: '[GraphClient] Error in fetchRoomMailboxes:',
    normalize: normalizeGraphRoomMailbox,
  });
}

export async function fetchRoomListsFromGraph(accessToken: string): Promise<RoomList[]> {
  try {
    const lists = await fetchGraphCollection<GraphRoomList>(
      GRAPH_ROOM_ENDPOINTS.roomLists,
      accessToken,
      '[GraphClient] Failed to fetch room lists:'
    );

    return lists.map(normalizeGraphRoomList);
  } catch (error) {
    console.error('[GraphClient] Error fetching room lists:', error);
    return [];
  }
}
