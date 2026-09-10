import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { getRespondentSurvey, startResponse } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  try {
    const survey = await getRespondentSurvey(access.context.userId, surveyId);
    return survey
      ? NextResponse.json({ survey })
      : NextResponse.json({ message: "This survey is not available to you." }, { status: 404 });
  } catch (error) {
    return surveyApiError(error);
  }
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ surveyId: string }> },
) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) {
    return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  }
  try {
    return NextResponse.json(await startResponse(access.context.userId, surveyId), { status: 201 });
  } catch (error) {
    return surveyApiError(error);
  }
}

