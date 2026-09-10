export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-route-guards';

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  return NextResponse.json([
    {
      label: "Overview",
      items: [
        { 
          label: "Dashboard", 
          icon: "LayoutDashboard", 
          href: "/",
          description: "Overview and analytics"
        },
        { 
          label: "Applicants", 
          icon: "Users", 
          href: "/applicants",
          description: "Manage Applicant profiles"
        },
        { 
          label: "Positions", 
          icon: "Briefcase", 
          href: "/positions",
          description: "Job positions and openings"
        },
        { 
          label: "AI docs processing", 
          icon: "UploadCloud", 
          href: "/process-queue",
                      description: "Monitor and manage Applicant import queue"
        },
      ],
    },
    {
      label: "Recruitment",
      items: [
        {
          label: "SLA Monitoring",
          icon: "AlertTriangle",
          href: "/sla-monitoring",
          description: "Monitor Service Level Agreement compliance"
        },
      ],
    },
    {
      label: "System",
      items: [
        { 
          label: "Settings", 
          icon: "Settings", 
          href: "/settings",
          description: "System configuration"
        },
      ],
    },
  ]);
} 
