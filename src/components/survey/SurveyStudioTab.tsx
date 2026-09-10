"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { QUESTION_TYPES, type SurveyDetail, type SurveyQuestion, type SurveySection } from "./survey-workspace-types";

const optionTypes = new Set(["single_choice", "multiple_choice", "dropdown", "image_choice", "ranking", "matrix"]);
const uid = () => crypto.randomUUID();

export function SurveyStudioTab({ survey, onSaved }: { survey: SurveyDetail; onSaved: () => Promise<void> }) {
  const [sections, setSections] = React.useState<SurveySection[]>(survey.sections);
  const [questions, setQuestions] = React.useState<SurveyQuestion[]>(survey.questions);
  const [selectedId, setSelectedId] = React.useState<string | null>(survey.questions[0]?.id || null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setSections(survey.sections); setQuestions(survey.questions); }, [survey]);

  function addSection() {
    const section: SurveySection = { id: uid(), title: `Section ${sections.length + 1}`, description: "", sortOrder: sections.length, conditions: [], randomizeQuestions: false };
    setSections(previous => [...previous, section]);
  }
  function addQuestion(sectionId: string, type = "single_choice") {
    const sameSection = questions.filter(question => question.sectionId === sectionId);
    const question: SurveyQuestion = { id: uid(), sectionId, type, text: "Untitled question", description: "", helpText: "", isRequired: false, sortOrder: sameSection.length, config: optionTypes.has(type) ? { options: [{ id: uid(), label: "Option 1", value: "option_1" }, { id: uid(), label: "Option 2", value: "option_2" }] } : {}, logic: [], dimension: "", tags: [] };
    setQuestions(previous => [...previous, question]); setSelectedId(question.id);
  }
  function updateQuestion(id: string, patch: Partial<SurveyQuestion>) { setQuestions(previous => previous.map(question => question.id === id ? { ...question, ...patch } : question)); }
  function moveQuestion(id: string, direction: -1 | 1) {
    const current = questions.find(question => question.id === id); if (!current) return;
    const group = questions.filter(question => question.sectionId === current.sectionId).sort((a,b) => a.sortOrder - b.sortOrder);
    const index = group.findIndex(question => question.id === id); const other = group[index + direction]; if (!other) return;
    setQuestions(previous => previous.map(question => question.id === id ? { ...question, sortOrder: other.sortOrder } : question.id === other.id ? { ...question, sortOrder: current.sortOrder } : question));
  }
  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/surveys/${survey.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedVersion: survey.version, sections: sections.map((section,index) => ({ ...section, sortOrder: index })), questions }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Unable to save survey.");
      toast.success("Survey structure saved"); await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save survey."); }
    finally { setSaving(false); }
  }

  const selected = questions.find(question => question.id === selectedId);
  return (
    <div className="grid min-h-[680px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-semibold">Form studio</h2><p className="text-sm text-muted-foreground">Build the respondent experience section by section.</p></div><div className="flex gap-2"><Button variant="outline" onClick={addSection}><Plus className="mr-2 h-4 w-4" />Section</Button><Button onClick={() => void save()} disabled={saving || ["active","closed","archived"].includes(survey.status)}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save changes"}</Button></div></div>
        <div className="space-y-5 bg-muted/20 p-4 sm:p-6">
          {sections.length === 0 ? <div className="border border-dashed border-border bg-background px-6 py-14 text-center"><h3 className="font-semibold">Start with a section</h3><p className="mt-1 text-sm text-muted-foreground">Sections organize long surveys and provide branching targets.</p><Button className="mt-5" onClick={addSection}><Plus className="mr-2 h-4 w-4" />Add first section</Button></div> : sections.map((section, sectionIndex) => {
            const sectionQuestions = questions.filter(question => question.sectionId === section.id).sort((a,b) => a.sortOrder - b.sortOrder);
            return <article key={section.id} className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex items-start gap-3 border-b border-border bg-muted/25 p-4"><GripVertical className="mt-2 h-4 w-4 text-muted-foreground" /><div className="min-w-0 flex-1"><Input value={section.title} onChange={event => setSections(previous => previous.map(item => item.id === section.id ? { ...item, title: event.target.value } : item))} className="border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0" /><Input value={section.description || ""} onChange={event => setSections(previous => previous.map(item => item.id === section.id ? { ...item, description: event.target.value } : item))} placeholder="Optional section introduction" className="mt-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" /></div><Badge variant="outline">{sectionQuestions.length} questions</Badge><Button variant="ghost" size="icon" aria-label="Delete section" onClick={() => { setSections(previous => previous.filter(item => item.id !== section.id)); setQuestions(previous => previous.filter(question => question.sectionId !== section.id)); }}><Trash2 className="h-4 w-4" /></Button></div>
              <div className="divide-y divide-border">{sectionQuestions.map((question,index) => <button type="button" key={question.id} onClick={() => setSelectedId(question.id)} className={cn("flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40", selectedId === question.id && "bg-primary/5")}><GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /><span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-muted-foreground">{index + 1}</span><div className="min-w-0 flex-1"><p className="font-medium">{question.text}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="secondary" className="font-normal">{QUESTION_TYPES.find(item => item[0] === question.type)?.[1] || question.type}</Badge>{question.isRequired && <Badge variant="outline">Required</Badge>}{question.logic.length > 0 && <Badge variant="outline">Logic</Badge>}</div></div><div className="flex"><Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={event => { event.stopPropagation(); moveQuestion(question.id,-1); }}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={index === sectionQuestions.length - 1} onClick={event => { event.stopPropagation(); moveQuestion(question.id,1); }}><ArrowDown className="h-4 w-4" /></Button></div></button>)}</div>
              <div className="p-3"><Button variant="ghost" onClick={() => addQuestion(section.id)}><Plus className="mr-2 h-4 w-4" />Add question</Button></div>
            </article>;
          })}
        </div>
      </section>
      <aside className="self-start rounded-2xl border border-border bg-background xl:sticky xl:top-16">
        <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Question settings</h2><p className="text-sm text-muted-foreground">Content, validation, options, and branching.</p></div>
        {!selected ? <div className="p-8 text-center text-sm text-muted-foreground">Select a question to edit it.</div> : <QuestionEditor question={selected} sections={sections} questions={questions} onChange={patch => updateQuestion(selected.id, patch)} onDuplicate={() => { const clone = { ...selected, id: uid(), text: `${selected.text} (copy)`, sortOrder: questions.filter(item => item.sectionId === selected.sectionId).length }; setQuestions(previous => [...previous, clone]); setSelectedId(clone.id); }} onDelete={() => { setQuestions(previous => previous.filter(item => item.id !== selected.id)); setSelectedId(null); }} />}
      </aside>
    </div>
  );
}

function QuestionEditor({ question, sections, questions, onChange, onDuplicate, onDelete }: { question: SurveyQuestion; sections: SurveySection[]; questions: SurveyQuestion[]; onChange: (patch: Partial<SurveyQuestion>) => void; onDuplicate: () => void; onDelete: () => void }) {
  const options = question.config.options || [];
  return <div className="space-y-5 p-5">
    <div><Label>Question</Label><Textarea value={question.text} onChange={event => onChange({ text: event.target.value })} className="mt-1.5 min-h-20" /></div>
    <div><Label>Type</Label><select value={question.type} onChange={event => onChange({ type: event.target.value, config: optionTypes.has(event.target.value) && !question.config.options ? { ...question.config, options: [] } : question.config })} className="mt-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{QUESTION_TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div><Label>Description</Label><Textarea value={question.description || ""} onChange={event => onChange({ description: event.target.value })} className="mt-1.5" /></div>
    <div className="flex items-center justify-between"><div><Label>Required</Label><p className="text-xs text-muted-foreground">Must be answered before submission.</p></div><Switch checked={question.isRequired} onCheckedChange={checked => onChange({ isRequired: checked })} /></div>
    {optionTypes.has(question.type) && <div><div className="mb-2 flex items-center justify-between"><Label>Answer options</Label><Button size="sm" variant="ghost" onClick={() => onChange({ config: { ...question.config, options: [...options, { id: uid(), label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }] } })}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button></div><div className="space-y-2">{options.map((option,index) => <div key={option.id} className="flex gap-2"><Input value={option.label} onChange={event => { const next = [...options]; next[index] = { ...option, label: event.target.value, value: event.target.value.toLowerCase().replace(/\W+/g,"_") }; onChange({ config: { ...question.config, options: next } }); }} /><Button size="icon" variant="ghost" onClick={() => onChange({ config: { ...question.config, options: options.filter(item => item.id !== option.id) } })}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div>}
    <div><Label>Reporting dimension</Label><Input value={question.dimension || ""} onChange={event => onChange({ dimension: event.target.value })} placeholder="e.g. Leadership, Wellbeing" className="mt-1.5" /></div>
    <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-semibold">Branching logic</summary><p className="mt-2 text-xs text-muted-foreground">When this answer matches, show another question.</p><div className="mt-3 space-y-2"><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={String((question.logic[0] as { targetQuestionId?: string } | undefined)?.targetQuestionId || "")} onChange={event => { const targetId = event.target.value; onChange({ logic: targetId ? [{ id: uid(), conditions: [{ questionId: question.id, operator: "equals", value: "yes" }], action: "show", targetQuestionId: targetId }] : [] }); }}><option value="">No branch</option>{questions.filter(item => item.id !== question.id).map(item => <option key={item.id} value={item.id}>Show: {item.text}</option>)}</select>{question.logic.length > 0 && <Input aria-label="Trigger answer value" value={String((question.logic[0] as { conditions: Array<{ value?: unknown }> }).conditions[0].value || "")} onChange={event => { const logic = structuredClone(question.logic) as Array<{ conditions: Array<{ value?: unknown }> }>; logic[0].conditions[0].value = event.target.value; onChange({ logic }); }} placeholder="When answer equals, e.g. yes" />}</div></details>
    <div className="flex gap-2 border-t border-border pt-4"><Button variant="outline" className="flex-1" onClick={onDuplicate}><Copy className="mr-2 h-4 w-4" />Duplicate</Button><Button variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div>
  </div>;
}
