import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { sendEmail } from '@/lib/emailService';
import {
  createOfferToken,
  formatOfferDate,
  formatOfferSalary,
  loadOfferLetterTemplateSettings,
  renderOfferTemplate,
  sanitizeOfferHtml,
} from '@/lib/job-offers';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';

const createJobOfferSchema = z.object({
  applicantId: z.string().uuid().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  jobTitle: z.string().min(1),
  salaryAmount: z.coerce.number().nonnegative().optional().nullable(),
  currency: z.string().min(3).max(3).default('THB'),
  startDate: z.string().optional().nullable(),
  sendNow: z.boolean().optional(),
});

function forbiddenResponse() {
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
}

async function authorizeJobOffers() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasPermission(session.user, 'APPLICANTS_VIEW')) {
    return { ok: false as const, response: forbiddenResponse() };
  }
  return { ok: true as const, session };
}

export async function GET() {
  const authorization = await authorizeJobOffers();
  if (!authorization.ok) return authorization.response;

  const pool = getPool();
  const [offers, applicants, positions] = await Promise.all([
    pool.query(`
      SELECT
        jo.*,
        a.name AS "applicantName",
        p.title AS "positionTitle"
      FROM job_offers jo
      LEFT JOIN "Applicant" a ON a.id = jo.applicant_id
      LEFT JOIN "Position" p ON p.id = jo.position_id
      ORDER BY jo.created_at DESC
      LIMIT 200
    `),
    pool.query('SELECT id, name, email, "positionId" FROM "Applicant" ORDER BY "createdAt" DESC LIMIT 500'),
    pool.query('SELECT id, title, department FROM "Position" WHERE "isOpen" = true ORDER BY title ASC LIMIT 500'),
  ]);

  return NextResponse.json({
    offers: offers.rows.map((offer) => ({
      ...offer,
      letter_html: undefined,
      letterHtml: undefined,
    })),
    applicants: applicants.rows,
    positions: positions.rows,
  });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeJobOffers();
  if (!authorization.ok) return authorization.response;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = createJobOfferSchema.safeParse(bodyResult.value);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid request data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const input = validation.data;
  const token = createOfferToken();
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const acceptUrl = `${request.nextUrl.origin}/offer/${token}`;
  const template = await loadOfferLetterTemplateSettings();
  const salary = formatOfferSalary(input.salaryAmount, input.currency);
  const startDate = formatOfferDate(input.startDate);
  const letterHtml = sanitizeOfferHtml(renderOfferTemplate(template.body, {
    candidateName: input.recipientName,
    candidateEmail: input.recipientEmail,
    jobTitle: input.jobTitle,
    salary,
    startDate,
    companyName: template.companyName,
    acceptUrl,
  }));
  const subject = renderOfferTemplate(template.subject, {
    candidateName: input.recipientName,
    candidateEmail: input.recipientEmail,
    jobTitle: input.jobTitle,
    salary,
    startDate,
    companyName: template.companyName,
    acceptUrl,
  });
  const id = randomUUID();
  const pool = getPool();

  const result = await pool.query(`
    INSERT INTO job_offers (
      id, applicant_id, position_id, recipient_name, recipient_email, job_title,
      salary_amount, currency, start_date, status, token, token_expires_at, letter_html,
      created_by_id, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11, $12, $13,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [
    id,
    input.applicantId || null,
    input.positionId || null,
    input.recipientName,
    input.recipientEmail,
    input.jobTitle,
    input.salaryAmount ?? null,
    input.currency,
    input.startDate ? new Date(input.startDate) : null,
    token,
    tokenExpiresAt,
    letterHtml,
    authorization.session.user.id,
  ]);

  let emailResult: Awaited<ReturnType<typeof sendEmail>> | null = null;
  if (input.sendNow) {
    emailResult = await sendEmail(input.recipientEmail, subject, letterHtml);
    if (emailResult.success) {
      await pool.query(
        'UPDATE job_offers SET status = $1, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sent', id],
      );
    }
  }

  return NextResponse.json({
    offer: result.rows[0],
    email: emailResult,
  }, { status: 201 });
}
