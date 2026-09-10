"use client";

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, ChevronLeft, Loader2, LockKeyhole, Save, Send } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

type Option = { id?: string; label: string; value: string };
type SurveyQuestion = {
  id: string;
  sectionId: string;
  type: string;
  text: string;
  description?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  logic?: Array<{ conditions: Array<{ questionId: string; operator: string; value?: unknown }>; action: string; targetQuestionId?: string }>;
  config?: { options?: Option[]; min?: number; max?: number; minLength?: number; maxLength?: number; placeholder?: string; scaleLabels?: { low?: string; high?: string } };
};
type SurveySection = { id: string; title: string; description?: string | null };
type RespondentSurvey = {
  id: string;
  title: string;
  description?: string | null;
  introduction?: string | null;
  completionMessage?: string | null;
  estimatedMinutes: number;
  isRequired: boolean;
  allowDraft: boolean;
  privacyMode: string;
  privacyNotice: string;
  sections: SurveySection[];
  questions: SurveyQuestion[];
  participation: { status?: string; completedAt?: string | null };
};
type ResponseSession = { responseToken: string; version: number; answers: Record<string, unknown> };

function storageKey(surveyId: string) {
  return `survey-response:${surveyId}`;
}

export function SurveyResponsePageClient() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = React.useState<RespondentSurvey | null>(null);
  const [session, setSession] = React.useState<ResponseSession | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [completionMessage, setCompletionMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/surveys/respond/${surveyId}`, { credentials: 'include', cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to open this survey.');
        if (cancelled) return;
        setSurvey(payload.survey);
        if (payload.survey.participation?.status === 'completed') setSubmitted(true);
        const saved = sessionStorage.getItem(storageKey(surveyId));
        if (saved) {
          const parsed = JSON.parse(saved) as ResponseSession;
          if (parsed.responseToken && parsed.version) {
            setSession(parsed);
            setAnswers(parsed.answers || {});
          }
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to open this survey.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [surveyId]);

  const begin = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/surveys/respond/${surveyId}`, { method: 'POST', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to begin the survey.');
      const next = { responseToken: payload.responseToken, version: payload.version, answers: payload.answers || {} };
      setSession(next);
      setAnswers(next.answers);
      sessionStorage.setItem(storageKey(surveyId), JSON.stringify(next));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to begin the survey.');
    } finally {
      setSaving(false);
    }
  };

  const save = async (submit: boolean) => {
    if (!session || !survey) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseToken: session.responseToken, expectedVersion: session.version, answers, submit }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save your response.');
      if (submit) {
        sessionStorage.removeItem(storageKey(surveyId));
        setCompletionMessage(payload.completionMessage || survey.completionMessage || 'Thank you. Your response has been submitted.');
        setSubmitted(true);
      } else {
        const next = { ...session, version: payload.version, answers };
        setSession(next);
        sessionStorage.setItem(storageKey(surveyId), JSON.stringify(next));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your response.');
    } finally {
      setSaving(false);
    }
  };

  const updateAnswer = (questionId: string, value: unknown) => setAnswers(current => ({ ...current, [questionId]: value }));
  const visibleQuestions = survey ? getVisibleQuestions(survey.questions, answers) : [];
  const answered = visibleQuestions.filter(question => question.type === 'information' || hasAnswer(answers[question.id])).length;
  const progress = visibleQuestions.length ? Math.round((answered / visibleQuestions.length) * 100) : 0;

  if (loading) return <SurveyShell><div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading survey…</div></SurveyShell>;
  if (error && !survey) return <SurveyShell><Alert variant="destructive"><AlertTitle>Survey unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></SurveyShell>;
  if (!survey) return null;
  if (submitted) return <SurveyShell><div className="py-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-5 text-2xl font-bold">Response submitted</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{completionMessage || survey.completionMessage || 'Thank you. Your response has been recorded.'}</p><Button asChild variant="outline" className="mt-6"><Link href="/ess">Return to Employee Portal</Link></Button></div></SurveyShell>;

  return (
    <SurveyShell>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4"><Link href="/ess"><ChevronLeft className="mr-1 h-4 w-4" />Employee Portal</Link></Button>
      <header className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><span>{survey.privacyMode} survey</span>{survey.isRequired ? <span>• Required</span> : null}<span>• About {survey.estimatedMinutes} min</span></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{survey.title}</h1>
        {survey.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{survey.description}</p> : null}
        {survey.introduction ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{survey.introduction}</p> : null}
        <Alert className="mt-5"><LockKeyhole className="h-4 w-4" /><AlertTitle>Response privacy</AlertTitle><AlertDescription>{survey.privacyNotice}</AlertDescription></Alert>
      </header>

      {!session ? (
        <div className="py-10 text-center"><p className="text-sm text-muted-foreground">Your response starts when you select Begin survey.</p><Button className="mt-5 min-h-11" disabled={saving} onClick={() => void begin()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Begin survey</Button></div>
      ) : (
        <form className="space-y-8 py-7" onSubmit={event => { event.preventDefault(); void save(true); }}>
          <div><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Completion</span><span>{progress}%</span></div><Progress value={progress} /></div>
          {(survey.sections.length ? survey.sections : [{ id: 'default', title: 'Questions' }]).map(section => {
            const questions = visibleQuestions.filter(question => survey.sections.length === 0 || question.sectionId === section.id);
            if (!questions.length) return null;
            return <section key={section.id} className="space-y-5"><div><h2 className="text-xl font-semibold">{section.title}</h2>{section.description ? <p className="mt-1 text-sm text-muted-foreground">{section.description}</p> : null}</div>{questions.map((question, index) => <QuestionField key={question.id} question={question} number={index + 1} value={answers[question.id]} onChange={value => updateAnswer(question.id, value)} />)}</section>;
          })}
          {error ? <Alert variant="destructive"><AlertTitle>Response not saved</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          <div className="sticky bottom-3 flex flex-col-reverse gap-2 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
            {survey.allowDraft ? <Button type="button" variant="outline" disabled={saving} onClick={() => void save(false)}><Save className="mr-2 h-4 w-4" />Save draft</Button> : null}
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit response</Button>
          </div>
        </form>
      )}
    </SurveyShell>
  );
}

function SurveyShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-muted/30 px-4 py-6 sm:py-10"><div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">{children}</div></main>;
}

function QuestionField({ question, number, value, onChange }: { question: SurveyQuestion; number: number; value: unknown; onChange: (value: unknown) => void }) {
  if (question.type === 'information') return <div className="rounded-lg bg-muted/50 p-4"><h3 className="font-medium">{question.text}</h3>{question.description ? <p className="mt-1 text-sm text-muted-foreground">{question.description}</p> : null}</div>;
  const id = `survey-question-${question.id}`;
  const options = question.config?.options || [];
  const label = <Label htmlFor={id} className="text-sm font-semibold">{number}. {question.text}{question.isRequired ? <span className="ml-1 text-destructive">*</span> : null}</Label>;
  let control: React.ReactNode;
  if (['single_choice', 'yes_no', 'true_false', 'image_choice'].includes(question.type)) {
    const choices = options.length ? options : question.type === 'true_false' ? [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }] : [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }];
    control = <div className="grid gap-2 sm:grid-cols-2">{choices.map(option => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="radio" name={question.id} value={option.value} checked={value === option.value} required={question.isRequired} onChange={() => onChange(option.value)} />{option.label}</label>)}</div>;
  } else if (question.type === 'multiple_choice') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    control = <div className="grid gap-2 sm:grid-cols-2">{options.map(option => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="checkbox" value={option.value} checked={selected.includes(option.value)} onChange={event => onChange(event.target.checked ? [...selected, option.value] : selected.filter(item => item !== option.value))} />{option.label}</label>)}</div>;
  } else if (question.type === 'dropdown') {
    control = <select id={id} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={String(value ?? '')} required={question.isRequired} onChange={event => onChange(event.target.value)}><option value="">Select an answer</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  } else if (['long_text', 'matrix', 'ranking'].includes(question.type)) {
    control = <Textarea id={id} value={String(value ?? '')} required={question.isRequired} minLength={question.config?.minLength} maxLength={question.config?.maxLength} placeholder={question.config?.placeholder} onChange={event => onChange(event.target.value)} className="min-h-28" />;
  } else if (['rating', 'likert', 'nps', 'enps', 'slider', 'percentage'].includes(question.type)) {
    const min = question.config?.min ?? (question.type === 'nps' || question.type === 'enps' ? 0 : 1);
    const max = question.config?.max ?? (question.type === 'percentage' ? 100 : question.type === 'nps' || question.type === 'enps' ? 10 : 5);
    control = <div><Input id={id} type="range" min={min} max={max} value={Number(value ?? min)} onChange={event => onChange(Number(event.target.value))} /><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{question.config?.scaleLabels?.low || min}</span><strong className="text-foreground">{Number(value ?? min)}</strong><span>{question.config?.scaleLabels?.high || max}</span></div></div>;
  } else if (['consent', 'acknowledgment'].includes(question.type)) {
    control = <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" className="mt-0.5" checked={value === true} required={question.isRequired} onChange={event => onChange(event.target.checked)} /><span>I agree and acknowledge this statement.</span></label>;
  } else {
    const inputType = question.type === 'numeric' ? 'number' : question.type === 'date' ? 'date' : question.type === 'time' ? 'time' : question.type === 'file_upload' ? 'url' : 'text';
    control = <Input id={id} type={inputType} value={String(value ?? '')} required={question.isRequired} min={question.config?.min} max={question.config?.max} minLength={question.config?.minLength} maxLength={question.config?.maxLength} placeholder={question.type === 'file_upload' ? 'Paste a secure file URL' : question.config?.placeholder} onChange={event => onChange(inputType === 'number' ? Number(event.target.value) : event.target.value)} />;
  }
  return <div className="space-y-2 rounded-xl border border-border p-4">{label}{question.description ? <p className="text-sm text-muted-foreground">{question.description}</p> : null}{control}{question.helpText ? <p className="text-xs text-muted-foreground">{question.helpText}</p> : null}</div>;
}

function hasAnswer(value: unknown) {
  return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
}

function getVisibleQuestions(questions: SurveyQuestion[], answers: Record<string, unknown>) {
  const showTargets = new Set<string>(); const matchedShows = new Set<string>(); const hidden = new Set<string>();
  for (const source of questions) for (const rule of source.logic || []) {
    if (!rule.targetQuestionId) continue;
    const matches = rule.conditions.every(condition => conditionMatches(answers[condition.questionId], condition.operator, condition.value));
    if (rule.action === 'show') { showTargets.add(rule.targetQuestionId); if (matches) matchedShows.add(rule.targetQuestionId); }
    if (rule.action === 'hide' && matches) hidden.add(rule.targetQuestionId);
  }
  return questions.filter(question => (!showTargets.has(question.id) || matchedShows.has(question.id)) && !hidden.has(question.id));
}

function conditionMatches(actual: unknown, operator: string, expected?: unknown) {
  if (operator === 'equals') return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '') === String(expected ?? '');
  if (operator === 'not_equals') return Array.isArray(actual) ? !actual.includes(expected) : String(actual ?? '') !== String(expected ?? '');
  if (operator === 'contains') return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  if (operator === 'greater_than') return Number(actual) > Number(expected);
  if (operator === 'less_than') return Number(actual) < Number(expected);
  if (operator === 'answered') return hasAnswer(actual);
  if (operator === 'not_answered') return !hasAnswer(actual);
  return false;
}
