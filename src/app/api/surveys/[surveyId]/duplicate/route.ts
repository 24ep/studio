import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { duplicateSurvey } from "@/lib/survey/survey-operations";

export async function POST(_: Request, context: { params: Promise<{ surveyId: string }> }) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_CREATE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  try { return NextResponse.json(await duplicateSurvey(access.context, surveyId), { status: 201 }); }
  catch (error) { return surveyApiError(error); }
}
