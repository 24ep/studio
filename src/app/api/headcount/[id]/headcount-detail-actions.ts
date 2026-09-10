import { NextResponse } from 'next/server';
import {
  checkHeadcountUnassignWarning,
  unassignApplicantFromHeadcount,
} from '@/lib/headcount';
import { getHeadcountActorName } from './headcount-detail-auth';
import type { HeadcountActionBody, HeadcountDetailSessionUser } from './headcount-detail-types';

export async function handleHeadcountAction(id: string, body: HeadcountActionBody, user: HeadcountDetailSessionUser) {
  if (body.action === 'check_unassign_warning') {
    const warning = await checkHeadcountUnassignWarning(id);
    return NextResponse.json(warning);
  }

  if (body.action === 'unassign_applicant') {
    const result = await unassignApplicantFromHeadcount(id, user.id, getHeadcountActorName(user));
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
