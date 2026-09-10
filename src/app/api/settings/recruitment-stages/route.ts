export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import {
  handleCreateRecruitmentStage,
  handleGetRecruitmentStages,
} from './recruitment-stages-route-handlers';

export function GET(request: NextRequest) {
  return handleGetRecruitmentStages(request);
}

export function POST(request: NextRequest) {
  return handleCreateRecruitmentStage(request);
}
