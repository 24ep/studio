// src/app/api/ai/search-candidates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { checkRateLimit } from '@/lib/redis';

interface AISearchRequest {
  query: string;
  filters?: {
    positionIds?: string[];
    statuses?: string[];
    minFitScore?: number;
    maxFitScore?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  searchType?: 'semantic' | 'exact' | 'hybrid';
  limit?: number;
}

interface CandidateSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: {
    id: string;
    title: string;
    department?: string;
  };
  currentStage: string;
  fitScore: number;
  applicationDate: string;
  lastUpdated: string;
  matchScore: number;
  matchReasons: string[];
  highlights: {
    field: string;
    value: string;
    relevance: number;
  }[];
  parsedData?: {
    personal_info?: any;
    contact_info?: any;
    education?: any[];
    experience?: any[];
    skills?: any[];
    job_suitable?: any[];
  };
}

// AI-powered search function
async function performAISearch(
  query: string,
  candidates: any[],
  searchType: 'semantic' | 'exact' | 'hybrid' = 'hybrid'
): Promise<CandidateSearchResult[]> {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  return candidates.map(candidate => {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const highlights: { field: string; value: string; relevance: number }[] = [];

    // Basic text matching
    const searchableText = [
      candidate.name,
      candidate.email,
      candidate.phone,
      candidate.position?.title,
      candidate.position?.department,
      candidate.currentStage,
      candidate.parsedData?.personal_info?.firstname,
      candidate.parsedData?.personal_info?.lastname,
      candidate.parsedData?.personal_info?.location,
      candidate.parsedData?.contact_info?.email,
      candidate.parsedData?.contact_info?.phone,
    ].filter(Boolean).join(' ').toLowerCase();

    // Exact matches
    if (searchType === 'exact' || searchType === 'hybrid') {
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          matchScore += 10;
          matchReasons.push(`Exact match: "${term}"`);
          
          // Find where the match occurred
          if (candidate.name.toLowerCase().includes(term)) {
            highlights.push({ field: 'name', value: candidate.name, relevance: 10 });
          }
          if (candidate.email.toLowerCase().includes(term)) {
            highlights.push({ field: 'email', value: candidate.email, relevance: 8 });
          }
          if (candidate.position?.title.toLowerCase().includes(term)) {
            highlights.push({ field: 'position', value: candidate.position.title, relevance: 9 });
          }
        }
      }
    }

    // Semantic matching for skills and experience
    if (searchType === 'semantic' || searchType === 'hybrid') {
      const skills = candidate.parsedData?.skills || [];
      const experience = candidate.parsedData?.experience || [];
      const education = candidate.parsedData?.education || [];
      const jobSuitable = candidate.parsedData?.job_suitable || [];

      // Skills matching
      for (const skill of skills) {
        const skillText = `${skill.segment_skill} ${skill.skill_string}`.toLowerCase();
        for (const term of searchTerms) {
          if (skillText.includes(term)) {
            matchScore += 7;
            matchReasons.push(`Skill match: "${skill.segment_skill}"`);
            highlights.push({ 
              field: 'skills', 
              value: skill.segment_skill, 
              relevance: 7 
            });
          }
        }
      }

      // Experience matching
      for (const exp of experience) {
        const expText = `${exp.company} ${exp.position} ${exp.description}`.toLowerCase();
        for (const term of searchTerms) {
          if (expText.includes(term)) {
            matchScore += 6;
            matchReasons.push(`Experience match: "${exp.company}"`);
            highlights.push({ 
              field: 'experience', 
              value: exp.company, 
              relevance: 6 
            });
          }
        }
      }

      // Education matching
      for (const edu of education) {
        const eduText = `${edu.university} ${edu.major} ${edu.field}`.toLowerCase();
        for (const term of searchTerms) {
          if (eduText.includes(term)) {
            matchScore += 5;
            matchReasons.push(`Education match: "${edu.university}"`);
            highlights.push({ 
              field: 'education', 
              value: edu.university, 
              relevance: 5 
            });
          }
        }
      }

      // Job suitability matching
      for (const job of jobSuitable) {
        const jobText = `${job.suitable_career} ${job.suitable_job_position} ${job.suitable_job_level}`.toLowerCase();
        for (const term of searchTerms) {
          if (jobText.includes(term)) {
            matchScore += 8;
            matchReasons.push(`Job suitability match: "${job.suitable_job_position}"`);
            highlights.push({ 
              field: 'job_suitable', 
              value: job.suitable_job_position, 
              relevance: 8 
            });
          }
        }
      }
    }

    // Fit score bonus
    if (candidate.fitScore > 80) {
      matchScore += 3;
      matchReasons.push('High fit score');
    } else if (candidate.fitScore > 60) {
      matchScore += 1;
      matchReasons.push('Good fit score');
    }

    // Recency bonus
    const daysSinceUpdate = Math.floor((Date.now() - new Date(candidate.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 7) {
      matchScore += 2;
      matchReasons.push('Recently updated');
    }

    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      currentStage: candidate.currentStage,
      fitScore: candidate.fitScore,
      applicationDate: candidate.applicationDate,
      lastUpdated: candidate.updatedAt,
      matchScore,
      matchReasons: [...new Set(matchReasons)], // Remove duplicates
      highlights: highlights.slice(0, 5), // Limit highlights
      parsedData: candidate.parsedData,
    };
  }).filter(result => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimitKey = `ai_search:${session.user.id}`;
  const rateLimit = await checkRateLimit(rateLimitKey, 10, 60); // 10 requests per minute
  
  if (!rateLimit.allowed) {
    return NextResponse.json({ 
      error: 'Rate limit exceeded', 
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime 
    }, { status: 429 });
  }

  try {
    const body: AISearchRequest = await request.json();
    const { query, filters, searchType = 'hybrid', limit = 50 } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters long' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Build the base query
      let sql = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.current_stage,
          c.fit_score,
          c.application_date,
          c.updated_at,
          c.parsed_data,
          p.id as position_id,
          p.title as position_title,
          p.department as position_department
        FROM candidates c
        LEFT JOIN positions p ON c.position_id = p.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters?.positionIds?.length) {
        sql += ` AND c.position_id = ANY($${paramIndex++})`;
        params.push(filters.positionIds);
      }

      if (filters?.statuses?.length) {
        sql += ` AND c.current_stage = ANY($${paramIndex++})`;
        params.push(filters.statuses);
      }

      if (filters?.minFitScore !== undefined) {
        sql += ` AND c.fit_score >= $${paramIndex++}`;
        params.push(filters.minFitScore);
      }

      if (filters?.maxFitScore !== undefined) {
        sql += ` AND c.fit_score <= $${paramIndex++}`;
        params.push(filters.maxFitScore);
      }

      if (filters?.dateRange?.start) {
        sql += ` AND c.application_date >= $${paramIndex++}`;
        params.push(filters.dateRange.start);
      }

      if (filters?.dateRange?.end) {
        sql += ` AND c.application_date <= $${paramIndex++}`;
        params.push(filters.dateRange.end);
      }

      sql += ` ORDER BY c.updated_at DESC LIMIT $${paramIndex++}`;
      params.push(limit * 2); // Get more candidates for AI processing

      const result = await client.query(sql, params);
      const candidates = result.rows.map(row => ({
        ...row,
        position: row.position_id ? {
          id: row.position_id,
          title: row.position_title,
          department: row.position_department,
        } : null,
        parsedData: row.parsed_data ? JSON.parse(row.parsed_data) : null,
      }));

      // Perform AI-powered search
      const searchResults = await performAISearch(query, candidates, searchType);

      // Log the search
      await logAudit('INFO', `AI search performed: "${query}"`, 'AI:Search', session.user.id, {
        query,
        searchType,
        resultsCount: searchResults.length,
        totalCandidates: candidates.length,
      });

      // Create collaboration event
      const { publishCollaborationEvent } = await import('@/lib/redis');
      await publishCollaborationEvent({
        type: 'candidate_update',
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        entityId: 'search',
        entityType: 'candidate_search',
        data: {
          query,
          searchType,
          resultsCount: searchResults.length,
        },
      });

      return NextResponse.json({
        results: searchResults.slice(0, limit),
        totalFound: searchResults.length,
        searchQuery: query,
        searchType,
        reasoning: `Found ${searchResults.length} candidates matching "${query}" using ${searchType} search`,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        },
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('AI search error:', error);
    
    await logAudit('ERROR', `AI search failed: ${(error as Error).message}`, 'AI:Search', session.user.id, {
      query: body.query,
      error: (error as Error).message,
    });

    return NextResponse.json({ 
      error: 'Failed to perform AI search',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const searchType = searchParams.get('type') as 'semantic' | 'exact' | 'hybrid' || 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Use the same logic as POST
    const body: AISearchRequest = {
      query,
      searchType,
      limit,
    };

    const mockRequest = {
      json: () => Promise.resolve(body),
    } as NextRequest;

    return POST(mockRequest);

  } catch (error) {
    console.error('AI search GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform AI search',
      details: (error as Error).message 
    }, { status: 500 });
  }
}
