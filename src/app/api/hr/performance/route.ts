import type { NextRequest } from 'next/server';

import { handleHrModuleDelete, handleHrModuleGet, handleHrModulePatch, handleHrModulePost } from '../hr-api-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleHrModuleGet(request, 'performance');
}

export function POST(request: NextRequest) {
  return handleHrModulePost(request, 'performance');
}

export function PATCH(request: NextRequest) {
  return handleHrModulePatch(request, 'performance');
}

export function DELETE(request: NextRequest) {
  return handleHrModuleDelete(request, 'performance');
}
