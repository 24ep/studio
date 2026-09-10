import { type NextRequest } from 'next/server';
import {
  handleDeleteHeadcount,
  handleGetHeadcount,
  handlePatchHeadcount,
  handleUpdateHeadcount,
} from './headcount-detail-handlers';
import type { HeadcountDetailRouteContext } from './headcount-detail-types';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest, context: HeadcountDetailRouteContext) {
  return handleGetHeadcount(request, context);
}

export function PUT(request: NextRequest, context: HeadcountDetailRouteContext) {
  return handleUpdateHeadcount(request, context);
}

export function DELETE(request: NextRequest, context: HeadcountDetailRouteContext) {
  return handleDeleteHeadcount(request, context);
}

export function PATCH(request: NextRequest, context: HeadcountDetailRouteContext) {
  return handlePatchHeadcount(request, context);
}
