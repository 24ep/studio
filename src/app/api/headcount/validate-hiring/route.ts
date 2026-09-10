export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateApplicantHiringStatus } from '@/lib/headcountUtils';

import { auth } from '@/auth';
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');
    const positionId = searchParams.get('positionId');

    if (!applicantId || !positionId) {
      return NextResponse.json(
        { error: 'Missing required parameters: applicantId and positionId' },
        { status: 400 }
      );
    }

    // Validate headcount availability
    const validationResult = await validateApplicantHiringStatus(applicantId, positionId);

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Error validating headcount for hiring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
