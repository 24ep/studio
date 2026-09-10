import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { uploadOwnDocument } from '@/lib/hr/ess-service';
import { validateFileUpload } from '@/lib/security-file-upload';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: 'A document file is required.' }, { status: 400 });
  }
  const validation = await validateFileUpload(file.name, file.type, file.size);
  if (!validation.valid) {
    return NextResponse.json({ message: validation.errors[0] || 'This file cannot be uploaded.', errors: validation.errors }, { status: 400 });
  }

  try {
    const data = await uploadOwnDocument({
      userId: session.user.id,
      email: session.user.email,
      file,
      documentId: String(formData.get('documentId') || '') || null,
      title: String(formData.get('title') || '') || null,
      type: String(formData.get('type') || '') || null,
    });
    if (!data) return NextResponse.json({ message: 'Document request not found.' }, { status: 404 });
    await logAudit('AUDIT', 'ESS employee document uploaded.', 'API:ESS:Documents:Upload', session.user.id, { id: data.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to upload document.' }, { status: 400 });
  }
}
