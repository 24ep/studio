// src/app/api/ai/search-candidates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
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

    // Prisma query construction
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { parsedData: { path: ['personal_info', 'location'], string_contains: query } },
        { parsedData: { path: ['skills'], string_contains: query } },
        { parsedData: { path: ['experience'], string_contains: query } },
      ],
    };

    if (filters) {
      if (filters.positionIds && filters.positionIds.length > 0) {
        where.positionId = { in: filters.positionIds };
      }
      if (filters.statuses && filters.statuses.length > 0) {
        where.status = { in: filters.statuses };
      }
      if (filters.minFitScore) {
        where.fitScore = { gte: filters.minFitScore };
      }
      if (filters.maxFitScore) {
        where.fitScore = { ...where.fitScore, lte: filters.maxFitScore };
      }
      if (filters.dateRange?.start) {
        where.applicationDate = { gte: new Date(filters.dateRange.start) };
      }
      if (filters.dateRange?.end) {
        where.applicationDate = { ...where.applicationDate, lte: new Date(filters.dateRange.end) };
      }
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        position: true,
      },
      take: limit * 2, // Fetch more to allow for AI filtering
    });

    const aiResults = await performAISearch(query, candidates, searchType);

    await logAudit('AUDIT', `User performed an AI search. Query: "${query}"`, 'AI Search', session.user.id, { query, filters, resultCount: aiResults.length });

    return NextResponse.json(aiResults.slice(0, limit));

  } catch (error) {
    console.error('AI Search Error:', error);
    await logAudit('ERROR', 'An error occurred during AI search.', 'AI Search', session.user.id, { error: (error as Error).message });
    return NextResponse.json({ error: 'An internal error occurred during the search.' }, { status: 500 });
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
