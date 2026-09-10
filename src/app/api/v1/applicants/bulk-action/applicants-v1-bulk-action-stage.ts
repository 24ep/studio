import prisma from '@/lib/prisma';

export async function resolveV1BulkActionAppliedStageId() {
  try {
    const appliedStage = await prisma.recruitmentStage.findFirst({
      where: { name: { equals: 'Applied', mode: 'insensitive' } },
      select: { id: true },
    });
    if (appliedStage) {
      return appliedStage.id;
    }

    const firstStage = await prisma.recruitmentStage.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    return firstStage?.id || null;
  } catch (error) {
    console.error('Failed to resolve stage for recruiter assignment transition', error);
    return null;
  }
}
