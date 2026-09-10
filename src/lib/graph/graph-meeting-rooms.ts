import {
  getGraphAccessToken,
  isGraphConfiguredAsync,
} from './graph-auth';
import {
  fetchRoomListsFromGraph,
  fetchRoomMailboxes,
  fetchRoomsFromPlacesAPI,
} from './graph-meeting-room-sources';
import {
  getGraphErrorMessage,
} from './graph-meeting-room-normalizers';
import type {
  GraphConnectionTestResult,
  MeetingRoom,
  RoomList,
} from './graph-meeting-room-types';

export type { MeetingRoom, RoomList } from './graph-meeting-room-types';

async function getGraphAccessTokenOrWarn(warning: string) {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    console.warn(warning);
  }

  return accessToken;
}

export async function fetchMeetingRooms(): Promise<MeetingRoom[]> {
  const accessToken = await getGraphAccessTokenOrWarn(
    '[GraphClient] No access token available for fetching meeting rooms'
  );

  if (!accessToken) return [];

  try {
    const roomSources = [fetchRoomsFromPlacesAPI, fetchRoomMailboxes];

    for (const fetchRooms of roomSources) {
      const rooms = await fetchRooms(accessToken);
      if (rooms.length > 0) return rooms;
    }

    console.warn('[GraphClient] No rooms found via any method');
    return [];
  } catch (error) {
    console.error('[GraphClient] Error fetching meeting rooms:', error);
    return [];
  }
}

export async function fetchRoomLists(): Promise<RoomList[]> {
  const accessToken = await getGraphAccessToken();
  return accessToken ? fetchRoomListsFromGraph(accessToken) : [];
}

async function getGraphConnectionFailure(): Promise<GraphConnectionTestResult | null> {
  const isConfigured = await isGraphConfiguredAsync();
  if (!isConfigured) {
    return { success: false, error: 'Azure AD is not configured. Please configure credentials in System Settings or environment variables.' };
  }

  const token = await getGraphAccessToken();
  if (!token) {
    return { success: false, error: 'Failed to obtain access token. Please check your Azure AD credentials and permissions.' };
  }

  return null;
}

export async function testGraphConnection(): Promise<GraphConnectionTestResult> {
  try {
    const connectionFailure = await getGraphConnectionFailure();
    if (connectionFailure) return connectionFailure;

    const rooms = await fetchMeetingRooms();
    return { success: true, roomCount: rooms.length };
  } catch (error) {
    return {
      success: false,
      error: getGraphErrorMessage(error),
    };
  }
}
