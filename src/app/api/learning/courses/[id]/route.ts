import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { employeeForUser } from '@/lib/learning/learning-access';
import { getCourseDetail, startCourse } from '@/lib/learning/learning-service';
import { hasAnyPermission } from '@/lib/permissions';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const employeeId = await employeeForUser(session.user.id, session.user.email);
  const canPreviewDraft = hasAnyPermission(session.user, ['HR_LEARNING_MANAGE']);
  const detail = await getCourseDetail((await params).id, employeeId, canPreviewDraft);
  if (!detail) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

  const enrollmentId = detail.enrollment?.id ? String(detail.enrollment.id) : null;
  const submissions = enrollmentId
    ? await getPool().query(
        `SELECT s.id,s.enrollment_id,s.block_id,s.text,s.file_url,s.status,s.feedback,s.reviewed_at,s.updated_at
           FROM hr_learning_assignment_submissions s
           JOIN hr_learning_enrollments e ON e.id=s.enrollment_id
           JOIN hr_learning_content_blocks b ON b.id=s.block_id
           JOIN hr_learning_lessons l ON l.id=b.lesson_id
           JOIN hr_learning_course_sections sec ON sec.id=l.section_id AND sec.version_id=e.course_version_id
          WHERE s.enrollment_id=$1::uuid
          ORDER BY s.updated_at DESC`,
        [enrollmentId],
      )
    : { rows: [] };
  const assignmentSubmissions = Object.fromEntries(submissions.rows.map(row => [String(row.block_id), row]));

  return NextResponse.json({ data: { ...detail, canManage: canPreviewDraft, assignmentSubmissions } });
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const employeeId = await employeeForUser(session.user.id, session.user.email);
  if (!employeeId) return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
  try {
    return NextResponse.json({ data: await startCourse((await params).id, employeeId) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to start course' }, { status: 400 });
  }
}
