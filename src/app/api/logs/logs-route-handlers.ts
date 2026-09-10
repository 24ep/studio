import { NextResponse, type NextRequest } from 'next/server';
import { requireApiPermission } from '@/lib/api-route-guards';
import { createLogEntry, fetchLogs } from './logs-route-data';
import { parseLogsListQuery } from './logs-route-query';
import { parseCreateLogEntryBody } from './logs-route-request';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleCreateLogEntry(request: NextRequest) {
  const parsedBody = await parseCreateLogEntryBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const logEntry = await createLogEntry(parsedBody.input);
    return NextResponse.json(logEntry, { status: 201 });
  } catch (error) {
    console.error('Failed to create log entry:', error);
    return NextResponse.json(
      { message: 'Error creating log entry', error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function handleGetLogs(request: NextRequest) {
  const { response } = await requireApiPermission('LOGS_VIEW');
  if (response) {
    return response;
  }

  try {
    return NextResponse.json(await fetchLogs(parseLogsListQuery(request)));
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ message: 'Error fetching logs', error: getErrorMessage(error) }, { status: 500 });
  }
}
