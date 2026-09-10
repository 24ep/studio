import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { surveyOperationSchema } from "@/lib/survey/survey-contracts";
import { getSurveyOperations, runSurveyOperation } from "@/lib/survey/survey-operations";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: { params: Promise<{ surveyId: string }> }) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_VIEW");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  try { return NextResponse.json(await getSurveyOperations(access.context, surveyId)); }
  catch (error) { return surveyApiError(error); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ surveyId: string }> }) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_MANAGE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  const parsed = surveyOperationSchema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(surveyId).success || !parsed.success) return NextResponse.json({ message: "Invalid survey operation.", issues: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await runSurveyOperation(access.context, surveyId, parsed.data)); }
  catch (error) { return surveyApiError(error); }
}
