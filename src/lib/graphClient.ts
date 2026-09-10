/**
 * Microsoft Graph API Client
 *
 * Compatibility export surface for Azure AD / Microsoft Graph helpers.
 */

export {
  getGraphAccessToken,
  getGraphClient,
  isGraphConfigured,
  isGraphConfiguredAsync,
} from './graph/graph-auth';

export {
  fetchMeetingRooms,
  fetchRoomLists,
  testGraphConnection,
  type MeetingRoom,
} from './graph/graph-meeting-rooms';

export {
  createCalendarEvent,
  type CreateCalendarEventParams,
  type GraphOperationResult,
} from './graph/graph-calendar-events';

