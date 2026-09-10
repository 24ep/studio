import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { CreateHeadcountRequest } from '@/lib/types';
import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  canCreateHeadcountData,
  canViewHeadcountData,
} from './headcount-route-utils';
import {
  buildHeadcountCreateData,
  getCreateHeadcountValidationError,
  headcountWithRelationsInclude,
} from './headcount-route-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const positionId = searchParams.get('positionId');

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canViewHeadcountData(session.user)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view headcount data' }, { status: 403 });
    }

    if (!positionId) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 });
    }

    const headcounts = await prisma.headcount.findMany({
      where: {
        positionId,
      },
      include: headcountWithRelationsInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(headcounts);
  } catch (error) {
    console.error('Error fetching headcounts:', error);
    console.error('Position ID:', positionId);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: CreateHeadcountRequest | undefined;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canCreateHeadcountData(session.user)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create headcount data' }, { status: 403 });
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    body = bodyResult.value as CreateHeadcountRequest;

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const validationError = getCreateHeadcountValidationError(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { positionId, applicantId } = body;
    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    // If applicantId is provided, verify Applicant exists
    if (applicantId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicantId },
      });

      if (!applicant) {
        return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
      }
    }

    const headcount = await prisma.headcount.create({
      data: buildHeadcountCreateData(body, session.user),
      include: headcountWithRelationsInclude,
    });

    return NextResponse.json({
      headcount,
      autoCloseResult: null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating headcount:', error);
    console.error('Request body:', body);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

