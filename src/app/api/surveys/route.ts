import { NextResponse, type NextRequest } from "next/server";

import { surveyCreateSchema } from "@/lib/survey/survey-contracts";
import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import {
  createSurvey,
  getSurveyDashboard,
  listSurveys,
  listSurveyTemplates,
} from "@/lib/survey/survey-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const view = request.nextUrl.searchParams.get("view");
  try {
    if (view === "dashboard") {
      return NextResponse.json(await getSurveyDashboard(access.context));
    }
    if (view === "templates") {
      const forbidden = requireSurveyPermission(access.session, "SURVEY_VIEW");
      if (forbidden) return forbidden;
      return NextResponse.json({ templates: await listSurveyTemplates() });
    }
    const forbidden = requireSurveyPermission(access.session, "SURVEY_VIEW");
    if (forbidden) return forbidden;
    return NextResponse.json({
      surveys: await listSurveys(access.context, {
        status: request.nextUrl.searchParams.get("status") || undefined,
        search: request.nextUrl.searchParams.get("search") || undefined,
        limit: Number(request.nextUrl.searchParams.get("limit") || 50),
        offset: Number(request.nextUrl.searchParams.get("offset") || 0),
      }),
    });
  } catch (error) {
    return surveyApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_CREATE");
  if (forbidden) return forbidden;
  const parsed = surveyCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      message: "Invalid survey configuration.",
      errors: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }
  try {
    return NextResponse.json({ survey: await createSurvey(access.context, parsed.data) }, { status: 201 });
  } catch (error) {
    return surveyApiError(error);
  }
}

