import prisma from '@/lib/prisma';
import type { HeadcountUpdateBody } from './headcount-detail-types';

const headcountDetailInclude = {
  position: {
    select: {
      id: true,
      title: true,
      department: true,
    },
  },
  applicant: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  attachments: {
    select: {
      id: true,
      fileName: true,
      label: true,
      filePath: true,
      uploadedAt: true,
    },
  },
};

export function fetchHeadcountById(id: string) {
  return prisma.headcount.findUnique({
    where: { id },
    include: headcountDetailInclude,
  });
}

export function fetchExistingHeadcount(id: string) {
  return prisma.headcount.findUnique({
    where: { id },
  });
}

export function fetchApplicantById(applicantId: string) {
  return prisma.applicant.findUnique({
    where: { id: applicantId },
  });
}

export function updateHeadcount(id: string, body: HeadcountUpdateBody) {
  const { type, status, applicantId, onboardingDate, requestDate, notes, memoId, employeeId } = body;

  return prisma.headcount.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(status && { status }),
      ...(applicantId !== undefined && { applicantId: applicantId || null }),
      ...(onboardingDate !== undefined && { onboardingDate: onboardingDate ? new Date(onboardingDate) : null }),
      ...(requestDate !== undefined && { requestDate: requestDate ? new Date(requestDate) : null }),
      ...(notes !== undefined && { notes }),
      ...(memoId !== undefined && { memoId }),
      ...(employeeId !== undefined && { employeeId }),
      ...(body.customFields !== undefined && { customFields: body.customFields }),
    },
    include: headcountDetailInclude,
  });
}

export function deleteHeadcount(id: string) {
  return prisma.headcount.delete({
    where: { id },
  });
}
