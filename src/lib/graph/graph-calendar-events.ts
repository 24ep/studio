import { getGraphAccessToken } from './graph-auth';
import { getJsonString, readJsonObject } from '../response-json';

export interface GraphOperationResult {
  success: boolean;
  error?: string;
  eventId?: string;
}

export interface CreateCalendarEventParams {
  attendeeEmail: string;
  subject: string;
  body: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
}

function buildCalendarEventPayload(params: CreateCalendarEventParams) {
  return {
    subject: params.subject,
    body: {
      contentType: 'HTML',
      content: params.body,
    },
    start: {
      dateTime: params.startDateTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endDateTime.toISOString(),
      timeZone: 'UTC',
    },
    location: params.location ? {
      displayName: params.location,
    } : undefined,
    organizer: params.organizerEmail ? {
      emailAddress: {
        name: params.organizerName || params.organizerEmail,
        address: params.organizerEmail,
      },
    } : undefined,
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
  };
}

export async function createCalendarEvent(params: CreateCalendarEventParams): Promise<GraphOperationResult> {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    console.warn('[GraphClient] No access token available for creating calendar event');
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${params.attendeeEmail}/calendar/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildCalendarEventPayload(params)),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GraphClient] Failed to create calendar event:', response.status, errorText);

      if (response.status === 403) {
        console.error('[GraphClient] Permission denied - ensure Calendars.ReadWrite permission is configured and admin consent granted');
        return { success: false, error: 'Permission denied - missing Calendars.ReadWrite permission' };
      }

      return { success: false, error: `Failed to create calendar event: ${response.status}` };
    }

    return {
      success: true,
      eventId: getJsonString(await readJsonObject(response), 'id'),
    };
  } catch (error) {
    console.error('[GraphClient] Error creating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
