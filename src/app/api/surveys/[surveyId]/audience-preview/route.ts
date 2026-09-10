import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { audiencePreviewSchema } from "@/lib/survey/survey-contracts";
import { previewSurveyAudience } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_MANAGE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  const parsed = audiencePreviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid audience rules.", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    return NextResponse.json({
      preview: await previewSurveyAudience(access.context, surveyId, parsed.data.rules, true),
    });
  } catch (error) {
    return surveyApiError(error);
  }
}

