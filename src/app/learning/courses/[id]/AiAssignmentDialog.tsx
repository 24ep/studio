"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardPen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type LessonOption = { id: string; title: string; sectionTitle: string };
type Result = { assignment: { title: string; deliverable: string; estimatedMinutes: number; rubric: Array<{ criterion: string; weight: number }> }; lessonTitle: string };

export function AiAssignmentDialog({ courseId, courseTitle, lessons, open, onOpenChange, onCreated }: { courseId: string; courseTitle: string; lessons: LessonOption[]; open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [lessonId, setLessonId] = React.useState('');
  const [goal, setGoal] = React.useState('Apply the most important skills from this course in a realistic workplace scenario.');
  const [submissionType, setSubmissionType] = React.useState('either');
  const [difficulty, setDifficulty] = React.useState('independent');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<Result | null>(null);

  React.useEffect(() => { if (open && !lessonId && lessons.length) setLessonId(lessons[lessons.length - 1].id); }, [lessonId, lessons, open]);

  const generate = async () => {
    if (!lessonId) return setError('Choose a lesson for the assignment.');
    setIsGenerating(true); setError('');
    try {
      const response = await fetch(`/api/learning/courses/${courseId}/generate-assignment`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, goal, submissionType, difficulty }) });
      const payload = await response.json() as { data?: Result; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || 'Unable to create assignment.');
      setResult(payload.data); onCreated();
    } catch (generationError) { setError(generationError instanceof Error ? generationError.message : 'Unable to create assignment.'); }
    finally { setIsGenerating(false); }
  };

  const close = (nextOpen: boolean) => {
    if (isGenerating) return;
    onOpenChange(nextOpen);
    if (!nextOpen) window.setTimeout(() => { setResult(null); setError(''); }, 200);
  };

  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-0 sm:max-w-[680px]">
    <div className="border-b border-[#dbe4df] bg-[#f1f6e8] px-6 py-6 text-[#183e37] dark:border-zinc-800 dark:bg-[#17312c] dark:text-[#eef5e6] sm:px-8"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em]"><Sparkles className="h-4 w-4" />AI assignment maker</span><DialogHeader className="mt-3 text-left"><DialogTitle className="text-2xl tracking-[-.035em]">Turn learning into practice</DialogTitle><DialogDescription className="max-w-lg text-[#526c65] dark:text-[#bfd0c9]">Create a course-grounded assignment and rubric for <strong>{courseTitle}</strong>. It will be added to a new draft version.</DialogDescription></DialogHeader></div>
    {result ? <div className="px-6 py-8 sm:px-8"><CheckCircle2 className="h-10 w-10 text-emerald-600" /><p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-300">Assignment added to draft</p><h3 className="mt-2 text-2xl font-bold tracking-[-.03em]">{result.assignment.title}</h3><p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">Added to {result.lessonTitle} · about {result.assignment.estimatedMinutes} minutes</p><p className="mt-5 border-y border-slate-200 py-4 text-sm leading-6 dark:border-zinc-800">{result.assignment.deliverable}</p><div className="mt-5 flex flex-wrap gap-2">{result.assignment.rubric.map(item => <span key={item.criterion} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold dark:bg-zinc-800">{item.criterion} · {item.weight}%</span>)}</div><div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link href={`/learning/courses/${courseId}/studio`}>Review in Studio<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="outline" onClick={() => close(false)}>Close</Button></div></div>
    : isGenerating ? <div className="grid min-h-[360px] place-items-center px-6 text-center" role="status"><div><span className="relative mx-auto grid h-20 w-20 place-items-center"><span className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-[#316be8] motion-reduce:animate-none dark:border-zinc-800 dark:border-t-blue-400" /><ClipboardPen className="h-8 w-8 text-[#316be8]" /></span><h3 className="mt-6 text-xl font-bold">Designing the practice task</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Reading the course, shaping a realistic scenario, and balancing the review rubric.</p></div></div>
    : <><div className="grid gap-5 px-6 py-6 sm:px-8"><div><Label htmlFor="assignment-lesson">Add after lesson</Label><select id="assignment-lesson" value={lessonId} onChange={event => setLessonId(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Choose a lesson</option>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.sectionTitle} — {lesson.title}</option>)}</select></div><div><Label htmlFor="assignment-goal">What should learners demonstrate?</Label><Textarea id="assignment-goal" value={goal} onChange={event => setGoal(event.target.value)} className="mt-2 min-h-24" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="assignment-submission">Submission</Label><select id="assignment-submission" value={submissionType} onChange={event => setSubmissionType(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="either">Written or file</option><option value="written">Written response</option><option value="file">File upload</option></select></div><div><Label htmlFor="assignment-difficulty">Learner support</Label><select id="assignment-difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="guided">Guided</option><option value="independent">Independent</option><option value="stretch">Stretch challenge</option></select></div></div>{error && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</p>}</div><DialogFooter className="border-t border-slate-200 px-6 py-4 dark:border-zinc-800 sm:px-8"><Button variant="outline" onClick={() => close(false)}>Cancel</Button><Button onClick={() => void generate()} disabled={!lessons.length} className="bg-[#316be8] hover:bg-[#285dce]"><Sparkles className="mr-2 h-4 w-4" />Create assignment</Button></DialogFooter></>}
  </DialogContent></Dialog>;
}
