import prisma from '@/lib/prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export async function resolveV1ApplicantImportStageId(input: string | undefined | null) {
  if (!input || typeof input !== 'string') return null;
  if (UUID_REGEX.test(input)) return input;

  try {
    const byName = await prisma.recruitmentStage.findFirst({
      where: { name: { equals: input, mode: 'insensitive' } },
      select: { id: true },
    });
    if (byName?.id) return byName.id;

    const appliedStage = await prisma.recruitmentStage.findFirst({
      where: {
        OR: [
          { name: { equals: 'Applied', mode: 'insensitive' } },
          { name: { equals: 'applied', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    if (appliedStage?.id) return appliedStage.id;

    const firstStage = await prisma.recruitmentStage.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    return firstStage?.id || null;
  } catch {
    return null;
  }
}
