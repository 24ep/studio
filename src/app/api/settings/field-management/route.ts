import { NextResponse } from 'next/server';

import { logAudit } from '@/lib/auditLog';
import { getPlatformDataModels } from '@/lib/data-model-field-management';
import { requireCustomFieldSession } from '../custom-field-definitions/custom-field-definition-auth';
import { fetchCustomFieldDefinitions } from '../custom-field-definitions/custom-field-definition-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET() {
  const sessionResult = await requireCustomFieldSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  try {
    const customFields = await fetchCustomFieldDefinitions(null);
    return NextResponse.json({
      models: getPlatformDataModels(customFields),
    }, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Failed to fetch field-management data:', error);
    await logAudit(
      'ERROR',
      `Failed to fetch field-management data. Error: ${message}`,
      'API:FieldManagement:Get',
      sessionResult.session.user.id,
    );
    return NextResponse.json({ message: 'Error fetching field-management data', error: message }, { status: 500 });
  }
}
