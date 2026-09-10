import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSurveyPermission, requireSurveySession, surveyApiError } from "@/lib/survey/survey-api";
import { getSurveyExportData } from "@/lib/survey/survey-operations";

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest, context: { params: Promise<{ surveyId: string }> }) {
  const access = await requireSurveySession();
  if (access.error) return access.error;
  const forbidden = requireSurveyPermission(access.session, "SURVEY_EXPORT");
  if (forbidden) return forbidden;
  const { surveyId } = await context.params;
  if (!z.string().uuid().safeParse(surveyId).success) return NextResponse.json({ message: "Invalid survey identifier." }, { status: 400 });
  const format = request.nextUrl.searchParams.get("format") || "csv";
  try {
    const data = await getSurveyExportData(access.context, surveyId);
    const safeName = data.survey.title.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "survey";
    if (format === "definition") {
      const definition = { schemaVersion: 1, exportedAt: new Date().toISOString(), survey: { title: data.survey.title, description: data.survey.description, introduction: data.survey.introduction, sections: data.survey.sections, questions: data.survey.questions } };
      return new NextResponse(JSON.stringify(definition, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${safeName}-definition.json"` } });
    }
    const rows = data.answers.map(row => [row.responseId, row.referenceCode, row.respondent, row.submittedAt, row.questionId, row.question, row.type, row.value]);
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "hrive Survey Studio";
      const sheet = workbook.addWorksheet("Responses");
      sheet.columns = ["Response ID", "Reference", "Respondent", "Submitted at", "Question ID", "Question", "Type", "Answer"].map(header => ({ header, key: header, width: header === "Question" || header === "Answer" ? 42 : 20 }));
      rows.forEach(row => sheet.addRow(row.map(value => typeof value === "object" ? JSON.stringify(value) : value)));
      sheet.getRow(1).font = { bold: true };
      sheet.autoFilter = { from: "A1", to: "H1" };
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${safeName}-responses.xlsx"` } });
    }
    const csv = [["Response ID", "Reference", "Respondent", "Submitted at", "Question ID", "Question", "Type", "Answer"], ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${safeName}-responses.csv"` } });
  } catch (error) { return surveyApiError(error); }
}
