import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const BRANCH_CONFIG_SETTING_KEY = 'branchConfig';

interface BranchConfigItem {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  phone: string;
  manager: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusKm: number;
  isDefault: boolean;
  isActive: boolean;
}

interface BranchConfigPayload {
  branches?: BranchConfigItem[];
}

function canViewBranches(user: Parameters<typeof hasPermission>[0]) {
  return hasPermission(user, 'SYSTEM_SETTINGS_VIEW');
}

function canEditBranches(user: Parameters<typeof hasPermission>[0]) {
  return hasPermission(user, 'SYSTEM_SETTINGS_EDIT');
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCoordinate(value: unknown, min: number, max: number) {
  if (value === null || value === undefined || value === '') return null;
  const coordinate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null;
}

function normalizeBranch(value: unknown): BranchConfigItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const branch = value as Record<string, unknown>;
  const id = normalizeText(branch.id);
  const name = normalizeText(branch.name);
  const code = normalizeText(branch.code);

  if (!id || !name || !code) return null;

  return {
    id,
    name,
    code,
    address: normalizeText(branch.address),
    city: normalizeText(branch.city),
    country: normalizeText(branch.country),
    timezone: normalizeText(branch.timezone) || 'Asia/Bangkok',
    phone: normalizeText(branch.phone),
    manager: normalizeText(branch.manager),
    latitude: normalizeCoordinate(branch.latitude, -90, 90),
    longitude: normalizeCoordinate(branch.longitude, -180, 180),
    geofenceRadiusKm: Math.min(100, Math.max(0.01, Number(branch.geofenceRadiusKm) || 0.5)),
    isDefault: Boolean(branch.isDefault),
    isActive: branch.isActive !== false,
  };
}

function normalizeBranchConfig(input: BranchConfigPayload) {
  const branches = Array.isArray(input.branches)
    ? input.branches.map(normalizeBranch).filter((branch): branch is BranchConfigItem => Boolean(branch))
    : [];
  const defaultBranchId = branches.find(branch => branch.isDefault)?.id ?? branches[0]?.id ?? null;

  return {
    branches: branches.map(branch => ({
      ...branch,
      isDefault: branch.id === defaultBranchId,
    })),
  };
}

async function getBranchConfig() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: BRANCH_CONFIG_SETTING_KEY },
    select: { value: true },
  });

  if (!setting?.value) return { branches: [] };

  try {
    return normalizeBranchConfig(JSON.parse(setting.value) as BranchConfigPayload);
  } catch {
    return { branches: [] };
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canViewBranches(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(await getBranchConfig());
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditBranches(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as BranchConfigPayload | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const config = normalizeBranchConfig(body);

  await prisma.systemSetting.upsert({
    where: { key: BRANCH_CONFIG_SETTING_KEY },
    create: {
      key: BRANCH_CONFIG_SETTING_KEY,
      value: JSON.stringify(config),
    },
    update: {
      value: JSON.stringify(config),
    },
  });

  return NextResponse.json(config);
}
