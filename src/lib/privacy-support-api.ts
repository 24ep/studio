import { NextResponse } from 'next/server';

export async function handlePrivacySupportApi(
  operation: string,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(`[PRIVACY SUPPORT] ${operation} failed`, error);
    return NextResponse.json(
      { message: 'The privacy support service is temporarily unavailable.' },
      { status: 500 },
    );
  }
}
