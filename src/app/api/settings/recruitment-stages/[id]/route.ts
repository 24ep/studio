import { type NextRequest } from 'next/server';
import {
  handleDeleteRecruitmentStage,
  handleGetRecruitmentStage,
  handleUpdateRecruitmentStage,
} from './recruitment-stage-detail-handlers';
import type { RecruitmentStageDetailRouteContext } from './recruitment-stage-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/settings/recruitment-stages/{id}:
 *   get:
 *     summary: Get a recruitment stage by ID
 *   put:
 *     summary: Update a recruitment stage by ID
 *   delete:
 *     summary: Delete a recruitment stage by ID
 */
export function GET(request: NextRequest, context: RecruitmentStageDetailRouteContext) {
  return handleGetRecruitmentStage(request, context);
}

export function PUT(request: NextRequest, context: RecruitmentStageDetailRouteContext) {
  return handleUpdateRecruitmentStage(request, context);
}

export function DELETE(request: NextRequest, context: RecruitmentStageDetailRouteContext) {
  return handleDeleteRecruitmentStage(request, context);
}
