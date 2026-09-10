import type { NextRequest } from 'next/server';

import { handleHrModuleDelete, handleHrModuleGet, handleHrModulePatch, handleHrModulePost } from '../hr-api-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleHrModuleGet(request, 'clients');
}

export function POST(request: NextRequest) {
  return handleHrModulePost(request, 'clients');
}

export function PATCH(request: NextRequest) {
  return handleHrModulePatch(request, 'clients');
}

export function DELETE(request: NextRequest) {
  return handleHrModuleDelete(request, 'clients');
}
