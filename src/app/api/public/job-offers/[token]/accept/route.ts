import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { createOfferSignatureHash } from '@/lib/job-offers';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';

const acceptOfferSchema = z.object({
  signedName: z.string().min(2),
  consent: z.literal(true),
});

interface AcceptOfferContext {
  params: Promise<{ token: string }>;
}

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(request: NextRequest, { params }: AcceptOfferContext) {
  const { token } = await params;
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = acceptOfferSchema.safeParse(bodyResult.value);
  if (!validation.success) {
    return NextResponse.json({ message: 'Please provide your legal name and consent to sign electronically' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const offerResult = await client.query(`
      SELECT jo.*, stage.name AS applicant_stage_name
      FROM job_offers jo
      LEFT JOIN "Applicant" applicant ON applicant.id = jo.applicant_id
      LEFT JOIN "RecruitmentStage" stage ON stage.id = applicant."statusId"
      WHERE jo.token = $1
      FOR UPDATE OF jo
    `, [token]);
    if (offerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
    }

    const offer = offerResult.rows[0];
    if (offer.token_expires_at && new Date(offer.token_expires_at).getTime() < Date.now()) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'This offer link has expired' }, { status: 410 });
    }
    if (offer.status === 'accepted') {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'This offer has already been accepted' }, { status: 409 });
    }
    if (offer.applicant_stage_name?.trim().toLowerCase() === 'hired') {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'This offer is no longer awaiting acceptance because the applicant has already been hired' }, { status: 409 });
    }

    const signedAt = new Date();
    const consentText = 'I agree to use an electronic signature and accept this offer letter.';
    const signatureIp = getClientIp(request);
    const signatureUserAgent = request.headers.get('user-agent') || 'unknown';
    const signatureHash = createOfferSignatureHash({
      offerId: offer.id,
      token,
      signedName: validation.data.signedName,
      consentText,
      signedAt,
      ipAddress: signatureIp,
      userAgent: signatureUserAgent,
    });

    const updateResult = await client.query(`
      UPDATE job_offers
      SET status = 'accepted',
        accepted_at = $1,
        signed_name = $2,
        signed_at = $1,
        signature_ip = $3,
        signature_user_agent = $4,
        signature_consent_text = $5,
        signature_hash = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, status, accepted_at, signed_name, signed_at, signature_hash
    `, [
      signedAt,
      validation.data.signedName.trim(),
      signatureIp,
      signatureUserAgent,
      consentText,
      signatureHash,
      offer.id,
    ]);

    await client.query('COMMIT');
    return NextResponse.json({ offer: updateResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Accept Offer] Error:', error);
    return NextResponse.json({ message: 'Failed to accept offer' }, { status: 500 });
  } finally {
    client.release();
  }
}
