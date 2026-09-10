import { NextRequest, NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graphClient';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobTitle = searchParams.get('jobTitle');

    if (!jobTitle) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    try {
      const client = await getGraphClient();

      // Search for users with the given job title
      // We use $filter with 'startswith' or 'eq' depending on strictness. 
      // Users often have slightly different titles, but exact match is safer for "list employees for THIS position"
      // Let's use exact match for now as per requirement "if that position (job title) if have on AD"
      
      // Escape single quotes in jobTitle to prevent injection in OData filter
      // Also trim to avoid issues with trailing spaces
      const cleanedJobTitle = jobTitle.trim();
      const safeJobTitle = cleanedJobTitle.replace(/'/g, "''");
      
      // Use explicit string with parentheses for filter to ensure it's not truncated or malformed
      const filterClause = `(jobTitle eq '${safeJobTitle}')`;
      
      const response = await client.api('/users')
        .filter(filterClause)
        .select('id,displayName,mail,jobTitle,department,mobilePhone')
        .top(100)
        .get();

      return NextResponse.json({ 
        users: response.value || [] 
      });

    } catch (error) {
      console.error('[API] Error fetching AD users:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check for specific error like "Azure AD not configured"
      if (errorMessage.includes('Azure AD is not configured') || errorMessage.includes('credential')) {
         return NextResponse.json({ 
           users: [], 
           error: 'Azure AD is not configured', 
           isConfigured: false 
         });
      }

      return NextResponse.json({ error: 'Failed to fetch users from Azure AD' }, { status: 500 });
    }

  } catch (error) {
    console.error('[API] Unexpected error in AD users endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
