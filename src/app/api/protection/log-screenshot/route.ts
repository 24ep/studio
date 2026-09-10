
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/emailService';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await readRequestJsonObject(req);
        const url = getJsonString(data, 'url') || 'unknown';
        const userAgent = getJsonString(data, 'userAgent') || req.headers.get('user-agent') || 'unknown';

        // 1. Log to Database
        await prisma.userActivityLog.create({
            data: {
                userId: session.user.id,
                action: 'SCREENSHOT_ATTEMPT',
                details: {
                    url,
                    userAgent,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent,
            }
        });

        // 2. Alert Admins via Email
        // Find all admins
        const admins = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'Admin' },
                    { role: 'ADMIN' },
                    { role: 'admin' }
                ],
                isActive: true,
                email: { not: '' }
            },
            select: { email: true }
        });

        if (admins.length > 0) {
            const adminEmails = admins.map(a => a.email);
            const userEmail = session.user.email || 'Unknown User';
            const userName = session.user.name || 'Unknown Name';
            const timestamp = new Date().toLocaleString();

            const subject = `[SECURITY ALERT] Screenshot Attempt Detected: ${userName}`;
            const html = `
                <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #d73a49; border-bottom: 2px solid #d73a49; padding-bottom: 10px;">Security Alert: Screenshot Attempt</h2>
                    <p>A screenshot attempt was detected on the platform.</p>
                    
                    <div style="background-color: #f6f8fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>User:</strong> ${userName} (${userEmail})</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
                        <p style="margin: 5px 0;"><strong>Page:</strong> <a href="${url}">${url}</a></p>
                    </div>

                    <p><strong>Device Info:</strong><br/>
                    <span style="font-family: monospace; background: #eee; padding: 2px 4px; border-radius: 3px;">${userAgent}</span></p>

                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e1e4e8; color: #586069; font-size: 12px;">
                        <p>This is an automated security notification from Ihres Recruitment System.</p>
                    </div>
                </div>
            `;

            await sendEmail(adminEmails, subject, html);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging screenshot attempt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
