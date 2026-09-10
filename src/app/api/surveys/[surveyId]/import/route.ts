import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { surveyDefinitionImportSchema } from "@/lib/survey/survey-contracts";
import { importSurveyDefinition } from "@/lib/survey/survey-operations";

export async function POST(request: NextRequest, context: { params: Promise<{ surveyId: string }> }) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_MANAGE");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  const parsed = surveyDefinitionImportSchema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(surveyId).success || !parsed.success) return NextResponse.json({ message: "The imported survey definition is invalid.", issues: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json({ survey: await importSurveyDefinition(access.context, surveyId, parsed.data) }); }
  catch (error) { return surveyApiError(error); }
}
