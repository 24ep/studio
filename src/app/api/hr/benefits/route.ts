import type { NextRequest } from 'next/server';

import { handleHrModuleDelete, handleHrModuleGet, handleHrModulePatch, handleHrModulePost } from '../hr-api-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleHrModuleGet(request, 'benefits');
}

export function POST(request: NextRequest) {
  return handleHrModulePost(request, 'benefits');
}

export function PATCH(request: NextRequest) {
  return handleHrModulePatch(request, 'benefits');
}

export function DELETE(request: NextRequest) {
  return handleHrModuleDelete(request, 'benefits');
}
