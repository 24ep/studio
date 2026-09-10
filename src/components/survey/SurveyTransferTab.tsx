"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FileJson, FileSpreadsheet, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SurveyDetail } from "./survey-workspace-types";

export function SurveyTransferTab({ survey, onImported }: { survey: SurveyDetail; onImported: () => Promise<void> }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"replace"|"append">("replace");
  const [dragging, setDragging] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  async function importDefinition() {
    if (!file) return;
    setWorking(true);
    try {
      const definition = file.name.toLowerCase().endsWith(".csv") ? definitionFromCsv(await file.text()) : definitionFromJson(await file.text());
      const response = await fetch(`/api/surveys/${survey.id}/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, expectedVersion: survey.version, definition: { title: definition.title, description: definition.description, introduction: definition.introduction, sections: definition.sections || [], questions: definition.questions || [] } }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Unable to import survey.");
      toast.success("Survey definition imported"); setFile(null); await onImported();
    } catch (error) { toast.error(error instanceof Error ? error.message : "The file is not a valid survey definition."); }
    finally { setWorking(false); }
  }
  function downloadQuestionTemplate() {
    const csv = "section,question_type,question,required,options,dimension\r\nGeneral,single_choice,How satisfied are you?,true,Very satisfied|Satisfied|Neutral|Dissatisfied,Satisfaction\r\n";
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv" })); link.download = "survey-question-import-template.csv"; link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="min-h-[calc(100vh-190px)] w-full bg-background">
    <div className="border-b border-border px-5 py-8 sm:px-8 lg:px-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Data portability</p><div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h2 className="text-3xl font-bold tracking-tight">Import & Export</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Move complete survey definitions between environments, or export response data for analysis. This workspace intentionally uses the full page width for large files, validation results, and data previews.</p></div><div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400"><ShieldCheck className="h-5 w-5" />Privacy permissions are enforced on every export</div></div></div>
    <div className="grid w-full lg:grid-cols-2">
      <section className="border-b border-border p-5 sm:p-8 lg:min-h-[570px] lg:border-b-0 lg:border-r lg:p-12"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-primary text-primary-foreground"><ArrowUpFromLine className="h-5 w-5" /></span><div><h3 className="text-xl font-semibold">Import definition</h3><p className="text-sm text-muted-foreground">JSON survey packages up to 2,000 questions.</p></div></div>
        <div onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); setFile(event.dataTransfer.files[0] || null); }} className={cn("mt-8 grid min-h-64 place-items-center border border-dashed p-8 text-center transition-colors", dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20")}><div><UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" /><h4 className="mt-4 font-semibold">Drop a survey definition here</h4><p className="mt-1 text-sm text-muted-foreground">or select a JSON or question CSV file from your computer</p><input ref={inputRef} type="file" accept="application/json,.json,text/csv,.csv" className="sr-only" onChange={event => setFile(event.target.files?.[0] || null)} /><Button variant="outline" className="mt-5" onClick={() => inputRef.current?.click()}>Choose file</Button>{file && <div className="mx-auto mt-5 flex max-w-md items-center gap-3 border border-border bg-background p-3 text-left"><FileJson className="h-6 w-6 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB · ready to validate</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>}</div></div>
        <div className="mt-6"><Label>Import behavior</Label><div className="mt-2 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setMode("replace")} className={cn("border p-4 text-left", mode === "replace" ? "border-primary bg-primary/5" : "border-border")}><strong className="text-sm">Replace structure</strong><p className="mt-1 text-xs text-muted-foreground">Replace sections and questions while keeping survey identity.</p></button><button type="button" onClick={() => setMode("append")} className={cn("border p-4 text-left", mode === "append" ? "border-primary bg-primary/5" : "border-border")}><strong className="text-sm">Append content</strong><p className="mt-1 text-xs text-muted-foreground">Add imported sections after existing content.</p></button></div></div>
        <Button className="mt-6 w-full sm:w-auto" disabled={!file || working || ["active","closed","archived"].includes(survey.status)} onClick={() => void importDefinition()}><ArrowUpFromLine className="mr-2 h-4 w-4" />{working ? "Validating and importing…" : "Import survey"}</Button>
      </section>
      <section className="p-5 sm:p-8 lg:min-h-[570px] lg:p-12"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-emerald-700 text-white"><ArrowDownToLine className="h-5 w-5" /></span><div><h3 className="text-xl font-semibold">Export data</h3><p className="text-sm text-muted-foreground">Portable formats for backup, analysis, and audit.</p></div></div>
        <div className="mt-8 divide-y divide-border border-y border-border"><ExportRow icon={FileJson} title="Survey definition" description="Sections, questions, options, validation, and branching logic." action="Download JSON" href={`/api/surveys/${survey.id}/export?format=definition`} /><ExportRow icon={FileSpreadsheet} title="Response workbook" description="Excel workbook with structured answer rows and respondent privacy applied." action="Download XLSX" href={`/api/surveys/${survey.id}/export?format=xlsx`} /><ExportRow icon={FileText} title="Response dataset" description="UTF-8 CSV for BI tools, statistical packages, and archives." action="Download CSV" href={`/api/surveys/${survey.id}/export?format=csv`} /></div>
        <div className="mt-8 bg-muted/35 p-5"><h4 className="font-semibold">Build from a spreadsheet</h4><p className="mt-1 text-sm leading-6 text-muted-foreground">Use the question template to prepare content collaboratively, then convert it to a validated definition before importing.</p><Button variant="link" className="mt-2 h-auto p-0" onClick={downloadQuestionTemplate}>Download question template</Button></div>
      </section>
    </div>
  </div>;
}

function ExportRow({ icon: Icon, title, description, action, href }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; action: string; href: string }) { return <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"><Icon className="h-6 w-6 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Button asChild variant="outline" className="shrink-0"><a href={href}><ArrowDownToLine className="mr-2 h-4 w-4" />{action}</a></Button></div>; }

function definitionFromJson(text: string) { const parsed = JSON.parse(text); return parsed.definition || parsed.survey || parsed; }
function definitionFromCsv(text: string) {
  const rows = parseCsv(text.replace(/^\uFEFF/, "")); const header = rows.shift()?.map(value => value.trim().toLowerCase()) || [];
  const valueAt = (row: string[], name: string) => row[header.indexOf(name)]?.trim() || "";
  const sections = new Map<string, { id: string; title: string; description: string; sortOrder: number; conditions: never[]; randomizeQuestions: boolean }>();
  const questions: Array<Record<string, unknown>> = [];
  for (const row of rows.filter(item => item.some(Boolean))) {
    const sectionName = valueAt(row,"section") || "Questions";
    if (!sections.has(sectionName)) sections.set(sectionName,{ id: crypto.randomUUID(), title: sectionName, description: "", sortOrder: sections.size, conditions: [], randomizeQuestions: false });
    const options = valueAt(row,"options").split("|").map(value => value.trim()).filter(Boolean).map(label => ({ id: crypto.randomUUID(), label, value: label.toLowerCase().replace(/\W+/g,"_") }));
    questions.push({ id: crypto.randomUUID(), sectionId: sections.get(sectionName)!.id, type: valueAt(row,"question_type") || "short_text", text: valueAt(row,"question"), isRequired: ["true","yes","1"].includes(valueAt(row,"required").toLowerCase()), sortOrder: questions.filter(question => question.sectionId === sections.get(sectionName)!.id).length, config: options.length ? { options } : {}, logic: [], dimension: valueAt(row,"dimension") || null, tags: [] });
  }
  return { sections: [...sections.values()], questions };
}
function parseCsv(text: string) { const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false; for (let index=0; index<text.length; index++) { const char=text[index]; if (char==='"' && quoted && text[index+1]==='"') { value+='"'; index++; } else if (char==='"') quoted=!quoted; else if (char===',' && !quoted) { row.push(value); value=""; } else if ((char==='\n'||char==='\r') && !quoted) { if (char==='\r'&&text[index+1]==='\n') index++; row.push(value); if (row.some(Boolean)) rows.push(row); row=[]; value=""; } else value+=char; } row.push(value); if (row.some(Boolean)) rows.push(row); return rows; }
