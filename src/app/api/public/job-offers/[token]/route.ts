import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sanitizeOfferHtml } from '@/lib/job-offers';

export const dynamic = 'force-dynamic';

interface PublicOfferContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: PublicOfferContext) {
  const { token } = await params;
  const result = await getPool().query(`
    SELECT jo.id, jo.recipient_name, jo.recipient_email, jo.job_title, jo.salary_amount, jo.currency,
      start_date, status, token_expires_at, letter_html, sent_at, accepted_at,
      signed_name, signed_at, signature_hash, stage.name AS stage_name
    FROM job_offers jo
    LEFT JOIN "Applicant" applicant ON applicant.id = jo.applicant_id
    LEFT JOIN "RecruitmentStage" stage ON stage.id = applicant."statusId"
    WHERE jo.token = $1
  `, [token]);

  if (result.rows.length === 0) {
    return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
  }

  const offer = result.rows[0];
  if (offer.token_expires_at && new Date(offer.token_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ message: 'This offer link has expired' }, { status: 410 });
  }

  return NextResponse.json({
    offer: {
      id: offer.id,
      recipientName: offer.recipient_name,
      recipientEmail: offer.recipient_email,
      jobTitle: offer.job_title,
      salaryAmount: offer.salary_amount,
      currency: offer.currency,
      startDate: offer.start_date,
      // A hired applicant has completed the offer workflow even if a legacy
      // offer record was not updated to `accepted` at the same time.
      status: offer.status,
      isActionable: offer.status !== 'accepted' && offer.stage_name?.trim().toLowerCase() !== 'hired',
      applicantStage: offer.stage_name || null,
      sentAt: offer.sent_at,
      acceptedAt: offer.accepted_at,
      signedName: offer.signed_name,
      signedAt: offer.signed_at,
      signatureHash: offer.signature_hash,
      letterHtml: sanitizeOfferHtml(offer.letter_html),
    },
  });
}
