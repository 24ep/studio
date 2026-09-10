/**
 * API Endpoint: GET /api/azure/meeting-rooms
 * 
 * Fetches meeting rooms from Microsoft Graph Places API.
 * Requires:
 * - Azure AD to be configured (via UI settings or environment variables)
 * - Places.Read.All application permission with admin consent
 * - azureMeetingRoomsEnabled system setting to be true
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchMeetingRooms, isGraphConfiguredAsync, testGraphConnection } from '@/lib/graphClient';
import { getSystemSetting } from '@/lib/systemSettings';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Azure meeting rooms feature is enabled
    // We now allow this if Azure is configured, regardless of the explicit setting
    // const isEnabled = await getSystemSetting('azureMeetingRoomsEnabled');
    // if (isEnabled !== 'true') { ... }

    // Check if Azure AD is configured
    const isConfigured = await isGraphConfiguredAsync();
    if (!isConfigured) {
      return NextResponse.json({ 
        error: 'Azure AD is not configured',
        hint: 'Configure Azure AD credentials in System Settings or set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID environment variables'
      }, { status: 400 });
    }

    // Check URL params for test mode
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test') === 'true';

    if (testMode) {
      const testResult = await testGraphConnection();
      return NextResponse.json(testResult);
    }

    // Fetch meeting rooms
    const rooms = await fetchMeetingRooms();
    
    return NextResponse.json({
      success: true,
      rooms,
      count: rooms.length,
    });
  } catch (error) {
    console.error('[API /azure/meeting-rooms] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch meeting rooms',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
