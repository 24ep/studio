
import { getPool } from '@/lib/db';
import { generateEmailOtp, sendEmailOtp } from '@/lib/twoFactorAuth';
import { applyRateLimit, authRateLimiter } from '@/lib/rateLimiter';
import { readRequestJsonObject } from '@/lib/request-json';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/2fa/resend
 * Resends the email OTP verification code
 * Public endpoint for the login-time 2FA flow; protected by IP rate limiting.
 */
export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = applyRateLimit(req, authRateLimiter);
        if (!rateLimitResult.allowed) {
            const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
            return NextResponse.json(
                { error: 'Too many verification requests. Please try again later.', retryAfter },
                {
                    status: 429,
                    headers: { 'Retry-After': retryAfter.toString() },
                }
            );
        }

        // For resend during login, we need email from the request body
        // (user may not be fully authenticated yet)
        const body = await readRequestJsonObject(req);
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const client = await getPool().connect();

        try {
            // Get user by email
            const userRes = await client.query(
                'SELECT id, name, email, "two_factor_method" FROM "User" WHERE email = $1',
                [email]
            );

            const user = userRes.rows[0];
            if (!user) {
                // Don't reveal if user exists or not
                return NextResponse.json({ success: true, message: 'If the email exists, a new code has been sent' });
            }

            // Only allow resend for email method
            if (user.two_factor_method === 'totp') {
                return NextResponse.json({
                    error: 'Resend not available for authenticator app method'
                }, { status: 400 });
            }

            // Generate and send new OTP
            const otp = generateEmailOtp();

            // Store OTP (note: expiration is handled by time-based logic, not DB field)
            await client.query(
                `UPDATE "User" 
         SET "two_factor_secret" = $1
         WHERE id = $2`,
                [otp, user.id]
            );

            // Send email
            const sent = await sendEmailOtp(user.email, otp, user.name || 'User');

            if (!sent) {
                console.error('[2FA Resend] Failed to send email OTP');
                return NextResponse.json({
                    error: 'Failed to send verification code. Please check email configuration.'
                }, { status: 500 });
            }

            console.log(`[2FA Resend] New OTP sent to: ${user.email}`);
            return NextResponse.json({ success: true, message: 'Verification code sent' });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[2FA Resend] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
