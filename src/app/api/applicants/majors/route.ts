import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireApiSession } from '@/lib/api-route-guards';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// In-memory cache for majors (refreshes every 5 minutes)
let majorsCache: { data: string[], timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type EducationEntry = {
  major?: unknown;
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
    if (majorsCache && (now - majorsCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ data: majorsCache.data });
    }

    // Fetch Applicants in batches to reduce memory usage
    const BATCH_SIZE = 500;
    const majors = new Set<string>();
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
        
        // Extract majors from this batch
        applicants.forEach((applicant) => {
          if (Array.isArray(applicant.educationData)) {
            applicant.educationData.forEach((edu) => {
              const major = isEducationEntry(edu) && typeof edu.major === 'string'
                ? edu.major.trim()
                : '';
              if (major) {
                majors.add(major);
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
    
    const uniqueMajors = Array.from(majors);
    
    // Update cache
    majorsCache = { data: uniqueMajors, timestamp: now };
    
    return NextResponse.json({ data: uniqueMajors });
  } catch (error) {
    console.error('Failed to fetch majors:', error);
    return NextResponse.json({ error: 'Failed to fetch majors', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
} 
