import { NextResponse } from 'next/server';
import { fetchApplicantById } from './headcount-detail-data';
import type { HeadcountUpdateBody } from './headcount-detail-types';

export async function validateHeadcountUpdateBody(body: HeadcountUpdateBody) {
  const { status, applicantId } = body;

  if (status === 'filled' && !applicantId) {
    return NextResponse.json({ error: 'Applicant ID is required when status is "filled"' }, { status: 400 });
  }

  if (!applicantId) {
    return null;
  }

  const applicant = await fetchApplicantById(applicantId);
  if (!applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
  }

  return null;
}
