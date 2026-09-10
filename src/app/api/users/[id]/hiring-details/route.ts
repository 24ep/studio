
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyApiPermission } from '@/lib/api-route-guards';

type UserContactInfo = {
    otherEmails?: unknown;
    mobilePhone?: unknown;
    businessPhone?: unknown;
};

function isUserContactInfo(value: unknown): value is UserContactInfo {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { response } = await requireAnyApiPermission(['USERS_VIEW', 'HEADCOUNT_VIEW', 'applicantS_VIEW']);
        if (response) return response;

        const { id } = await params;

        // 1. Fetch the User to get their details
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Prepare search criteria
        const searchCriteria = {
            employeeId: user.employeeId,
            emails: [user.email],
            phones: [] as string[],
        };

        // Extract additional emails and phones from contactInfo if available
        if (isUserContactInfo(user.contactInfo)) {
            const contactInfo = user.contactInfo;

            if (Array.isArray(contactInfo.otherEmails)) {
                searchCriteria.emails.push(...contactInfo.otherEmails.filter((email): email is string => typeof email === 'string'));
            }

            if (typeof contactInfo.mobilePhone === 'string') searchCriteria.phones.push(contactInfo.mobilePhone);
            if (typeof contactInfo.businessPhone === 'string') searchCriteria.phones.push(contactInfo.businessPhone);
        }

        if (user.phoneNumber) {
            searchCriteria.phones.push(user.phoneNumber);
        }

        // Filter out potential duplicates and nulls
        searchCriteria.emails = [...new Set(searchCriteria.emails.filter(Boolean))];
        searchCriteria.phones = [...new Set(searchCriteria.phones.filter(Boolean))];

        // 3. Find associated Headcount
        let headcount = null;
        if (searchCriteria.employeeId) {
            headcount = await prisma.headcount.findFirst({
                where: {
                    employeeId: searchCriteria.employeeId,
                },
                include: {
                    position: {
                        select: {
                            id: true,
                            title: true,
                            department: true,
                        }
                    }
                }
            });
        }

        // 4. Find associated Applicant
        let applicant = null;

        // Build OR conditions for Applicant search
        const applicantOrConditions = [];

        if (searchCriteria.emails.length > 0) {
            applicantOrConditions.push({
                email: { in: searchCriteria.emails, mode: 'insensitive' as const }
            });
        }

        if (searchCriteria.phones.length > 0) {
            applicantOrConditions.push({
                phone: { in: searchCriteria.phones }
            });
        }

        if (applicantOrConditions.length > 0) {
            applicant = await prisma.applicant.findFirst({
                where: {
                    OR: applicantOrConditions
                },
                include: {
                    position: {
                        select: {
                            id: true,
                            title: true,
                            department: true,
                        }
                    },
                    recruitmentStage: true,
                },
                orderBy: {
                    updatedAt: 'desc' // Get the most recent one if multiple match
                }
            });
        }

        return NextResponse.json({
            headcount,
            applicant,
            matchCriteria: {
                matchedByEmployeeId: !!headcount,
                matchedByEmail: applicant ? searchCriteria.emails.includes(applicant.email) : false,
                matchedByPhone: applicant?.phone ? searchCriteria.phones.includes(applicant.phone) : false,
            }
        });

    } catch (error) {
        console.error('Error fetching hiring details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hiring details' },
            { status: 500 }
        );
    }
}
