import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CountRow = {
  total: string | number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.user, 'applicantS_VIEW')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const client = await getPool().connect();
    
    try {
      // Check total Applicants
      const totalApplicantsQuery = 'SELECT COUNT(*) as total FROM "Applicant"';
      const totalResult = await client.query<CountRow>(totalApplicantsQuery);
      const totalApplicants = totalResult.rows[0].total;
      
      // Check Applicants with fit scores
      const fitScoreQuery = 'SELECT COUNT(*) as total FROM "Applicant" WHERE "fitScore" IS NOT NULL AND "fitScore" > 0';
      const fitScoreResult = await client.query<CountRow>(fitScoreQuery);
      const applicantsWithFitScores = fitScoreResult.rows[0].total;
      
      // Get sample Applicants with fit scores
      const sampleQuery = 'SELECT id, name, "fitScore" FROM "Applicant" WHERE "fitScore" IS NOT NULL AND "fitScore" > 0 LIMIT 5';
      const sampleResult = await client.query(sampleQuery);
      
      // Check JobMatch table
      const jobMatchQuery = 'SELECT COUNT(*) as total FROM "JobMatch" WHERE "fitScore" IS NOT NULL AND "fitScore" > 0';
      const jobMatchResult = await client.query<CountRow>(jobMatchQuery);
      const jobMatchesWithFitScores = jobMatchResult.rows[0].total;
      
      // Get sample job matches
      const sampleJobMatchQuery = 'SELECT "applicant_id", "fitScore" FROM "JobMatch" WHERE "fitScore" IS NOT NULL AND "fitScore" > 0 LIMIT 5';
      const sampleJobMatchResult = await client.query(sampleJobMatchQuery);
      
      return NextResponse.json({
        totalApplicants,
        applicantsWithFitScores,
        sampleApplicants: sampleResult.rows,
        jobMatchesWithFitScores,
        sampleJobMatches: sampleJobMatchResult.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Debug fit scores API error:', error);
    return NextResponse.json({ 
      message: 'Error fetching debug data', 
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}

