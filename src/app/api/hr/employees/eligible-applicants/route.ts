import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasAnyPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import type { PlatformModuleId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EligibleApplicantRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  positionTitle: string | null;
  statusName: string | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized: User session required." },
      { status: 401 },
    );
  }

  if (!hasAnyPermission(session.user, ["HR_PEOPLE_MANAGE"] as PlatformModuleId[])) {
    return NextResponse.json(
      { message: "Forbidden: Insufficient HR people permission." },
      { status: 403 },
    );
  }

  try {
    const applicants = await prisma.$queryRaw<EligibleApplicantRow[]>`
      SELECT
        a.id,
        a.name,
        a.email,
        a.phone,
        p.title AS "positionTitle",
        rs.name AS "statusName"
      FROM "Applicant" a
      LEFT JOIN "RecruitmentStage" rs ON rs.id = a."statusId"
      LEFT JOIN "Position" p ON p.id = a."positionId"
      WHERE a."isBlacklisted" = false
        AND NOT EXISTS (
          SELECT 1
          FROM hr_employees e
          WHERE e.applicant_id = a.id
             OR (e.applicant_id IS NULL AND lower(e.email) = lower(a.email))
        )
      ORDER BY a."applicationDate" DESC, a.name ASC
      LIMIT 200
    `;

    return NextResponse.json({ applicants });
  } catch (error) {
    console.error("[HR:Employees:EligibleApplicants] Failed:", error);
    return NextResponse.json(
      { message: "Unable to load eligible applicants." },
      { status: 500 },
    );
  }
}
