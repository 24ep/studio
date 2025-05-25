
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { minioClient, MINIO_BUCKET_NAME, ensureBucketExists } from '../../../lib/minio'; // Changed from @/lib/minio
import prisma from '../../../lib/prisma'; // Changed from @/lib/prisma
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure bucket exists on server start or before first upload.
// Calling it here means it runs when this module is loaded.
// In a larger app, this might be part of an initialization script.
ensureBucketExists(MINIO_BUCKET_NAME).catch(console.error);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const candidateId = request.nextUrl.searchParams.get('candidateId');
  if (!candidateId) {
    return NextResponse.json({ message: 'Candidate ID is required as a query parameter' }, { status: 400 });
  }

  let candidate;
  try {
    candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
  } catch (dbError) {
     console.error('Database error fetching candidate:', dbError);
     return NextResponse.json({ message: 'Error verifying candidate', error: (dbError as Error).message }, { status: 500 });
  }
  

  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No resume file provided in the "resume" field' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024*1024)}MB` }, { status: 400 });
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' }, { status: 400 });
    }

    const fileName = `${candidateId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`; // Create a unique file name
    
    // Convert File to Buffer for MinIO SDK
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await minioClient.putObject(MINIO_BUCKET_NAME, fileName, buffer, file.size, {
      'Content-Type': file.type,
    });

    // Update candidate record with the resume path
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: { resumePath: fileName, updatedAt: new Date() }, // Ensure updatedAt is manually set if not auto-updated by Prisma middleware
    });

    return NextResponse.json({ 
      message: 'Resume uploaded successfully', 
      filePath: fileName,
      candidate: updatedCandidate 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading resume:', error);
    if (error.code && error.message) { // MinIO errors often have a 'code' property
        return NextResponse.json({ message: `MinIO Error: ${error.message}`, code: error.code }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error processing file upload', error: error.message }, { status: 500 });
  }
}
