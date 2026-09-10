import { NextResponse } from "next/server";

import { requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { listAssignedSurveys } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  try {
    return NextResponse.json({ surveys: await listAssignedSurveys(access.context.userId) });
  } catch (error) {
    return surveyApiError(error);
  }
}

