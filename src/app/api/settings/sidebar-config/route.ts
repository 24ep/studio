import { NextResponse } from 'next/server';
import { sidebarConfig } from '@/components/layout/SidebarNavConfig';

export async function GET() {
  return NextResponse.json(sidebarConfig);
} 