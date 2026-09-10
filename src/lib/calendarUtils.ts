/**
 * Calendar utility for generating iCal (.ics) files
 * Implements RFC 5545 standard
 */

export interface CalendarEventDetails {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
    rsvp?: boolean;
    role?: string;
    cutype?: string;
  }>;
  uid?: string;
}

/**
 * Escape text for iCal format
 */
function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date to iCal format (UTC)
 */
function formatIcalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique identifier for the event
 */
function generateUid(): string {
  const timestamp = Date.now();
  // Use crypto for secure random ID generation
  let random: string;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    random = crypto.randomUUID().replace(/-/g, '').substring(0, 13);
  } else {
    random = Math.random().toString(36).substring(2, 15);
  }
  return `${timestamp}-${random}@recruitment-system`;
}

/**
 * Generate iCal (.ics) file content
 * @param eventDetails Event details
 * @returns ICS file content as string
 */
export function generateCalendarInvite(
  eventDetails: CalendarEventDetails
): string {
  const {
    title,
    description = '',
    startDate,
    endDate,
    location = '',
    organizer,
    attendees = [],
    uid = generateUid(),
  } = eventDetails;

  const lines: string[] = [];

  // iCal header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Recruitment System//Interview Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:REQUEST');

  // Event
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${formatIcalDate(new Date())}`);
  lines.push(`DTSTART:${formatIcalDate(startDate)}`);
  lines.push(`DTEND:${formatIcalDate(endDate)}`);
  lines.push(`SUMMARY:${escapeIcalText(title)}`);

  if (description) {
    // Split long descriptions into multiple lines (max 75 chars per line)
    const escapedDesc = escapeIcalText(description);
    const maxLineLength = 75;
    for (let i = 0; i < escapedDesc.length; i += maxLineLength) {
      const line = escapedDesc.substring(i, i + maxLineLength);
      if (i === 0) {
        lines.push(`DESCRIPTION:${line}`);
      } else {
        lines.push(` ${line}`);
      }
    }
  }

  if (location) {
    lines.push(`LOCATION:${escapeIcalText(location)}`);
  }

  if (organizer) {
    lines.push(
      `ORGANIZER;CN=${escapeIcalText(organizer.name)}:MAILTO:${organizer.email}`
    );
  }

  // Add attendees
  attendees.forEach((attendee) => {
    const parts = [`CN=${escapeIcalText(attendee.name)}`];
    if (attendee.cutype) {
      parts.push(`CUTYPE=${attendee.cutype}`);
    }
    if (attendee.role) {
      parts.push(`ROLE=${attendee.role}`);
    }
    parts.push(`RSVP=${attendee.rsvp !== false ? 'TRUE' : 'FALSE'}`);
    lines.push(
      `ATTENDEE;${parts.join(';')}:MAILTO:${attendee.email}`
    );
  });

  // Status
  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');

  // End event
  lines.push('END:VEVENT');

  // End calendar
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

