import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function getOrCreateEvaluationLink(applicantId: string, userId: string): Promise<string | null> {
  try {
    const existingLink = await prisma.applicantEvaluationLink.findFirst({
      where: {
        applicantId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8021';
    if (existingLink) {
      return `${baseUrl}/applicants/${encodeURIComponent(applicantId)}/evaluate?token=${encodeURIComponent(existingLink.token)}`;
    }

    const token = crypto.randomBytes(24).toString('hex');
    await prisma.applicantEvaluationLink.create({
      data: {
        applicantId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: userId,
        requireLogin: true,
      },
    });

    return `${baseUrl}/applicants/${encodeURIComponent(applicantId)}/evaluate?token=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error('[Send Interview Invitation] Error getting evaluation link:', error);
    return null;
  }
}
