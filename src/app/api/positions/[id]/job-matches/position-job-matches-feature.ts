import { NextResponse } from 'next/server';
import { getSystemSetting } from '@/lib/systemSettings';

export async function disabledJobMatchesResponse() {
  const jobMatchFeatureEnabled = await getSystemSetting('jobMatchFeatureEnabled');
  if (jobMatchFeatureEnabled !== 'false') {
    return null;
  }

  return NextResponse.json(
    {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      message: 'Job match feature is disabled',
    },
    { status: 200 }
  );
}
