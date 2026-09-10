import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const contacts = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['Admin', 'admin'] } },
    orderBy: { name: 'asc' },
    take: 25,
    select: { id: true, name: true, email: true, positionTitle: true, department: true },
  });
  const setting = await prisma.systemSetting.findFirst({ where: { key: 'organizationProfile' }, select: { value: true } });
  let organizationEmail: string | null = null;
  try {
    const profile = JSON.parse(setting?.value || '{}') as { primaryEmail?: unknown };
    organizationEmail = typeof profile.primaryEmail === 'string' ? profile.primaryEmail : null;
  } catch {
    organizationEmail = null;
  }
  return NextResponse.json({ contacts, organizationEmail });
}
