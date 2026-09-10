"use client";

import * as React from "react";
import { CalendarClock, Plus, Rocket, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AudienceRule, SurveyDetail } from "./survey-workspace-types";

type Preview = { totalEvaluated: number; included: number; excluded: number; duplicates: number; warnings: string[]; sample: Array<{ id: string; name: string; employeeNumber: string; department?: string; location?: string }> };
const attributes = [["employee","Employee"],["company","Company"],["business_unit","Business unit"],["department","Department"],["manager","Manager"],["position","Position"],["location","Location"],["employment_type","Employment type"],["status","Status"],["join_date","Join date"],["tenure_months","Tenure"],["client","Client"]];
const operators = [["in","is any of"],["not_in","is not any of"],["equals","equals"],["not_equals","does not equal"],["contains","contains"],["before","before"],["after","after"],["between","between"]];

export function SurveyAudienceTab({ survey, onSaved }: { survey: SurveyDetail; onSaved: () => Promise<void> }) {
  const [rules, setRules] = React.useState<AudienceRule[]>(survey.audienceRules || []);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [working, setWorking] = React.useState(false);
  const [channels, setChannels] = React.useState(["in_app","ess"]);
  const [publishAt, setPublishAt] = React.useState("");
  const [closesAt, setClosesAt] = React.useState(survey.closesAt?.slice(0,16) || "");
  React.useEffect(() => setRules(survey.audienceRules || []), [survey]);

  function addRule() { setRules(previous => [...previous, { mode: "include", attribute: "status", operator: "in", value: ["active"], sortOrder: previous.length }]); }
  async function previewAudience() {
    setWorking(true);
    try { const response = await fetch(`/api/surveys/${survey.id}/audience-preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules, snapshotMode: "fixed" }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message || "Unable to preview audience."); setPreview(body.preview); toast.success("Audience rules saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to preview audience."); }
    finally { setWorking(false); }
  }
  async function publish() {
    if (!preview) return toast.error("Preview the audience before publishing.");
    setWorking(true);
    try { const response = await fetch(`/api/surveys/${survey.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmationPopulation: preview.included, channels, publishAt: publishAt ? new Date(publishAt).toISOString() : null, closesAt: closesAt ? new Date(closesAt).toISOString() : null, idempotencyKey: crypto.randomUUID() }) }); const body = await response.json(); if (!response.ok) throw new Error(body.message || "Unable to publish survey."); toast.success(body.status === "scheduled" ? "Survey scheduled" : "Survey published"); await onSaved(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to publish survey."); }
    finally { setWorking(false); }
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
    <section className="rounded-2xl border border-border bg-background"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Audience assignment</h2><p className="text-sm text-muted-foreground">Combine inclusive and exclusive workforce rules.</p></div><Button variant="outline" onClick={addRule}><Plus className="mr-2 h-4 w-4" />Rule</Button></div>
      <div className="space-y-3 p-5">{rules.length === 0 ? <div className="border border-dashed border-border px-6 py-12 text-center"><Users className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No audience rules</h3><p className="mt-1 text-sm text-muted-foreground">Add a rule to assign this survey to employees.</p><Button className="mt-4" onClick={addRule}><Plus className="mr-2 h-4 w-4" />Add audience rule</Button></div> : rules.map((rule,index) => <div key={rule.id || index} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[120px_1fr_160px_1.2fr_40px]"><select value={rule.mode} onChange={event => setRules(previous => previous.map((item,i) => i === index ? { ...item, mode: event.target.value as "include"|"exclude" } : item))} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="include">Include</option><option value="exclude">Exclude</option></select><select value={rule.attribute} onChange={event => setRules(previous => previous.map((item,i) => i === index ? { ...item, attribute: event.target.value } : item))} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">{attributes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select value={rule.operator} onChange={event => setRules(previous => previous.map((item,i) => i === index ? { ...item, operator: event.target.value } : item))} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">{operators.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><Input value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "")} onChange={event => setRules(previous => previous.map((item,i) => i === index ? { ...item, value: ["in","not_in","between"].includes(item.operator) ? event.target.value.split(",").map(value => value.trim()).filter(Boolean) : event.target.value } : item))} placeholder="Value or comma-separated values" /><Button variant="ghost" size="icon" onClick={() => setRules(previous => previous.filter((_,i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
      <div className="flex justify-end border-t border-border p-4"><Button onClick={() => void previewAudience()} disabled={working || rules.length === 0}><Search className="mr-2 h-4 w-4" />{working ? "Evaluating…" : "Save & preview"}</Button></div>
    </section>
    <aside className="space-y-5"><section className="rounded-2xl border border-border bg-background p-5"><h2 className="font-semibold">Audience preview</h2>{!preview ? <p className="mt-3 text-sm text-muted-foreground">Save the rules to see the exact population before any invitations are created.</p> : <><div className="mt-4 grid grid-cols-2 gap-3"><div className="bg-primary/5 p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Included</p><p className="mt-1 text-3xl font-bold">{preview.included}</p></div><div className="bg-muted/60 p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Excluded</p><p className="mt-1 text-3xl font-bold">{preview.excluded}</p></div></div><div className="mt-4 space-y-2">{preview.sample.slice(0,5).map(employee => <div key={employee.id} className="flex justify-between gap-3 text-sm"><span className="truncate">{employee.name}</span><span className="shrink-0 text-muted-foreground">{employee.department || employee.location || "—"}</span></div>)}</div></>}</section>
      <section className="rounded-2xl border border-border bg-background p-5"><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /><h2 className="font-semibold">Publish & assign</h2></div><div className="mt-5 space-y-4"><div><Label>Open at</Label><Input type="datetime-local" value={publishAt} onChange={event => setPublishAt(event.target.value)} className="mt-1.5" /></div><div><Label>Close at</Label><Input type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)} className="mt-1.5" /></div><div><Label>Channels</Label><div className="mt-2 space-y-2">{[["in_app","In-app"],["ess","Employee portal"],["email","Email"],["broadcast","Broadcast"]].map(([value,label]) => <label key={value} className="flex items-center justify-between text-sm"><span>{label}</span><Switch checked={channels.includes(value)} onCheckedChange={checked => setChannels(previous => checked ? [...previous,value] : previous.filter(item => item !== value))} /></label>)}</div></div><Button className="w-full" disabled={!preview || channels.length === 0 || working || !survey.questions.length} onClick={() => void publish()}><Rocket className="mr-2 h-4 w-4" />{publishAt ? "Schedule survey" : "Publish and assign"}</Button>{!survey.questions.length && <p className="text-xs text-destructive">Add at least one question before publishing.</p>}</div></section>
    </aside>
  </div>;
}
