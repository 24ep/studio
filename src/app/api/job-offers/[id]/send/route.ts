import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { sendEmail } from '@/lib/emailService';
import {
  formatOfferDate,
  formatOfferSalary,
  loadOfferLetterTemplateSettings,
  renderOfferTemplate,
  sanitizeOfferHtml,
} from '@/lib/job-offers';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

interface SendOfferContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: SendOfferContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'APPLICANTS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;
  const pool = getPool();
  const offerResult = await pool.query('SELECT * FROM job_offers WHERE id = $1', [id]);
  if (offerResult.rows.length === 0) {
    return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
  }

  const offer = offerResult.rows[0];
  if (offer.status === 'accepted') {
    return NextResponse.json({ message: 'Accepted offers cannot be resent' }, { status: 400 });
  }

  const acceptUrl = `${request.nextUrl.origin}/offer/${offer.token}`;
  const template = await loadOfferLetterTemplateSettings();
  const salary = formatOfferSalary(Number(offer.salary_amount), offer.currency);
  const startDate = formatOfferDate(offer.start_date);
  const variables = {
    candidateName: offer.recipient_name,
    candidateEmail: offer.recipient_email,
    jobTitle: offer.job_title,
    salary,
    startDate,
    companyName: template.companyName,
    acceptUrl,
  };
  const letterHtml = sanitizeOfferHtml(renderOfferTemplate(template.body, variables));
  const subject = renderOfferTemplate(template.subject, variables);
  const result = await sendEmail(offer.recipient_email, subject, letterHtml);

  if (!result.success) {
    return NextResponse.json({ message: result.error || 'Failed to send offer letter' }, { status: 500 });
  }

  await pool.query(`
    UPDATE job_offers
    SET status = 'sent', sent_at = CURRENT_TIMESTAMP, letter_html = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [letterHtml, id]);

  return NextResponse.json({ message: 'Offer letter sent', email: result });
}
