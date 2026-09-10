import { NextResponse, type NextRequest } from 'next/server';
import { requireFitScoreCountsSession } from './fit-score-counts-auth';
import { fetchFitScoreCounts } from './fit-score-counts-data';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetFitScoreCounts(request: NextRequest) {
  try {
    const authorization = await requireFitScoreCountsSession();
    if (!authorization.ok) {
      return authorization.response;
    }

    const { searchParams } = new URL(request.url);
    return NextResponse.json(await fetchFitScoreCounts(searchParams));
  } catch (error) {
    console.error('Fit score counts API error:', error);
    return NextResponse.json({
      message: 'Error fetching fit score counts',
      error: getErrorMessage(error),
    }, { status: 500 });
  }
}
