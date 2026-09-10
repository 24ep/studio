import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireApiSession } from '@/lib/api-route-guards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// In-memory cache for universities (refreshes every 5 minutes)
let universitiesCache: { data: string[], timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type EducationEntry = {
  university?: unknown;
};

function isEducationEntry(value: unknown): value is EducationEntry {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function GET(_req: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    // Check cache first to reduce database load
    const now = Date.now();
    if (universitiesCache && (now - universitiesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ data: universitiesCache.data });
    }

    // Fetch Applicants in batches to reduce memory usage
    const BATCH_SIZE = 500;
    const universities = new Set<string>();
    let offset = 0;
    
    try {
      while (true) {
        const applicants = await prisma.applicant.findMany({
          select: { educationData: true },
          where: { NOT: { educationData: { equals: Prisma.DbNull } } },
          take: BATCH_SIZE,
          skip: offset
        });
        
        if (applicants.length === 0) break;
        
        // Extract university names from this batch
        applicants.forEach((applicant) => {
          if (Array.isArray(applicant.educationData)) {
            applicant.educationData.forEach((edu) => {
              const university = isEducationEntry(edu) && typeof edu.university === 'string'
                ? edu.university.trim()
                : '';
              if (university) {
                universities.add(university);
              }
            });
          }
        });
        
        offset += applicants.length;
        if (applicants.length < BATCH_SIZE) break;
      }
    } catch (err) {
      // If the field is missing or not JSON, return empty array
      console.error('educationData field missing or not JSON:', err);
      return NextResponse.json({ data: [] });
    }
    
    const uniqueUniversities = Array.from(universities);
    
    // Update cache
    universitiesCache = { data: uniqueUniversities, timestamp: now };
    
    return NextResponse.json({ data: uniqueUniversities });
  } catch (error) {
    console.error('Failed to fetch universities:', error);
    return NextResponse.json({ error: 'Failed to fetch universities', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
} 
