export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/api-route-guards';

export async function GET() {
  const { response } = await requireApiPermission('SYSTEM_SETTINGS_VIEW');
  if (response) return response;

  const memory = process.memoryUsage();

  return NextResponse.json({
    status: 'healthy',
    checkedAt: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    runtime: `Node ${process.version}`,
    memory: {
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
      externalBytes: memory.external,
    },
  });
}
