import { NextResponse, type NextRequest } from "next/server";

import { requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { responseSaveSchema } from "@/lib/survey/survey-contracts";
import { saveResponse } from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const parsed = responseSaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.responseToken) {
    return NextResponse.json({ message: "Invalid response payload.", errors: parsed.success ? {} : parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    return NextResponse.json(await saveResponse({
      responseToken: parsed.data.responseToken,
      expectedVersion: parsed.data.expectedVersion,
      answers: parsed.data.answers,
      submit: parsed.data.submit,
    }));
  } catch (error) {
    return surveyApiError(error);
  }
}

