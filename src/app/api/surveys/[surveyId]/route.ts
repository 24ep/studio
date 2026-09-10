import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { surveyUpdateSchema } from "@/lib/survey/survey-contracts";
import { getSurveyById, updateSurvey } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_VIEW");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!idSchema.safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  try {
    const survey = await getSurveyById(access.context, surveyId);
    return survey
      ? NextResponse.json({ survey })
      : NextResponse.json({ message: "Survey not found." }, { status: 404 });
  } catch (error) {
    return surveyApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_MANAGE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!idSchema.safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  const parsed = surveyUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      message: "Invalid survey update.",
      errors: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }
  try {
    return NextResponse.json({ survey: await updateSurvey(access.context, surveyId, parsed.data) });
  } catch (error) {
    return surveyApiError(error);
  }
}

