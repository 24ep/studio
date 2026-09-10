import { type NextRequest } from 'next/server';
import {
  handleDeleteApplicantResume,
  handleGetApplicantResumes,
  handleSetPrimaryApplicantResume,
  handleUploadApplicantResumes,
} from './applicant-resumes-handlers';
import type { ApplicantResumesRouteContext } from './applicant-resumes-types';

export const dynamic = 'force-dynamic';


// GET: List resumes for a Applicant (with pagination and performance optimization)
export function GET(request: NextRequest, context: ApplicantResumesRouteContext) {
  return handleGetApplicantResumes(request, context);
}

// POST: Upload a resume (multipart/form-data) - supports single or multiple files
export function POST(request: NextRequest, context: ApplicantResumesRouteContext) {
  return handleUploadApplicantResumes(request, context);
}

// PUT: Set a attachment as primary
export function PUT(request: NextRequest, context: ApplicantResumesRouteContext) {
  return handleSetPrimaryApplicantResume(request, context);
}

// DELETE: Remove a attachment
export function DELETE(request: NextRequest, context: ApplicantResumesRouteContext) {
  return handleDeleteApplicantResume(request, context);
} 
