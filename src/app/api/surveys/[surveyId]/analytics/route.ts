import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { getSurveyAnalytics } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_ANALYZE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  try {
    return NextResponse.json({ analytics: await getSurveyAnalytics(access.context, surveyId) });
  } catch (error) {
    return surveyApiError(error);
  }
}

