import type { NextRequest } from 'next/server';

import { handleHrModuleDelete, handleHrModuleGet, handleHrModulePatch, handleHrModulePost } from '../hr-api-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleHrModuleGet(request, 'onboarding');
}

export function POST(request: NextRequest) {
  return handleHrModulePost(request, 'onboarding');
}

export function PATCH(request: NextRequest) {
  return handleHrModulePatch(request, 'onboarding');
}

export function DELETE(request: NextRequest) {
  return handleHrModuleDelete(request, 'onboarding');
}
